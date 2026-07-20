import Stripe from 'stripe'

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
    const { priceId } = req.body
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,
      metadata: { profileId: req.user.profileId },
    })
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getStatus(req, res) {
  try {
    // TODO: look up subscription status from DB or Stripe by req.user.profileId
    res.json({ active: false, plan: null })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
