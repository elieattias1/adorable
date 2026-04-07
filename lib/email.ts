import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = 'Adorable <hello@adorable.click>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'

// ─── Shared layout wrapper ─────────────────────────────────────────────────────
function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:linear-gradient(135deg,#7c3aed,#db2777);border-radius:10px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                <span style="font-size:16px;line-height:32px;">⚡</span>
              </td>
              <td style="padding-left:10px;font-size:18px;font-weight:800;color:#fff;">Adorable</td>
            </tr>
          </table>
        </td></tr>

        <!-- Content -->
        <tr><td style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:36px 32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;font-size:11px;color:#52525b;">
          Adorable · Le générateur de sites IA · <a href="${BASE_URL}" style="color:#7c3aed;text-decoration:none;">adorable.click</a>
          <br /><a href="${BASE_URL}/dashboard" style="color:#52525b;">Se désabonner des emails</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Welcome email ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string) {
  const resend = getResend()
  if (!resend) return

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff;">Bienvenue sur Adorable 👋</h1>
    <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Ton compte est prêt. Décris ton activité en quelques mots — Adorable génère ton site complet en moins d'une minute.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[
        ['🏢', 'Site vitrine', 'Pour présenter ton entreprise ou ton activité'],
        ['⚡', 'SaaS / Produit', 'Landing page de conversion qui convertit'],
        ['🍽️', 'Restaurant', 'Menu, réservation, ambiance — tout y est'],
        ['🎨', 'Portfolio', 'Montre ton travail avec style'],
      ].map(([emoji, title, desc]) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #27272a;">
            <span style="font-size:18px;margin-right:10px;">${emoji}</span>
            <strong style="color:#fff;font-size:13px;">${title}</strong>
            <span style="color:#71717a;font-size:12px;margin-left:6px;">${desc}</span>
          </td>
        </tr>
      `).join('')}
    </table>

    <a href="${BASE_URL}/dashboard" style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-weight:700;font-size:14px;padding:14px 24px;border-radius:12px;text-decoration:none;">
      Créer mon premier site →
    </a>

    <p style="margin:20px 0 0;font-size:12px;color:#52525b;text-align:center;">
      Plan gratuit · 1 site · aucune CB requise
    </p>
  `)

  await resend.emails.send({
    from: FROM,
    to:   email,
    subject: '⚡ Bienvenue sur Adorable — crée ton site en 1 minute',
    html,
  })
}

// ─── Site live email ───────────────────────────────────────────────────────────
export async function sendSiteLiveEmail(email: string, siteName: string, siteUrl: string) {
  const resend = getResend()
  if (!resend) return

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">🚀</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">"${siteName}" est en ligne !</h1>
      <p style="margin:0;color:#a1a1aa;font-size:14px;">Ton site est déployé et accessible publiquement.</p>
    </div>

    <div style="background:#0f0f13;border:1px solid #27272a;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;color:#52525b;text-transform:uppercase;letter-spacing:.08em;">Ton site</p>
      <a href="${siteUrl}" style="color:#a78bfa;font-size:14px;font-weight:600;text-decoration:none;">${siteUrl}</a>
    </div>

    <a href="${siteUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-weight:700;font-size:14px;padding:14px 24px;border-radius:12px;text-decoration:none;margin-bottom:12px;">
      Voir mon site →
    </a>
    <a href="${BASE_URL}/dashboard" style="display:block;text-align:center;color:#71717a;font-size:13px;padding:10px;text-decoration:none;">
      Modifier dans l'éditeur
    </a>

    <p style="margin:24px 0 0;font-size:12px;color:#52525b;text-align:center;">
      Tu veux un domaine personnalisé ? <a href="${BASE_URL}/dashboard" style="color:#7c3aed;">Passe à Pro →</a>
    </p>
  `)

  await resend.emails.send({
    from: FROM,
    to:   email,
    subject: `🚀 Ton site "${siteName}" est en ligne !`,
    html,
  })
}

// ─── Form submission notification ─────────────────────────────────────────────
export async function sendFormSubmissionEmail(
  ownerEmail: string,
  siteName: string,
  formName: string,
  data: Record<string, string>,
) {
  const resend = getResend()
  if (!resend) return

  const fields = Object.entries(data)
    .filter(([k]) => k !== '_honeypot')
    .map(([key, val]) => `
      <tr>
        <td style="padding:8px 12px;font-size:12px;color:#71717a;text-transform:capitalize;white-space:nowrap;border-bottom:1px solid #27272a;">${key}</td>
        <td style="padding:8px 12px;font-size:13px;color:#e5e5e5;border-bottom:1px solid #27272a;">${String(val)}</td>
      </tr>
    `).join('')

  const html = layout(`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <span style="font-size:24px;">📬</span>
      <div>
        <h1 style="margin:0;font-size:18px;font-weight:800;color:#fff;">Nouveau message sur "${siteName}"</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Formulaire : ${formName}</p>
      </div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;border:1px solid #27272a;border-radius:10px;margin-bottom:24px;overflow:hidden;">
      ${fields}
    </table>

    <a href="${BASE_URL}/dashboard" style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-weight:700;font-size:14px;padding:14px 24px;border-radius:12px;text-decoration:none;">
      Voir tous les messages →
    </a>
  `)

  // Use first email field as reply-to if present
  const replyTo = data.email || data.Email || data.mail || undefined

  await resend.emails.send({
    from:     FROM,
    to:       ownerEmail,
    replyTo,
    subject:  `📬 Nouveau message sur "${siteName}"`,
    html,
  })
}

// ─── J+7 nudge email ───────────────────────────────────────────────────────────
export async function sendNudgeEmail(email: string) {
  const resend = getResend()
  if (!resend) return

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Ton site t'attend 👀</h1>
    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Tu as créé un compte il y a 7 jours mais ton site n'est pas encore en ligne.<br />
      Ça prend moins d'une minute — vraiment.
    </p>

    <div style="background:#1e1b4b;border:1px solid #3730a3;border-radius:10px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;color:#c7d2fe;font-weight:600;">Comment ça marche :</p>
      ${[
        ['1', 'Décris ton activité en quelques phrases'],
        ['2', 'Adorable génère ton site complet en ~30 secondes'],
        ['3', 'Clique sur Déployer — ton site est en ligne'],
      ].map(([n, t]) => `
        <div style="display:flex;align-items:center;margin-bottom:8px;">
          <span style="background:#7c3aed;color:#fff;border-radius:50%;width:20px;height:20px;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;flex-shrink:0;">${n}</span>
          <span style="color:#a1a1aa;font-size:13px;">${t}</span>
        </div>
      `).join('')}
    </div>

    <a href="${BASE_URL}/dashboard" style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;font-weight:700;font-size:14px;padding:14px 24px;border-radius:12px;text-decoration:none;">
      Créer mon site maintenant →
    </a>
  `)

  await resend.emails.send({
    from: FROM,
    to:   email,
    subject: '👀 Ton site Adorable n\'est pas encore en ligne…',
    html,
  })
}
