import mongoose from 'mongoose'
const { Schema } = mongoose

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  description: { type: String, trim: true },
  price: { type: Number },
  image: { type: String },
  business: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  tallyGoal: { type: Number, default: 10 },
  currentTally: { type: Number, default: 0 },
  votedBy: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'ready_to_stock', 'stocked', 'needs_info'],
    default: 'pending'
  },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'Profile' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Product', productSchema)
