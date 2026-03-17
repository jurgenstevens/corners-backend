import mongoose from 'mongoose'
const Schema = mongoose.Schema

const businessSchema = new Schema({
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    unique: true,
    index: true,
  },

  displayName: {
    type: String,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  logo: {
    type: String,
  },

  location: {
    zip: String,
    city: String,
    state: String,
    country: String,
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

}, { timestamps: true })

const Business = mongoose.model('Business', businessSchema)

export { Business }