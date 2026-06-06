import mongoose from 'mongoose'
const { Schema } = mongoose

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: {
    type: String,
    enum: ['connection_approved', 'connection_denied', 'connection_blocked', 'connection_request', 'product_approved', 'product_rejected', 'product_ready'],
    required: true
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedId: { type: Schema.Types.ObjectId },
}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)
