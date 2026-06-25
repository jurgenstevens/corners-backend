import mongoose from 'mongoose'
const { Schema } = mongoose

const messageThreadSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
  subject: { type: String, trim: true, maxlength: 200 },
  lastMessage: { type: Date },
  lastMessagePreview: { type: String, maxlength: 100 },
  initiatedBy: { type: Schema.Types.ObjectId, ref: 'Profile' },
  relatedBusiness: { type: Schema.Types.ObjectId, ref: 'Business' },
  isAdminThread: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['open', 'closed', 'archived'],
    default: 'open',
  },
}, { timestamps: true })

export default mongoose.model('MessageThread', messageThreadSchema)
