import Business from '../models/business.js'
import Connection from '../models/connection.js'
import { generateSlug } from '../utils/generateSlug.js'

export async function show(req, res) {
  try {
    const { id } = req.params
    const business = await Business.findById(id).populate('profile', 'name photo')
    if (!business) return res.status(404).json({ err: 'Business not found' })

    const isSelf = business.profile._id.toString() === req.user.profileId.toString()
    if (!isSelf) {
      const conn = await Connection.findOne({ patron: req.user.profileId, business: id, status: 'approved' })
      if (!conn) return res.status(403).json({ err: 'Not connected to this business' })
    }

    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function setup(req, res) {
  try {
    const { zip, city, state, ...rest } = req.body
    const updates = { ...rest }
    if (zip || city || state) {
      updates.location = { zip: zip || '', city: city || '', state: state || '' }
    }
    const business = await Business.findOneAndUpdate(
      { profile: req.user.profileId },
      { $set: updates },
      { new: true, upsert: true }
    )
    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function joinBySlug(req, res) {
  try {
    const business = await Business.findOne({ slug: req.params.slug }).populate('profile', 'name photo')
    if (!business) return res.status(404).json({ err: 'Store not found' })
    res.json({ business, profile: business.profile })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getMyBusiness(req, res) {
  try {
    const business = await Business.findOne({ profile: req.user.profileId })
    if (!business) return res.status(404).json({ err: 'Business not found' })

    if (business.verificationStatus === 'approved' && !business.slug) {
      let slug = generateSlug(business.displayName || business.businessType || 'store')
      const collision = await Business.findOne({ slug, _id: { $ne: business._id } })
      if (collision) slug = slug + '-' + Math.random().toString(36).slice(2, 6)
      business.slug = slug
      await business.save()
    }

    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
