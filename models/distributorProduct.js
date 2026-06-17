import mongoose from 'mongoose'
const { Schema } = mongoose

const distributorProductSchema = new Schema({
  distributor: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  name: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  category: {
    type: String,
    enum: ['Beverages', 'Snacks', 'Dairy', 'Bakery', 'Meat', 'Produce', 'Frozen', 'Dry Goods', 'Tobacco', 'Alcohol', 'Other'],
    default: 'Other',
  },
  description: { type: String, trim: true },
  image: { type: String },
  unitSize: { type: String },
  pricePerCase: { type: Number },
  minOrderQty: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('DistributorProduct', distributorProductSchema)
