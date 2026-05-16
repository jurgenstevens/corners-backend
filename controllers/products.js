import Product from '../models/product.js'
import Connection from '../models/connection.js'
import Business from '../models/business.js'
import Notification from '../models/notification.js'

export async function index(req, res) {
  try {
    const products = await Product.find({ business: req.user.profileId, isActive: true }).sort('-createdAt')
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
      status: { $in: ['approved', 'ready_to_stock', 'stocked'] },
    }).sort('-createdAt')

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

export async function requestProduct(req, res) {
  try {
    const { businessId } = req.params
    const business = await Business.findById(businessId)
    if (!business) return res.status(404).json({ err: 'Business not found' })

    const conn = await Connection.findOne({ patron: req.user.profileId, business: businessId, status: 'approved' })
    if (!conn) return res.status(403).json({ err: 'You must be connected to this business to request a product' })

    const product = await Product.create({
      ...req.body,
      business: business.profile,
      requestedBy: req.user.profileId,
      status: 'pending',
    })

    res.status(201).json(product)
  } catch (err) {
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
      product.status = 'ready_to_stock'
      if (product.requestedBy) {
        await Notification.create({
          recipient: product.requestedBy,
          type: 'product_ready',
          message: `"${product.name}" has reached its tally goal and is ready to stock!`,
          relatedId: product._id,
        })
      }
    }

    await product.save()
    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
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
      const typeMap = { approved: 'product_approved', rejected: 'product_rejected', stocked: 'product_ready' }
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
