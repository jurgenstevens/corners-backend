import cron from 'node-cron'
import Billing from '../models/billing.js'

export async function expireTrials() {
  const now = new Date()
  const result = await Billing.updateMany(
    { subscriptionStatus: 'trialing', trialEndsAt: { $lt: now }, stripeSubscriptionId: null },
    { $set: { subscriptionStatus: 'expired' } },
  )
  console.log(`[Billing] Expired ${result.modifiedCount} trials`)
}

export function startBillingJobs() {
  cron.schedule('15 3 * * *', async () => {
    try {
      await expireTrials()
    } catch (err) {
      console.error('[Billing] expireTrials job failed:', err.message)
    }
  })
}
