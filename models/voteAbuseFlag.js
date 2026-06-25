import mongoose from 'mongoose'
const { Schema } = mongoose

const voteAbuseFlagSchema = new Schema({
  patron: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  business: { type: Schema.Types.ObjectId, ref: 'Profile' },
  reason: {
    type: String,
    enum: ['rapid_voting', 'new_account_burst', 'single_store_focus', 'coordinated_pattern'],
  },
  votesInWindow: Number,
  windowMinutes: Number,
  reviewed: { type: Boolean, default: false },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'Profile' },
  dismissed: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('VoteAbuseFlag', voteAbuseFlagSchema)
