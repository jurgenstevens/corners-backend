import mongoose from 'mongoose'
const { Schema } = mongoose

const messageSchema = new Schema({
  thread: { type: Schema.Types.ObjectId, ref: 'MessageThread', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
  isSystemMessage: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Message', messageSchema)
