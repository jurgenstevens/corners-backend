import { Distributor } from '../models/distributor.js'
import Business from '../models/business.js'
import DistributorProduct from '../models/distributorProduct.js'

export async function getNearby(req, res) {
  try {
    const business = await Business.findOne({ profile: req.user.profileId })
    if (!business) return res.status(404).json({ err: 'Business profile not found' })

    const zip = business.location?.zip
    if (!zip) return res.json([])

    const distributors = await Distributor.find({ serviceRegions: zip, isActive: true })
      .populate('profile', 'name photo')

    res.json(distributors)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getById(req, res) {
  try {
    const distributor = await Distributor.findById(req.params.id)
      .populate('profile', 'name photo email phone')

    if (!distributor) return res.status(404).json({ err: 'Distributor not found' })
    res.json(distributor)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getCatalog(req, res) {
  try {
    const products = await DistributorProduct.find({
      distributor: req.params.distributorId,
      isActive: true,
    }).sort({ category: 1, name: 1 })

    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
