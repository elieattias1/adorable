import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

// ─── Plan config ──────────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    name: 'Gratuit',
    price: 0,
    maxSites: 1,
    maxVersionsPerSite: 5,
    maxDailyGenerations: 20,
    customDomain: false,
    stripePriceId: null,
  },
  starter: {
    name: 'Starter',
    price: 6,
    maxSites: 5,
    maxVersionsPerSite: Infinity,
    maxDailyGenerations: 100,
    customDomain: false,
    stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  },
  pro: {
    name: 'Pro',
    price: 19,
    maxSites: Infinity,
    maxVersionsPerSite: Infinity,
    maxDailyGenerations: Infinity,
    customDomain: true,
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
  },
} as const

export type PlanKey = keyof typeof PLANS

// ─── Create or retrieve Stripe customer ───────────────────────────────────────
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  // Check if customer already exists (you'd normally look this up from DB)
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0].id

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })
  return customer.id
}

// ─── Create Stripe Checkout Session ───────────────────────────────────────────
export async function createCheckoutSession({
  customerId,
  priceId,
  userId,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  priceId: string
  userId: string
  successUrl: string
  cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
      trial_period_days: 7,   // 7-day free trial
    },
    allow_promotion_codes: true,
  })
}

// ─── Create Customer Portal Session ───────────────────────────────────────────
export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

// ─── Webhook: map Stripe events to DB updates ─────────────────────────────────
export function constructWebhookEvent(payload: Buffer, signature: string) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

/**
 * Given a Stripe subscription, return the plan key
 */
export function planFromSubscription(subscription: Stripe.Subscription): PlanKey {
  const status = subscription.status
  if (status !== 'active' && status !== 'trialing') return 'free'
  const priceId = subscription.items.data[0]?.price.id
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY)     return 'pro'
  if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) return 'starter'
  return 'free'
}
