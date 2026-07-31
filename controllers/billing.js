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
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // TODO: handle subscription changes
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
    const { priceId } = req.body

    const billing = await Billing.findOne({ profileId })
    if (billing?.subscriptionStatus === 'active') {
      return res.status(400).json({ err: 'Already subscribed' })
    }

    const msLeft = billing?.trialEndsAt ? billing.trialEndsAt - Date.now() : 0
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,
      metadata: { profileId },
    }

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
    // TODO: look up real subscription from Stripe/DB by req.user.profileId
    res.json({ status: 'active', plan: null, trialEndsAt: null, currentPeriodEnd: null, paymentFailedAt: null })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
