import mongoose from 'mongoose'
const Schema = mongoose.Schema

const patronSchema = new Schema({
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    unique: true,
  },

  // Businesses this patron follows or shops with
  businesses: [{
    type: Schema.Types.ObjectId,
    ref: 'Business',
  }],

  // Products saved by the patron
  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],

  // Orders placed by the patron
  orders: [{
    type: Schema.Types.ObjectId,
    ref: 'Order',
  }],

  isActive: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true })

const Patron = mongoose.model('Patron', patronSchema)

export { Patron }