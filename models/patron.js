const mongoose = require('mongoose')
const Schema = mongoose.Schema

const patronSchema = new Schema({
  profile: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  businesses: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
  location: {
    zip: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
  },
  dismissedBusinesses: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Patron', patronSchema)
