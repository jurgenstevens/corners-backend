import cron from 'node-cron'
import Product from '../models/product.js'
import { Profile } from '../models/profile.js'

export function startCleanupJobs() {
  cron.schedule('0 2 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const result = await Product.deleteMany({
        status: 'rejected',
        updatedAt: { $lt: thirtyDaysAgo },
        isActive: false,
      })
      console.log(`[Cleanup] Deleted ${result.deletedCount} rejected products older than 30 days`)
    } catch (err) {
      console.error('[Cleanup] Rejected product cleanup failed:', err.message)
    }
  })

  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date()
      const result = await Profile.updateMany(
        { isSuspended: true, suspendedUntil: { $lte: now } },
        { $set: { isSuspended: false, suspendedUntil: null, suspensionReason: null } }
      )
      if (result.modifiedCount > 0) {
        console.log(`[Cleanup] Lifted ${result.modifiedCount} expired suspensions`)
      }
    } catch (err) {
      console.error('[Cleanup] Suspension cleanup failed:', err.message)
    }
  })
}
