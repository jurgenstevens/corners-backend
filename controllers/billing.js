import Stripe from 'stripe'
import Billing from '../models/billing.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).json({ err: `Webhook signature verification failed: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // TODO: handle successful checkout
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object
        await Billing.findOneAndUpdate(
          { stripeCustomerId: sub.customer },
          {
            subscriptionStatus: sub.status,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          },
        )
        break
      }
      case 'customer.subscription.deleted':
        await Billing.findOneAndUpdate(
          { stripeCustomerId: event.data.object.customer },
          { subscriptionStatus: 'cancelled' },
        )
        break
      case 'invoice.payment_failed':
        await Billing.findOneAndUpdate(
          { stripeCustomerId: event.data.object.customer },
          { subscriptionStatus: 'past_due', paymentFailedAt: new Date() },
        )
        break
      case 'invoice.payment_succeeded':
        // Don't touch subscriptionStatus — customer.subscription.updated owns that.
        // A $0 trial invoice fires this immediately after checkout and would
        // overwrite "trialing" → "active" if we set status here.
        await Billing.findOneAndUpdate(
          { stripeCustomerId: event.data.object.customer },
          { paymentFailedAt: null },
        )
        break
      default:
        break
    }
    res.json({ received: true })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function createCheckout(req, res) {
  try {
    const profileId = req.user.profileId
    const priceId = process.env.STRIPE_BUSINESS_PRICE_ID

    const billing = await Billing.findOne({ profileId })
    if (billing?.stripeSubscriptionId && ['trialing', 'active'].includes(billing.subscriptionStatus)) {
      return res.status(400).json({ err: 'Payment method already on file' })
    }

    let customerId = billing?.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { profileId: profileId.toString() },
      })
      customerId = customer.id
      await Billing.findOneAndUpdate(
        { profileId },
        { profileId, stripeCustomerId: customerId },
        { upsert: true },
      )
    }

    const msLeft = billing?.trialEndsAt ? billing.trialEndsAt - Date.now() : 0
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard/business?billing=success`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/business?billing=cancel`,
      metadata: { profileId },
    }
    sessionParams.customer = customerId

    if (msLeft > 49 * 3600 * 1000) {
      sessionParams.subscription_data = {
        trial_end: Math.floor(billing.trialEndsAt.getTime() / 1000),
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getStatus(req, res) {
  try {
    const billing = await Billing.findOne({ profileId: req.user.profileId })
    res.json({
      status: billing?.subscriptionStatus || 'none',
      plan: billing?.plan || null,
      trialEndsAt: billing?.trialEndsAt || null,
      currentPeriodEnd: billing?.currentPeriodEnd || null,
      paymentFailedAt: billing?.paymentFailedAt || null,
      hasPaymentMethod: !!billing?.stripeSubscriptionId,
    })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
