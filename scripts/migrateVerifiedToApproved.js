import 'dotenv/config.js'
import mongoose from 'mongoose'
import Business from '../models/business.js'
import { generateSlug } from '../utils/generateSlug.js'

const apply = process.argv.includes('--apply')

await mongoose.connect(process.env.DATABASE_URL)

const businesses = await Business.find({ verificationStatus: 'verified' }).lean()

if (businesses.length === 0) {
  console.log('No businesses with verificationStatus "verified" found.')
  await mongoose.disconnect()
  process.exit(0)
}

console.log(`Found ${businesses.length} business(es) with verificationStatus "verified":`)
for (const b of businesses) {
  console.log(`  _id=${b._id}  displayName=${b.displayName ?? '(none)'}  slug=${b.slug ?? '(none)'}`)
}

if (!apply) {
  console.log('\nDry run — pass --apply to write changes.')
  await mongoose.disconnect()
  process.exit(0)
}

console.log('\nApplying...')
for (const b of businesses) {
  const update = { verificationStatus: 'approved' }

  if (!b.slug) {
    let slug = generateSlug(b.displayName || b.businessType || 'store')
    const collision = await Business.findOne({ slug, _id: { $ne: b._id } })
    if (collision) slug = slug + '-' + Math.random().toString(36).slice(2, 6)
    update.slug = slug
  }

  await Business.updateOne({ _id: b._id }, { $set: update })
  console.log(`  updated _id=${b._id}  verificationStatus=approved${update.slug ? `  slug=${update.slug}` : ''}`)
}

console.log('Done.')
await mongoose.disconnect()
