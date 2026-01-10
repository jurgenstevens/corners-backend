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

  // Soft permissions / feature flags if needed later
  flags: {
    type: [String],
    default: [],
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

}, { timestamps: true })

const Profile = mongoose.model('Profile', profileSchema)

export { Profile, AUTH_LEVELS }
