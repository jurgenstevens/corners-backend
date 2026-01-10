import mongoose from 'mongoose'
const Schema = mongoose.Schema

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },

  // Snapshot values at time of order
  nameSnapshot: String,
  priceSnapshot: Number,

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
})

const orderSchema = new Schema({
  patron: {
    type: Schema.Types.ObjectId,
    ref: 'Patron',
    required: true,
  },

  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },

  distributor: {
    type: Schema.Types.ObjectId,
    ref: 'Distributor',
  },

  items: [orderItemSchema],

  status: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'processing',
      'shipped',
      'fulfilled',
      'cancelled',
    ],
    default: 'pending',
  },

  totalAmount: Number,

  notes: String,

}, { timestamps: true })

const Order = mongoose.model('Order', orderSchema)
export { Order }
