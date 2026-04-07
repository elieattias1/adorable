import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM || 'noreply@sitebot.fr'

const ContactSchema = z.object({
  siteId:  z.string().uuid(),
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  message: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { siteId, name, email, message } = ContactSchema.parse(body)

    // Fetch site + owner email
    const { data: site } = await supabaseAdmin
      .from('sites').select('name, user_id').eq('id', siteId).single()

    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

    // Get owner email from auth.users
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(site.user_id)
    if (!user?.email) return NextResponse.json({ error: 'Owner not found' }, { status: 404 })

    // Save submission to DB (best-effort)
    await supabaseAdmin.from('contact_submissions').insert({
      site_id: siteId, name, email, message,
    }).then(({ error }) => { if (error) console.error('[contact] save submission:', error) })

    const resend = new Resend(process.env.RESEND_API_KEY!)
    await resend.emails.send({
      from:    FROM,
      to:      user.email,
      replyTo: email,
      subject: `📬 Nouveau message depuis "${site.name}"`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#7c3aed;margin-bottom:4px">Nouveau message</h2>
          <p style="color:#666;margin-bottom:24px;font-size:14px">Via votre site <strong>${site.name}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#888;width:80px">Nom</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#7c3aed">${email}</a></td></tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:#f5f5f5;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap">${message}</div>
          <p style="margin-top:24px;font-size:12px;color:#aaa">Envoyé depuis votre site · Répondez directement à cet email</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact]', err)
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
