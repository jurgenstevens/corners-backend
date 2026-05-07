const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  description: { type: String, trim: true },
  price: { type: Number },
  image: { type: String },
  business: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  tallyGoal: { type: Number, default: 10 },
  currentTally: { type: Number, default: 1 },
  votedBy: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'ready_to_stock', 'stocked'],
    default: 'pending'
  },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'Profile' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)
