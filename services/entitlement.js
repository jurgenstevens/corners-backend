export function normalizeStatus(s) {
  if (s == null) return 'none'
  if (s === 'cancelled') return 'canceled'
  return s
}

export function getEffectiveStatus(billing, now = new Date()) {
  if (!billing) return { status: 'none', graceEndsAt: null }

  const stored = normalizeStatus(billing.subscriptionStatus)

  if (
    stored === 'trialing' &&
    billing.trialEndsAt &&
    billing.trialEndsAt < now &&
    !billing.stripeSubscriptionId
  ) {
    return { status: 'expired', graceEndsAt: null }
  }

  if (stored === 'past_due') {
    const base = billing.paymentFailedAt ?? billing.updatedAt
    const graceEndsAt = new Date(new Date(base).getTime() + 5 * 86400000)
    const status = now < graceEndsAt ? 'grace' : 'past_due'
    return { status, graceEndsAt }
  }

  return { status: stored, graceEndsAt: null }
}

export const ENTITLED = ['trialing', 'active', 'grace']

export function isEntitled({ billing, business, now = new Date() }) {
  const { status } = getEffectiveStatus(billing, now)
  if (ENTITLED.includes(status)) return true
  if (!billing && business?.verificationStatus !== 'approved') return true
  return false
}
