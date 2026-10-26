import 'dotenv/config.js'
import mongoose from 'mongoose'
import Business from '../models/business.js'
import Billing from '../models/billing.js'

const apply = process.argv.includes('--apply')
const daysArg = process.argv.find(a => a.startsWith('--days='))
const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : null

if (apply && (!days || isNaN(days) || days <= 0)) {
  console.error('--apply requires --days=N (positive integer)')
  process.exit(1)
}

await mongoose.connect(process.env.DATABASE_URL)

const businesses = await Business.find({ verificationStatus: 'approved' })
  .select('_id displayName createdAt profile')
  .lean()

const profileIds = businesses.map(b => b.profile)
const existing = await Billing.find({ profileId: { $in: profileIds } }).select('profileId').lean()
const billedSet = new Set(existing.map(b => b.profileId.toString()))

const missing = businesses.filter(b => !billedSet.has(b.profile.toString()))

if (missing.length === 0) {
  console.log('No approved businesses are missing a Billing record.')
  await mongoose.disconnect()
  process.exit(0)
}

console.log(`Found ${missing.length} approved business(es) with no Billing record:`)
for (const b of missing) {
  console.log(`  _id=${b._id}  profile=${b.profile}  displayName=${b.displayName ?? '(none)'}  createdAt=${b.createdAt?.toISOString() ?? '?'}`)
}

if (!apply) {
  console.log('\nDry run — pass --apply --days=N to create trialing Billing records.')
  await mongoose.disconnect()
  process.exit(0)
}

const now = new Date()
const trialEndsAt = new Date(now.getTime() + days * 86400000)
let created = 0

for (const b of missing) {
  await Billing.create({
    profileId: b.profile,
    plan: 'business',
    subscriptionStatus: 'trialing',
    trialEndsAt,
  })
  console.log(`  created billing for profile=${b.profile}  trialEndsAt=${trialEndsAt.toISOString()}`)
  created++
}

console.log(`\nDone. Created ${created} Billing record(s).`)
await mongoose.disconnect()
