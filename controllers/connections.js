const Connection = require('../models/connection')
const Business = require('../models/business')
const Patron = require('../models/patron')
const Notification = require('../models/notification')

async function nearby(req, res) {
  try {
    const patron = await Patron.findOne({ profile: req.user._id })
    if (!patron) return res.status(404).json({ err: 'Patron profile not found' })

    const zipPrefix = (patron.location?.zip || '').slice(0, 3)
    if (!zipPrefix) return res.json([])

    const existing = await Connection.find({ patron: req.user._id }).select('business')
    const connectedIds = existing.map(c => c.business)
    const dismissedIds = patron.dismissedBusinesses || []

    const businesses = await Business.find({
      'location.zip': { $regex: `^${zipPrefix}` },
      _id: { $nin: [...connectedIds, ...dismissedIds] },
      isActive: true,
    }).populate('profile', 'name photo')

    res.json(businesses)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function requestConnection(req, res) {
  try {
    const { businessId } = req.params
    const business = await Business.findById(businessId)
    if (!business) return res.status(404).json({ err: 'Business not found' })

    const existing = await Connection.findOne({ patron: req.user._id, business: businessId })
    if (existing) return res.status(400).json({ err: 'Connection already exists' })

    const status = business.visibility === 'public' ? 'approved' : 'pending'
    const conn = await Connection.create({ patron: req.user._id, business: businessId, status })

    if (status === 'approved') {
      await Patron.findOneAndUpdate(
        { profile: req.user._id },
        { $addToSet: { businesses: businessId } }
      )
    } else {
      await Notification.create({
        recipient: business.profile,
        type: 'connection_request',
        message: `A patron has requested to connect with your business.`,
        relatedId: conn._id,
      })
    }

    res.status(201).json(conn)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function dismiss(req, res) {
  try {
    const { businessId } = req.params
    await Patron.findOneAndUpdate(
      { profile: req.user._id },
      { $addToSet: { dismissedBusinesses: businessId } }
    )
    res.json({ message: 'Business dismissed' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function getPending(req, res) {
  try {
    const business = await Business.findOne({ profile: req.user._id })
    if (!business) return res.status(404).json({ err: 'Business not found' })

    const pending = await Connection.find({ business: business._id })
      .populate('patron', 'name photo email')
      .sort('-createdAt')

    res.json(pending)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function updateStatus(req, res) {
  try {
    const { connectionId } = req.params
    const { status, denialReason } = req.body

    const conn = await Connection.findById(connectionId).populate('patron')
    if (!conn) return res.status(404).json({ err: 'Connection not found' })

    const business = await Business.findOne({ profile: req.user._id })
    if (!business || conn.business.toString() !== business._id.toString()) {
      return res.status(403).json({ err: 'Not authorized' })
    }

    conn.status = status
    if (denialReason) conn.denialReason = denialReason
    await conn.save()

    if (status === 'approved') {
      await Patron.findOneAndUpdate(
        { profile: conn.patron },
        { $addToSet: { businesses: business._id } }
      )
    }

    const typeMap = { approved: 'connection_approved', denied: 'connection_denied', blocked: 'connection_blocked' }
    const msgMap = {
      approved: `Your connection request to ${business.displayName || 'a business'} was approved!`,
      denied: `Your connection request to ${business.displayName || 'a business'} was denied.`,
      blocked: `Your connection request to ${business.displayName || 'a business'} was not accepted.`,
    }

    await Notification.create({
      recipient: conn.patron,
      type: typeMap[status],
      message: msgMap[status],
      relatedId: conn._id,
    })

    res.json(conn)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function getMyStores(req, res) {
  try {
    const patron = await Patron.findOne({ profile: req.user._id }).populate({
      path: 'businesses',
      populate: { path: 'profile', select: 'name photo' },
    })
    if (!patron) return res.status(404).json({ err: 'Patron not found' })
    res.json(patron.businesses)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function getMyConnectionStatus(req, res) {
  try {
    const { businessId } = req.params
    const conn = await Connection.findOne({ patron: req.user._id, business: businessId })
    res.json(conn || { status: 'none' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

module.exports = { nearby, requestConnection, dismiss, getPending, updateStatus, getMyStores, getMyConnectionStatus }
