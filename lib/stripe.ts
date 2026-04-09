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
    maxVersionsPerSite: 3,
    maxDailyGenerations: 5,
    customDomain: false,
    orders: false,
    stripePriceId: null,
  },
  starter: {
    name: 'Starter',
    price: 49,
    maxSites: 5,
    maxVersionsPerSite: Infinity,
    maxDailyGenerations: 100,
    customDomain: true,
    orders: true,
    stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  },
  pro: {
    name: 'Pro',
    price: 89,
    maxSites: Infinity,
    maxVersionsPerSite: Infinity,
    maxDailyGenerations: Infinity,
    customDomain: true,
    orders: true,
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

// ─── Stripe Connect Express ───────────────────────────────────────────────────

/** Create an onboarding link for a bakery owner to connect their bank account */
export async function createConnectOnboardingLink({
  accountId,
  refreshUrl,
  returnUrl,
}: {
  accountId: string
  refreshUrl: string
  returnUrl: string
}) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
}

/** Create a Stripe Connect Express account for a bakery owner */
export async function createConnectAccount(email: string, userId: string) {
  return stripe.accounts.create({
    type: 'express',
    email,
    metadata: { supabase_user_id: userId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    settings: {
      payouts: { schedule: { interval: 'weekly', weekly_anchor: 'monday' } },
    },
  })
}

/** Create a Checkout Session for a bakery shop order */
export async function createShopCheckoutSession({
  connectedAccountId,
  lineItems,
  orderId,
  siteId,
  successUrl,
  cancelUrl,
  platformFeePercent = 5,
}: {
  connectedAccountId: string
  lineItems: { name: string; amount: number; quantity: number; images?: string[] }[]
  orderId: string
  siteId: string
  successUrl: string
  cancelUrl: string
  platformFeePercent?: number
}) {
  const totalCents = lineItems.reduce((sum, i) => sum + i.amount * i.quantity, 0)
  const platformFee = Math.round(totalCents * platformFeePercent / 100)

  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          ...(item.images?.length ? { images: item.images.slice(0, 1) } : {}),
        },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orderId, siteId },
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: { destination: connectedAccountId },
      metadata: { orderId, siteId },
    },
  })
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
