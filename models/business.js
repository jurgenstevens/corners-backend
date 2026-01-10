import mongoose from 'mongoose'
const Schema = mongoose.Schema

const businessSchema = new Schema({
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    unique: true,
  },

  displayName: String,
  description: String,

  // Products owned by this business
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],

  // Patrons associated with this business
  patrons: [{
    type: Schema.Types.ObjectId,
    ref: 'Patron',
  }],

  // Orders placed by patrons to this business
  incomingOrders: [{
    type: Schema.Types.ObjectId,
    ref: 'Order',
  }],

  // Orders this business sends to distributors
  outgoingOrders: [{
    type: Schema.Types.ObjectId,
    ref: 'Order',
  }],

  isActive: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true })

const Business = mongoose.model('Business', businessSchema)

export { Business }
