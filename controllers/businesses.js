const Business = require('../models/business')
const Connection = require('../models/connection')

async function show(req, res) {
  try {
    const { id } = req.params
    const business = await Business.findById(id).populate('profile', 'name photo')
    if (!business) return res.status(404).json({ err: 'Business not found' })

    const isSelf = business.profile._id.toString() === req.user._id.toString()
    if (!isSelf) {
      const conn = await Connection.findOne({ patron: req.user._id, business: id, status: 'approved' })
      if (!conn) return res.status(403).json({ err: 'Not connected to this business' })
    }

    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function setup(req, res) {
  try {
    const updates = req.body
    const business = await Business.findOneAndUpdate(
      { profile: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    )
    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function getMyBusiness(req, res) {
  try {
    const business = await Business.findOne({ profile: req.user._id })
    if (!business) return res.status(404).json({ err: 'Business not found' })
    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

module.exports = { show, setup, getMyBusiness }
