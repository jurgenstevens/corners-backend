const Product = require('../models/product')
const Connection = require('../models/connection')
const Business = require('../models/business')
const Notification = require('../models/notification')

async function index(req, res) {
  try {
    const products = await Product.find({ business: req.user._id, isActive: true }).sort('-createdAt')
    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function indexForPatron(req, res) {
  try {
    const connections = await Connection.find({ patron: req.user._id, status: 'approved' }).select('business')
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

async function create(req, res) {
  try {
    const product = await Product.create({ ...req.body, business: req.user._id })
    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function requestProduct(req, res) {
  try {
    const { businessId } = req.params
    const business = await Business.findById(businessId)
    if (!business) return res.status(404).json({ err: 'Business not found' })

    const conn = await Connection.findOne({ patron: req.user._id, business: businessId, status: 'approved' })
    if (!conn) return res.status(403).json({ err: 'You must be connected to this business to request a product' })

    const product = await Product.create({
      ...req.body,
      business: business.profile,
      requestedBy: req.user._id,
      status: 'pending',
    })

    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function vote(req, res) {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ err: 'Product not found' })

    if (product.votedBy.map(v => v.toString()).includes(req.user._id.toString())) {
      return res.status(400).json({ err: 'Already voted' })
    }

    product.votedBy.push(req.user._id)
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

async function updateStatus(req, res) {
  try {
    const { status } = req.body
    const product = await Product.findOne({ _id: req.params.id, business: req.user._id })
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

async function update(req, res) {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, business: req.user._id },
      req.body,
      { new: true }
    )
    if (!product) return res.status(404).json({ err: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function destroy(req, res) {
  try {
    await Product.findOneAndUpdate(
      { _id: req.params.id, business: req.user._id },
      { isActive: false }
    )
    res.json({ message: 'Product removed' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

module.exports = { index, indexForPatron, create, requestProduct, vote, updateStatus, update, destroy }
