import { Request } from '../models/request.js'

async function create(req, res) {
  try {
    const { productName, brand, image, business } = req.body
    const request = await Request.create({
      productName, brand, image,
      business: business || undefined,
      patron: req.user.profileId,
    })
    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function indexForPatron(req, res) {
  try {
    const requests = await Request.find({ patron: req.user.profileId })
      .populate('business', 'name')
      .sort({ createdAt: -1 })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function indexForBusiness(req, res) {
  try {
    const requests = await Request.find({ business: req.user.profileId })
      .populate('patron', 'name')
      .sort({ createdAt: -1 })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function updateStatus(req, res) {
  try {
    const request = await Request.findOne({ _id: req.params.id, business: req.user.profileId })
    if (!request) return res.status(404).json({ err: 'Request not found' })
    const { status } = req.body
    if (!['open', 'fulfilled', 'cancelled'].includes(status)) {
      return res.status(400).json({ err: 'Invalid status' })
    }
    request.status = status
    await request.save()
    res.json(request)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export { create, indexForPatron, indexForBusiness, updateStatus }