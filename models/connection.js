import mongoose from 'mongoose'
const { Schema } = mongoose

const connectionSchema = new Schema({
  patron: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied', 'blocked'], default: 'pending' },
  denialReason: { type: String, trim: true },
}, { timestamps: true })

connectionSchema.index({ patron: 1, business: 1 }, { unique: true })

export default mongoose.model('Connection', connectionSchema)
