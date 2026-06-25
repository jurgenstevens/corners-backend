import Product from '../models/product.js'
import Connection from '../models/connection.js'
import Business from '../models/business.js'
import Notification from '../models/notification.js'
import VoteAbuseFlag from '../models/voteAbuseFlag.js'
import { Profile } from '../models/profile.js'

// GET /api/products — returns all active products for the authenticated business,
// populating requestedBy so the owner can see which patron submitted each request
export async function index(req, res) {
  try {
    const products = await Product.find({ business: req.user.profileId, isActive: true })
      .populate('requestedBy', 'name')
      .populate('votedBy', 'name')
      .sort('-createdAt')
    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function indexForPatron(req, res) {
  try {
    const connections = await Connection.find({ patron: req.user.profileId, status: 'approved' }).select('business')
    const businessIds = connections.map(c => c.business)

    const businesses = await Business.find({ _id: { $in: businessIds } }).select('profile')
    const profileIds = businesses.map(b => b.profile)

    const products = await Product.find({
      business: { $in: profileIds },
      isActive: true,
      $or: [
        { status: { $in: ['approved', 'ready_to_stock', 'stocked'] } },
        { status: { $in: ['pending', 'needs_info'] }, requestedBy: req.user.profileId },
      ],
    }).populate('business', 'name photo').sort('-createdAt')

    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function indexPromotionsForPatron(req, res) {
  try {
    const connections = await Connection.find({ patron: req.user.profileId, status: 'approved' }).select('business')
    const businessIds = connections.map(c => c.business)

    const businesses = await Business.find({ _id: { $in: businessIds } }).select('profile displayName')
    const profileIds = businesses.map(b => b.profile)

    const products = await Product.find({
      business: { $in: profileIds },
      status: 'on_sale',
      isActive: true,
    }).populate('business', 'name photo').sort('-updatedAt')

    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function create(req, res) {
  try {
    const product = await Product.create({ ...req.body, business: req.user.profileId })
    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

// POST /api/products/request/:businessId — patron submits a product request for a specific business.
// Requires an approved connection; creates the product with status 'pending' and notifies the business owner.
export async function requestProduct(req, res) {
  try {
    const { businessId } = req.params
    console.log('requestProduct — businessId:', businessId, '| patron:', req.user.profileId)
    const business = await Business.findById(businessId)
    if (!business) return res.status(404).json({ err: 'Business not found' })

    // verify the patron has an approved connection to this business before allowing a request
    const conn = await Connection.findOne({ patron: req.user.profileId, business: businessId, status: 'approved' })
    if (!conn) {
      console.log('requestProduct — no approved connection found for patron:', req.user.profileId, '| business:', businessId)
      return res.status(403).json({ err: 'You must be connected to this business to request a product' })
    }

    const product = await Product.create({
      ...req.body,
      business: business.profile,
      requestedBy: req.user.profileId,
      votedBy: [req.user.profileId],
      currentTally: 1,
      status: 'pending',
    })
    console.log('requestProduct — product created:', product._id)

    await Notification.create({
      recipient: business.profile,
      type: 'product_request',
      message: `A patron has requested a product: "${product.name}"`,
      relatedId: product._id,
    })

    res.status(201).json(product)
  } catch (err) {
    console.log('requestProduct — ERROR:', err.message)
    res.status(500).json({ err: err.message })
  }
}

export async function indexForPatronByBusiness(req, res) {
  try {
    const { businessId } = req.params
    console.log('indexForPatronByBusiness — businessId:', businessId, '| patron:', req.user.profileId)

    const business = await Business.findById(businessId)
    if (!business) return res.status(404).json({ err: 'Business not found' })

    const conn = await Connection.findOne({ patron: req.user.profileId, business: businessId, status: 'approved' })
    if (!conn) return res.status(403).json({ err: 'Not connected to this business' })

    const products = await Product.find({
      business: business.profile,
      isActive: true,
      $or: [
        { status: { $in: ['approved', 'ready_to_stock', 'stocked'] } },
        { status: { $in: ['pending', 'needs_info'] }, requestedBy: req.user.profileId },
      ],
    }).sort('-createdAt')

    console.log('indexForPatronByBusiness — products found:', products.length)
    res.json(products)
  } catch (err) {
    console.log('indexForPatronByBusiness — ERROR:', err.message)
    res.status(500).json({ err: err.message })
  }
}

export async function vote(req, res) {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ err: 'Product not found' })

    if (product.votedBy.map(v => v.toString()).includes(req.user.profileId.toString())) {
      return res.status(400).json({ err: 'Already voted' })
    }

    product.votedBy.push(req.user.profileId)
    product.currentTally = product.votedBy.length

    if (product.currentTally >= product.tallyGoal && product.status === 'approved') {
      product.status = 'stocked'
      if (product.requestedBy) {
        await Notification.create({
          recipient: product.requestedBy,
          type: 'product_stocked',
          message: `"${product.name}" has reached its tally goal and is now in stock!`,
          relatedId: product._id,
        })
      }
    }

    await product.save()
    checkVoteAbuse(req.user.profileId, product._id, product.business)
    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function checkVoteAbuse(patronId, productId, businessId) {
  try {
    const windowStart = new Date(Date.now() - 10 * 60 * 1000)

    const recentVotedProducts = await Product.find({
      votedBy: patronId,
      updatedAt: { $gte: windowStart },
    }).select('_id business')

    const votesInWindow = recentVotedProducts.length

    if (votesInWindow > 8) {
      await VoteAbuseFlag.findOneAndUpdate(
        { patron: patronId, reviewed: false, reason: 'rapid_voting' },
        { patron: patronId, product: productId, business: businessId, reason: 'rapid_voting', votesInWindow, windowMinutes: 10 },
        { upsert: true, new: true }
      )
    }

    const profile = await Profile.findById(patronId).select('createdAt')
    const accountAgeDays = (Date.now() - new Date(profile.createdAt)) / 86400000
    const totalVotes = await Product.countDocuments({ votedBy: patronId })

    if (accountAgeDays < 7 && totalVotes > 5) {
      await VoteAbuseFlag.findOneAndUpdate(
        { patron: patronId, reviewed: false, reason: 'new_account_burst' },
        { patron: patronId, product: productId, business: businessId, reason: 'new_account_burst', votesInWindow: totalVotes, windowMinutes: accountAgeDays * 1440 },
        { upsert: true, new: true }
      )
    }

    const allVotedProducts = await Product.find({ votedBy: patronId }).select('business')
    if (allVotedProducts.length >= 10) {
      const storeCounts = {}
      allVotedProducts.forEach(p => {
        const b = p.business.toString()
        storeCounts[b] = (storeCounts[b] || 0) + 1
      })
      const maxCount = Math.max(...Object.values(storeCounts))
      const concentration = maxCount / allVotedProducts.length
      if (concentration > 0.8) {
        await VoteAbuseFlag.findOneAndUpdate(
          { patron: patronId, reviewed: false, reason: 'single_store_focus' },
          { patron: patronId, product: productId, business: businessId, reason: 'single_store_focus', votesInWindow: maxCount, windowMinutes: 0 },
          { upsert: true, new: true }
        )
      }
    }
  } catch (err) {
    console.error('Vote abuse check failed:', err.message)
  }
}

export async function updateStatus(req, res) {
  try {
    const { status } = req.body
    const product = await Product.findOne({ _id: req.params.id, business: req.user.profileId })
    if (!product) return res.status(404).json({ err: 'Product not found' })

    product.status = status
    await product.save()

    if (product.requestedBy) {
      const typeMap = { approved: 'product_approved', rejected: 'product_rejected', stocked: 'product_stocked' }
      const msgMap = {
        approved: `Your product request "${product.name}" was approved!`,
        rejected: `Your product request "${product.name}" was not approved.`,
        stocked: `"${product.name}" is now in stock!`,
      }
      if (typeMap[status]) {
        await Notification.create({
          recipient: product.requestedBy,
          type: typeMap[status],
          message: msgMap[status],
          relatedId: product._id,
        })
      }
    }

    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function update(req, res) {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, business: req.user.profileId },
      req.body,
      { new: true }
    )
    if (!product) return res.status(404).json({ err: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function destroy(req, res) {
  try {
    await Product.findOneAndUpdate(
      { _id: req.params.id, business: req.user.profileId },
      { isActive: false }
    )
    res.json({ message: 'Product removed' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

// POST /api/products/:id/request-info — business asks patron to update their product request
export async function requestInfo(req, res) {
  try {
    const product = await Product.findOne({ _id: req.params.id, business: req.user.profileId })
    if (!product) return res.status(404).json({ err: 'Product not found' })
    if (!product.requestedBy) return res.status(400).json({ err: 'Not a patron request' })

    product.status = 'needs_info'
    await product.save()

    await Notification.create({
      recipient: product.requestedBy,
      type: 'product_needs_info',
      message: `The store is requesting more information about your product request: "${product.name}". Please update it.`,
      relatedId: product._id,
    })

    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

// PUT /api/products/:id/patron-update — patron updates their own request and resubmits
export async function patronUpdate(req, res) {
  try {
    const product = await Product.findOne({ _id: req.params.id, requestedBy: req.user.profileId })
    if (!product) return res.status(404).json({ err: 'Product not found' })

    const { name, brand, description, image } = req.body
    if (name) product.name = name
    if (brand !== undefined) product.brand = brand
    if (description !== undefined) product.description = description
    if (image !== undefined) product.image = image
    product.status = 'pending'
    await product.save()

    await Notification.create({
      recipient: product.business,
      type: 'product_updated',
      message: `A patron has updated their product request: "${product.name}".`,
      relatedId: product._id,
    })

    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

// POST /api/products/:id/promote — move a stocked product to on_sale with a discounted price
export async function promoteProduct(req, res) {
  try {
    const product = await Product.findOne({ _id: req.params.id, business: req.user.profileId })
    if (!product) return res.status(404).json({ err: 'Product not found' })
    if (product.status !== 'stocked') return res.status(400).json({ err: 'Only stocked products can be promoted' })

    const { salePrice, discountPercent } = req.body
    if (salePrice == null && discountPercent == null) {
      return res.status(400).json({ err: 'Provide either salePrice or discountPercent' })
    }

    if (discountPercent != null) {
      product.discountPercent = discountPercent
      product.salePrice = parseFloat((product.price * (1 - discountPercent / 100)).toFixed(2))
    } else {
      product.salePrice = salePrice
      if (product.price) {
        product.discountPercent = parseFloat((((product.price - salePrice) / product.price) * 100).toFixed(1))
      }
    }

    product.status = 'on_sale'
    await product.save()
    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}