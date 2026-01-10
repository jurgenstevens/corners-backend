import mongoose from 'mongoose'
const Schema = mongoose.Schema

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },

  description: String,

  price: {
    type: Number,
    required: true,
  },

  sku: {
    type: String,
    unique: true,
  },

  // Business that owns this product
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },

  // Distributors that can supply this product
  distributors: [{
    type: Schema.Types.ObjectId,
    ref: 'Distributor',
  }],

  isActive: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)

export { Product }
