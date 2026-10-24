import Billing from '../models/billing.js'
import Business from '../models/business.js'
import { getEffectiveStatus, isEntitled } from '../services/entitlement.js'

export async function requireActiveSubscription(req, res, next) {
  if (req.user?.authorizationLevel !== 250) return next()

  try {
    const billing = await Billing.findOne({ profileId: req.user.profileId })

    let business = null
    if (!billing) {
      business = await Business.findOne({ profile: req.user.profileId }).select('verificationStatus')
    }

    if (isEntitled({ billing, business })) return next()

    const { status } = getEffectiveStatus(billing)
    return res.status(402).json({
      err: 'An active subscription is required.',
      code: 'subscription_required',
      status,
    })
  } catch (err) {
    next(err)
  }
}
