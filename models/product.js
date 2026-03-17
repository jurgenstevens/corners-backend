import mongoose from 'mongoose'
const Schema = mongoose.Schema

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  brand: {
    type: String,
    trim: true,
    index: true,
  },

  description: {
    type: String,
    trim: true,
  },

  price: {
    type: Number,
    required: true,
  },

  image: {
    type: String,
  },

  business: {
    type: Schema.Types.ObjectId,
    ref: 'Profile', // owner via profile
    required: true,
    index: true,
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)

export { Product }