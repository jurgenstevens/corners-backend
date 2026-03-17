import mongoose from 'mongoose'
const Schema = mongoose.Schema

const requestSchema = new Schema({
  // Raw user input (INTENTIONALLY messy)
  productName: {
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

  image: {
    type: String, // patron-uploaded image
  },

  // Who made the request
  patron: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    index: true,
  },

  // Optional: targeted business
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    index: true,
  },

  // 🔥 IMPORTANT: resolution (safe linking)
  resolvedProduct: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },

  status: {
    type: String,
    enum: ['open', 'fulfilled', 'cancelled'],
    default: 'open',
    index: true,
  },

  // 📍 Analytics goldmine
  location: {
    zip: { type: String, index: true },
    city: { type: String, index: true },
    state: { type: String, index: true },
    country: { type: String, index: true },
  },

}, { timestamps: true })

const Request = mongoose.model('Request', requestSchema)

export { Request }