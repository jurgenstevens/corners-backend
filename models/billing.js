import mongoose from 'mongoose'
const { Schema } = mongoose

const billingSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, unique: true },
  plan: { type: String, default: 'business' },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'trialing', 'active', 'past_due', 'canceled', 'incomplete'],
    default: 'none',
  },
  trialEndsAt: { type: Date, default: null },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  currentPeriodEnd: { type: Date, default: null },
  paymentFailedAt: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.model('Billing', billingSchema)
