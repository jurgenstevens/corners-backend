import mongoose from 'mongoose'
const Schema = mongoose.Schema

const distributorSchema = new Schema({
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    unique: true,
  },

  companyName: String,

  // Products this distributor can supply
  suppliedProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],

  // Orders assigned to this distributor
  orders: [{
    type: Schema.Types.ObjectId,
    ref: 'Order',
  }],

  serviceRegions: [String],

  isActive: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true })

const Distributor = mongoose.model('Distributor', distributorSchema)

export { Distributor }
