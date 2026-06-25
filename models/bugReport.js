import mongoose from 'mongoose'
const { Schema } = mongoose

const bugReportSchema = new Schema({
  reporter: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  reporterRole: { type: String, enum: ['Patron', 'Business', 'Distributor'] },
  category: {
    type: String,
    enum: ['ui_bug', 'incorrect_data', 'payment_issue', 'account_issue', 'abuse_report', 'feature_request', 'other'],
    default: 'other',
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  stepsToReproduce: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'wont_fix', 'duplicate'],
    default: 'open',
  },
  adminNotes: String,
  resolvedAt: Date,
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'Profile' },
  relatedUserId: { type: Schema.Types.ObjectId, ref: 'Profile' },
  relatedBusinessId: { type: Schema.Types.ObjectId, ref: 'Profile' },
}, { timestamps: true })

export default mongoose.model('BugReport', bugReportSchema)
