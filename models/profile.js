import mongoose from 'mongoose'
const Schema = mongoose.Schema

const AUTH_LEVELS = {
  ADMIN: 100,
  PATRON: 150,
  BUSINESS: 250,
  DISTRIBUTOR: 500,
}

const profileSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },

  photo: {
    type: String,
  },

  authorizationLevel: {
    type: Number,
    required: true,
    enum: Object.values(AUTH_LEVELS),
    index: true,
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  isBanned: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspendedUntil: { type: Date },
  suspensionReason: { type: String },
  banReason: { type: String },
  bannedAt: { type: Date },
  flags: [{
    reason: String,
    flaggedBy: { type: Schema.Types.ObjectId, ref: 'Profile' },
    flaggedAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
  }],

}, { timestamps: true })

const Profile = mongoose.model('Profile', profileSchema)

export { Profile, AUTH_LEVELS }
