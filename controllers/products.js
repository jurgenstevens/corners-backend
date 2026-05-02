import { Product } from '../models/product.js'

async function index(req, res) {
  try {
    const products = await Product.find({ business: req.user.profileId }).sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function indexAll(req, res) {
  try {
    const products = await Product.find({ isActive: true })
      .populate('business', 'name')
      .sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function create(req, res) {
  try {
    const { name, brand, description, price, image } = req.body
    const product = await Product.create({
      name, brand, description, price, image,
      business: req.user.profileId,
    })
    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function update(req, res) {
  try {
    const product = await Product.findOne({ _id: req.params.id, business: req.user.profileId })
    if (!product) return res.status(404).json({ err: 'Product not found' })
    const { name, brand, description, price, image, isActive } = req.body
    Object.assign(product, { name, brand, description, price, image, isActive })
    await product.save()
    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function destroy(req, res) {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, business: req.user.profileId })
    if (!product) return res.status(404).json({ err: 'Product not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export { index, indexAll, create, update, destroy }