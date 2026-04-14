/**
 * One-time script to register the Adorable shop webhook with Stripe.
 * Run: npx ts-node -r dotenv/config scripts/setup-stripe-webhook.ts
 *
 * Reads NEXT_PUBLIC_APP_URL from .env.local as the base URL.
 * Prints the webhook signing secret — paste it into STRIPE_SHOP_WEBHOOK_SECRET.
 */
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL

if (!appUrl || appUrl.includes('localhost')) {
  console.error('❌  Set NEXT_PUBLIC_APP_URL to your production URL first (not localhost).')
  process.exit(1)
}

const WEBHOOK_URL = `${appUrl}/api/shop/webhook`
const EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'checkout.session.completed',
  'checkout.session.expired',
]

async function run() {
  // ── Check if a webhook already points to this URL ───────────────────────
  const existing = await stripe.webhookEndpoints.list({ limit: 100 })
  const already  = existing.data.find(w => w.url === WEBHOOK_URL)

  if (already) {
    console.log(`✅  Webhook already registered: ${already.id}`)
    console.log(`    URL: ${already.url}`)
    console.log(`    Status: ${already.status}`)
    console.log(`\n⚠️  The signing secret is only shown once at creation time.`)
    console.log(`   If you need it again, delete this webhook and re-run this script.`)
    return
  }

  // ── Create the webhook ───────────────────────────────────────────────────
  const webhook = await stripe.webhookEndpoints.create({
    url:            WEBHOOK_URL,
    enabled_events: EVENTS,
    description:    'Adorable shop — order payments',
  })

  console.log(`✅  Webhook created: ${webhook.id}`)
  console.log(`    URL: ${webhook.url}`)
  console.log(``)
  console.log(`Add this to your .env.local and Vercel environment variables:`)
  console.log(``)
  console.log(`STRIPE_SHOP_WEBHOOK_SECRET=${webhook.secret}`)
  console.log(``)
  console.log(`In Vercel: Settings → Environment Variables → add STRIPE_SHOP_WEBHOOK_SECRET`)
}

run().catch(err => { console.error('❌', err.message); process.exit(1) })
