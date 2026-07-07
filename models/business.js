import mongoose from 'mongoose'
const { Schema } = mongoose

const businessSchema = new Schema({
  profile: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  displayName: { type: String, trim: true },
  businessType: { type: String, trim: true },
  description: { type: String, trim: true },
  address: { type: String, trim: true },
  phone: { type: String, trim: true },
  location: {
    zip: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
  },
  hours: {
    monday: { type: String, trim: true },
    tuesday: { type: String, trim: true },
    wednesday: { type: String, trim: true },
    thursday: { type: String, trim: true },
    friday: { type: String, trim: true },
    saturday: { type: String, trim: true },
    sunday: { type: String, trim: true },
  },
  photos: [{ type: String }],
  priceTier: { type: String, enum: ['$', '$$', '$$$'], default: '$' },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  isActive: { type: Boolean, default: true },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectedAt: { type: Date, default: null },
  verificationDocuments: [String],
  verificationNotes: String,
  isAuthentic: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Business', businessSchema)
