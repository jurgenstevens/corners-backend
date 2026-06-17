import 'dotenv/config.js'
import mongoose from 'mongoose'
import '../config/database.js'
import { Profile, AUTH_LEVELS } from '../models/profile.js'
import { Distributor } from '../models/distributor.js'
import DistributorProduct from '../models/distributorProduct.js'

const distributors = [
  {
    profile: {
      name: 'Midwest Fresh Distributors',
      email: 'orders@midwestfresh.com',
      authorizationLevel: AUTH_LEVELS.DISTRIBUTOR,
    },
    distributor: {
      companyName: 'Midwest Fresh Distributors',
      serviceRegions: ['60609', '60608', '60623', '60632', '60636', '60638', '60652', '60621', '60629', '60644'],
      categories: ['Produce', 'Dairy', 'Beverages', 'Frozen'],
    },
    products: [
      {
        name: 'Whole Milk',
        brand: 'Prairie Farms',
        category: 'Dairy',
        description: 'Fresh whole milk in gallon jugs.',
        unitSize: '12 x 1gal',
        pricePerCase: 58.00,
        minOrderQty: 2,
      },
      {
        name: 'Roma Tomatoes',
        brand: null,
        category: 'Produce',
        description: 'Grade A Roma tomatoes, sourced from Illinois farms.',
        unitSize: '25lb box',
        pricePerCase: 22.50,
        minOrderQty: 1,
      },
      {
        name: 'Spring Water',
        brand: 'Ice Mountain',
        category: 'Beverages',
        description: 'Natural spring water, 16.9oz bottles.',
        unitSize: '40 x 16.9oz',
        pricePerCase: 14.00,
        minOrderQty: 5,
      },
      {
        name: 'Shredded Mozzarella',
        brand: 'Kraft',
        category: 'Dairy',
        description: 'Low-moisture part-skim shredded mozzarella.',
        unitSize: '6 x 5lb bags',
        pricePerCase: 94.00,
        minOrderQty: 1,
      },
      {
        name: 'Frozen Broccoli Florets',
        brand: 'Birds Eye',
        category: 'Frozen',
        description: 'IQF broccoli florets, no additives.',
        unitSize: '12 x 2lb bags',
        pricePerCase: 36.00,
        minOrderQty: 2,
      },
      {
        name: 'Orange Juice',
        brand: 'Tropicana',
        category: 'Beverages',
        description: 'Not-from-concentrate orange juice, chilled.',
        unitSize: '12 x 52oz',
        pricePerCase: 62.00,
        minOrderQty: 1,
      },
    ],
  },
  {
    profile: {
      name: 'South Side Wholesale',
      email: 'orders@southsidewholesale.com',
      authorizationLevel: AUTH_LEVELS.DISTRIBUTOR,
    },
    distributor: {
      companyName: 'South Side Wholesale',
      serviceRegions: ['60609', '60616', '60617', '60619', '60620', '60628', '60637', '60649', '60653'],
      categories: ['Dry Goods', 'Snacks', 'Beverages', 'Alcohol', 'Tobacco'],
    },
    products: [
      {
        name: 'Long Grain White Rice',
        brand: 'Mahatma',
        category: 'Dry Goods',
        description: 'Long grain white rice, 25lb bag.',
        unitSize: '1 x 25lb bag',
        pricePerCase: 19.00,
        minOrderQty: 4,
      },
      {
        name: 'Pinto Beans',
        brand: 'Goya',
        category: 'Dry Goods',
        description: 'Dried pinto beans.',
        unitSize: '24 x 1lb bags',
        pricePerCase: 42.00,
        minOrderQty: 1,
      },
      {
        name: 'Lay\'s Classic Potato Chips',
        brand: 'Lay\'s',
        category: 'Snacks',
        description: 'Classic salted potato chips, single-serve bags.',
        unitSize: '64ct',
        pricePerCase: 38.00,
        minOrderQty: 2,
      },
      {
        name: 'Coca-Cola 2-Liter',
        brand: 'Coca-Cola',
        category: 'Beverages',
        description: 'Coca-Cola Classic 2-liter bottles.',
        unitSize: '8 x 2L',
        pricePerCase: 18.00,
        minOrderQty: 3,
      },
      {
        name: 'Miller High Life 24-Pack',
        brand: 'Miller',
        category: 'Alcohol',
        description: 'Miller High Life 12oz cans, 24-pack.',
        unitSize: '24 x 12oz cans',
        pricePerCase: 24.00,
        minOrderQty: 5,
      },
      {
        name: 'Marlboro Red Box',
        brand: 'Marlboro',
        category: 'Tobacco',
        description: 'Marlboro Red Box cigarettes, carton of 10 packs.',
        unitSize: '10-pack carton',
        pricePerCase: 65.00,
        minOrderQty: 2,
      },
      {
        name: 'Takis Fuego',
        brand: 'Barcel',
        category: 'Snacks',
        description: 'Rolled tortilla chips, hot chili pepper & lime.',
        unitSize: '46ct box',
        pricePerCase: 52.00,
        minOrderQty: 1,
      },
    ],
  },
]

async function seed() {
  try {
    await mongoose.connection.asPromise()

    for (const data of distributors) {
      let profile = await Profile.findOne({ email: data.profile.email })
      if (!profile) {
        profile = await Profile.create(data.profile)
        console.log(`Created profile: ${profile.name}`)
      } else {
        console.log(`Profile already exists: ${profile.name}`)
      }

      let distributor = await Distributor.findOne({ profile: profile._id })
      if (!distributor) {
        distributor = await Distributor.create({ ...data.distributor, profile: profile._id })
        console.log(`Created distributor: ${distributor.companyName}`)
      } else {
        console.log(`Distributor already exists: ${distributor.companyName}`)
      }

      for (const productData of data.products) {
        const existing = await DistributorProduct.findOne({ distributor: profile._id, name: productData.name })
        if (!existing) {
          await DistributorProduct.create({ ...productData, distributor: profile._id })
          console.log(`  + Product: ${productData.name}`)
        } else {
          console.log(`  ~ Skipped (exists): ${productData.name}`)
        }
      }
    }

    console.log('\nSeed complete.')
  } catch (err) {
    console.error('Seed error:', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

seed()
