import { Distributor } from '../models/distributor.js'
import Business from '../models/business.js'
import DistributorProduct from '../models/distributorProduct.js'
import { parseCatalogPDF } from '../services/catalogParser.js'

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

export async function uploadCatalog(req, res) {
  try {
    if (!req.file) return res.status(400).json({ err: 'No PDF uploaded' })
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ err: 'Catalog parsing is not configured. Contact support.' })
    }
    const distributor = await Distributor.findOne({ profile: req.user.profileId })
    if (!distributor) return res.status(404).json({ err: 'Distributor not found' })

    let parsed
    try {
      parsed = await parseCatalogPDF(req.file.buffer)
    } catch (err) {
      return res.status(422).json({ err: err.message })
    }

    const products = await DistributorProduct.insertMany(
      parsed.map(p => ({ ...p, distributor: req.user.profileId, isActive: true }))
    )
    res.status(201).json({ message: `Imported ${products.length} products`, products })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getCatalogForDistributor(req, res) {
  try {
    const products = await DistributorProduct.find({
      distributor: req.user.profileId,
      isActive: true,
    }).sort({ category: 1, name: 1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function updateProduct(req, res) {
  try {
    const product = await DistributorProduct.findById(req.params.productId)
    if (!product) return res.status(404).json({ err: 'Product not found' })
    if (product.distributor.toString() !== req.user.profileId.toString()) {
      return res.status(403).json({ err: 'Not authorized' })
    }
    const updated = await DistributorProduct.findByIdAndUpdate(req.params.productId, req.body, { new: true })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function deleteProduct(req, res) {
  try {
    const product = await DistributorProduct.findById(req.params.productId)
    if (!product) return res.status(404).json({ err: 'Product not found' })
    if (product.distributor.toString() !== req.user.profileId.toString()) {
      return res.status(403).json({ err: 'Not authorized' })
    }
    product.isActive = false
    await product.save()
    res.json({ message: 'Product deactivated' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
