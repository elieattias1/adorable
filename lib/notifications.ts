/**
 * lib/notifications.ts
 *
 * Sends order notifications to bakery owners via:
 *   - Email (Resend)
 *   - SMS   (Twilio)
 *
 * Both are best-effort: a failure in one does NOT fail the order.
 */

import { Resend } from 'resend'
import twilio    from 'twilio'

const resend       = new Resend(process.env.RESEND_API_KEY)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const TWILIO_FROM  = process.env.TWILIO_PHONE_NUMBER ?? ''
const FROM_EMAIL   = process.env.RESEND_FROM_EMAIL   ?? 'commandes@adorable.click'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  name:        string
  quantity:    number
  price_cents: number
}

interface NotificationPayload {
  orderId:        string
  siteName:       string
  customerName:   string
  customerEmail:  string
  customerPhone?: string | null
  items:          OrderItem[]
  totalCents:     number
  note?:          string | null
  pickupAt?:      string | null
  ownerEmail?:    string | null   // notification_email or profile email
  ownerPhone?:    string | null   // notification_phone
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

function formatPickup(pickupAt: string | null | undefined) {
  if (!pickupAt) return 'Dès que possible'
  return new Date(pickupAt).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Email ─────────────────────────────────────────────────────────────────────

async function sendOrderEmail(payload: NotificationPayload) {
  if (!payload.ownerEmail) return

  const itemLines = payload.items
    .map(i => `  • ${i.quantity}× ${i.name} — ${formatPrice(i.price_cents * i.quantity)}`)
    .join('\n')

  const html = `
<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: #c2410c; padding: 24px 32px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">🥐 Nouvelle commande — ${payload.siteName}</h1>
  </div>
  <div style="background: #fffbf5; padding: 32px; border: 1px solid #fed7aa; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="margin: 0 0 20px; font-size: 16px; font-weight: 600;">
      Commande #${payload.orderId.slice(0, 8).toUpperCase()}
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr><td style="padding: 4px 0; color: #666; width: 140px;">Client</td>
          <td style="padding: 4px 0; font-weight: 500;">${payload.customerName}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Email</td>
          <td style="padding: 4px 0;">${payload.customerEmail}</td></tr>
      ${payload.customerPhone ? `<tr><td style="padding: 4px 0; color: #666;">Téléphone</td>
          <td style="padding: 4px 0;">${payload.customerPhone}</td></tr>` : ''}
      <tr><td style="padding: 4px 0; color: #666;">Retrait</td>
          <td style="padding: 4px 0; font-weight: 500;">${formatPickup(payload.pickupAt)}</td></tr>
    </table>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px; font-weight: 600; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.05em;">Articles</p>
      ${payload.items.map(i => `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 15px;">
          <span>${i.quantity}× ${i.name}</span>
          <span style="font-weight: 500;">${formatPrice(i.price_cents * i.quantity)}</span>
        </div>`).join('')}
      <div style="display: flex; justify-content: space-between; padding: 12px 0 0; font-size: 16px; font-weight: 700;">
        <span>Total</span>
        <span style="color: #c2410c;">${formatPrice(payload.totalCents)}</span>
      </div>
    </div>

    ${payload.note ? `<div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px;"><strong>Note du client :</strong> ${payload.note}</p>
    </div>` : ''}

    <p style="margin: 0; color: #999; font-size: 13px;">
      Paiement au retrait. Contactez le client si besoin : ${payload.customerEmail}${payload.customerPhone ? ` / ${payload.customerPhone}` : ''}
    </p>
  </div>
</div>`

  await resend.emails.send({
    from:    FROM_EMAIL,
    to:      payload.ownerEmail,
    subject: `🥐 Nouvelle commande — ${payload.customerName} — ${formatPrice(payload.totalCents)}`,
    html,
  })
}

// ─── SMS ───────────────────────────────────────────────────────────────────────

async function sendOrderSms(payload: NotificationPayload) {
  if (!payload.ownerPhone || !TWILIO_FROM) return

  const itemSummary = payload.items
    .map(i => `${i.quantity}× ${i.name}`)
    .join(', ')

  const body = [
    `🥐 Nouvelle commande – ${payload.siteName}`,
    `Client : ${payload.customerName}`,
    `Articles : ${itemSummary}`,
    `Total : ${formatPrice(payload.totalCents)}`,
    `Retrait : ${formatPickup(payload.pickupAt)}`,
    payload.note ? `Note : ${payload.note}` : null,
    `Tél client : ${payload.customerPhone ?? payload.customerEmail}`,
  ].filter(Boolean).join('\n')

  await twilioClient.messages.create({
    from: TWILIO_FROM,
    to:   payload.ownerPhone,
    body,
  })
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function sendOrderNotification(payload: NotificationPayload) {
  const results = await Promise.allSettled([
    sendOrderEmail(payload),
    sendOrderSms(payload),
  ])

  const emailResult = results[0]
  const smsResult   = results[1]

  if (emailResult.status === 'rejected') {
    console.error('[notifications] email failed:', emailResult.reason)
  }
  if (smsResult.status === 'rejected') {
    console.error('[notifications] sms failed:', smsResult.reason)
  }

  return {
    emailSent: emailResult.status === 'fulfilled',
    smsSent:   smsResult.status   === 'fulfilled',
  }
}
