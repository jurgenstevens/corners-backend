import mongoose from 'mongoose'
const { Schema } = mongoose

const orderSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  distributor: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'DistributorProduct' },
    name: { type: String },
    unitSize: { type: String },
    priceAtOrder: { type: Number },
    quantity: { type: Number },
  }],
  status: {
    type: String,
    enum: ['pending', 'quoted', 'accepted', 'paid', 'in_transit', 'delivered', 'ready_for_pickup', 'picked_up', 'cancelled', 'declined'],
    default: 'pending',
  },
  fulfillmentType: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  deliveryAddress: { type: String },
  preferredWindow: { type: String },
  notes: { type: String },
  estimatedTotal: { type: Number },
  deliveryFee: { type: Number },
  eta: { type: Date },
  pickupAddress: { type: String },
  pickupWindow: { type: String },
  distributorNotes: { type: String },
}, { timestamps: true })

export default mongoose.model('Order', orderSchema)
