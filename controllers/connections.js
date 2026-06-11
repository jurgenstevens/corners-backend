import Connection from '../models/connection.js'
import Business from '../models/business.js'
import Patron from '../models/patron.js'
import Notification from '../models/notification.js'
import zipcodes from 'zipcodes'

const NEARBY_RADIUS_MILES = 5

export async function nearby(req, res) {
  try {
    console.log('nearby — req.user:', req.user)
    const patron = await Patron.findOne({ profile: req.user.profileId })
    if (!patron) return res.status(404).json({ err: 'Patron profile not found' })
    console.log('nearby — patron zip:', patron.location?.zip)

    const searchZip = req.query.zip || patron.location?.zip || ''
    console.log('nearby — req.query.zip:', req.query.zip, '| searchZip used:', searchZip)
    if (!searchZip) return res.json([])

    const nearbyZips = zipcodes.radius(searchZip, NEARBY_RADIUS_MILES) || [searchZip]
    console.log('nearby — nearbyZips count:', nearbyZips.length, '| sample:', nearbyZips.slice(0, 10))

    const existing = await Connection.find({ patron: req.user.profileId }).select('business')
    const connectedIds = existing.map(c => c.business)
    const dismissedIds = patron.dismissedBusinesses || []

    const businesses = await Business.find({
      'location.zip': { $in: nearbyZips },
      _id: { $nin: [...connectedIds, ...dismissedIds] },
      isActive: true,
    }).populate('profile', 'name photo')

    console.log('nearby — businesses found:', businesses.length)

    // attach driving distance in miles from the search zip to each business so the
    // frontend can offer a "Sort: Nearby" option without an extra round-trip
    const withDistance = businesses.map(b => {
      const dist = b.location?.zip ? zipcodes.distance(searchZip, b.location.zip) : null
      return { ...b.toObject(), distance: dist != null ? Math.round(dist * 10) / 10 : null }
    })

    withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    res.json(withDistance)
  } catch (err) {
    console.log('nearby — ERROR:', err.message)
    res.status(500).json({ err: err.message })
  }
}

export async function requestConnection(req, res) {
  try {
    const { businessId } = req.params
    const business = await Business.findById(businessId)
    if (!business) return res.status(404).json({ err: 'Business not found' })

    const existing = await Connection.findOne({ patron: req.user.profileId, business: businessId })
    if (existing) return res.status(400).json({ err: 'Connection already exists' })

    const status = business.visibility === 'public' ? 'approved' : 'pending'
    const conn = await Connection.create({ patron: req.user.profileId, business: businessId, status })

    if (status === 'approved') {
      await Patron.findOneAndUpdate(
        { profile: req.user.profileId },
        { $addToSet: { businesses: businessId } }
      )
    } else {
      await Notification.create({
        recipient: business.profile,
        type: 'connection_request',
        message: 'A patron has requested to connect with your business.',
        relatedId: conn._id,
      })
    }

    res.status(201).json(conn)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function dismiss(req, res) {
  try {
    const { businessId } = req.params
    await Patron.findOneAndUpdate(
      { profile: req.user.profileId },
      { $addToSet: { dismissedBusinesses: businessId } }
    )
    res.json({ message: 'Business dismissed' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getPending(req, res) {
  try {
    const business = await Business.findOne({ profile: req.user.profileId })
    if (!business) return res.status(404).json({ err: 'Business not found' })

    const connections = await Connection.find({ business: business._id })
      .populate('patron', 'name photo email')
      .sort('-createdAt')

    res.json(connections)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function updateStatus(req, res) {
  try {
    const { connectionId } = req.params
    const { status, denialReason } = req.body

    const conn = await Connection.findById(connectionId)
    if (!conn) return res.status(404).json({ err: 'Connection not found' })

    const business = await Business.findOne({ profile: req.user.profileId })
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
    } else if (status === 'denied' || status === 'blocked') {
      await Patron.findOneAndUpdate(
        { profile: conn.patron },
        { $pull: { businesses: business._id } }
      )
    }

    const typeMap = { approved: 'connection_approved', denied: 'connection_denied', blocked: 'connection_blocked' }
    const msgMap = {
      approved: `Your connection request to ${business.displayName || 'a business'} was approved!`,
      denied: `Your connection request to ${business.displayName || 'a business'} was denied.`,
      blocked: `Your connection request to ${business.displayName || 'a business'} was not accepted.`,
    }

    if (typeMap[status]) {
      await Notification.create({
        recipient: conn.patron,
        type: typeMap[status],
        message: msgMap[status],
        relatedId: conn._id,
      })
    }

    res.json(conn)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getMyStores(req, res) {
  try {
    console.log('getMyStores — profileId:', req.user.profileId)
    const patron = await Patron.findOne({ profile: req.user.profileId }).populate({
      path: 'businesses',
      populate: { path: 'profile', select: 'name photo' },
    })
    if (!patron) return res.status(404).json({ err: 'Patron not found' })
    console.log('getMyStores — stores found:', patron.businesses.length)
    res.json(patron.businesses)
  } catch (err) {
    console.log('getMyStores — ERROR:', err.message)
    res.status(500).json({ err: err.message })
  }
}

export async function getMyConnectionStatus(req, res) {
  try {
    const { businessId } = req.params
    const conn = await Connection.findOne({ patron: req.user.profileId, business: businessId })
    res.json(conn || { status: 'none' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function deleteConnection(req, res) {
  try {
    const { connectionId } = req.params
    const conn = await Connection.findById(connectionId)
    if (!conn) return res.status(404).json({ err: 'Connection not found' })

    const business = await Business.findOne({ profile: req.user.profileId })
    if (!business || conn.business.toString() !== business._id.toString()) {
      return res.status(403).json({ err: 'Not authorized' })
    }

    await Connection.findByIdAndDelete(connectionId)
    await Patron.findOneAndUpdate(
      { profile: conn.patron },
      { $pull: { businesses: business._id } }
    )

    res.json({ message: 'Connection deleted' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function disconnect(req, res) {
  try {
    const { businessId } = req.params
    console.log('disconnect — patron:', req.user.profileId, '| businessId:', businessId)

    const conn = await Connection.findOneAndDelete({ patron: req.user.profileId, business: businessId })
    if (!conn) return res.status(404).json({ err: 'Connection not found' })

    await Patron.findOneAndUpdate(
      { profile: req.user.profileId },
      { $pull: { businesses: businessId } }
    )

    console.log('disconnect — removed connection and updated patron businesses')
    res.json({ message: 'Disconnected successfully' })
  } catch (err) {
    console.log('disconnect — ERROR:', err.message)
    res.status(500).json({ err: err.message })
  }
}