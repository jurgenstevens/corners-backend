import mongoose from 'mongoose'
const { Schema } = mongoose

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: {
    type: String,
    enum: ['connection_approved', 'connection_denied', 'connection_blocked', 'connection_request', 'product_request', 'product_approved', 'product_rejected', 'product_ready', 'product_needs_info', 'product_updated', 'product_stocked', 'order_request', 'order_quoted', 'order_accepted', 'order_declined', 'order_fulfilled'],
    required: true
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedId: { type: Schema.Types.ObjectId },
}, { timestamps: true })

// Auto-delete notifications after 14 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 })

export default mongoose.model('Notification', notificationSchema)
