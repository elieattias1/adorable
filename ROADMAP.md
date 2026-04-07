---
name: SiteBot Roadmap & Next Steps
description: Prioritized roadmap for making SiteBot successful, discussed 2026-04-05
type: project
---

# SiteBot — Roadmap (as of 2026-04-05)

## 1. Core product reliability (must-fix before growth)

**Custom domains** — Every site lives on `sitebot-xxx.vercel.app`. No real business will use that. Likely the #1 blocker for paid conversions. Users need to connect `monrestaurant.fr`.
**Why:** Small businesses won't share a sitebot subdomain with clients.

**Mobile rendering** — `SiteRenderer` uses inline `style={{ ... }}` with fixed pixel values. Almost certainly broken on mobile. End-users view sites on phones.

**Form email notifications** — Submissions are saved to DB but users get no email alert. A contact form that silently collects data is useless for small businesses. Use Resend or SendGrid.

---

## 2. AI editor quality

The LLM is the core differentiator. If it makes reliable changes, users stay. If it breaks the site, they leave.

- **Version history UI** — `versions` table exists but no UI to restore. If AI makes a bad change, there's no recovery path visible to the user.
- **Undo/redo** in the editor
- **Better system prompt** — more examples of good vs bad changes, especially around schema structure

---

## 3. Monetization

Natural model:
- **Free**: 1-2 sites, `sitebot.vercel.app` subdomain, limited AI generations
- **Pro (~15€/mo)**: Custom domain, unlimited sites, priority AI, form email notifications
- **Business (~49€/mo)**: Multiple team members, advanced analytics, white-label

Stack: Stripe + custom domain gating.

---

## 4. Onboarding & first-run experience

New users don't know what to do. Needs to answer:
- "What can I do here?" → guided first site creation
- "Is this real?" → show a live example site immediately
- "How do I share it?" → copy link prominently after publish

Good onboarding converts curious visitors into retained users.

---

## 5. Distribution

No inherent virality yet. Two levers:
- **"Made with SiteBot" badge** on published sites — every site becomes an ad. Opt-out for paid users.
- **Template gallery** — SEO-friendly public page showing what SiteBot can build ("Restaurant website builder AI", "Portfolio website AI", etc.)

---

## Sprint 1 — DONE (2026-04-05/06)

- ✅ Version history UI (restore with one click)
- ✅ Form email notifications (Resend already wired)
- ✅ Mobile CSS fixes (hamburger nav, responsive grids)
- ✅ "Made with SiteBot" badge on published sites
- ✅ Dark / light mode toggle (next-themes)
- ✅ Custom domains UI + API (Vercel API, CNAME instructions)
- ✅ Onboarding empty state redesign
- ✅ Login page marquee (23 animated site cards, alternating rows)
- ✅ Deploy button style unified (green everywhere)
- ✅ `contact_submissions` table + `view_count` + `custom_domain` SQL migration provided

---

## Sprint 2 — Big next steps (prioritized)

### 1. Landing page — HIGHEST IMPACT, not built yet
Zero organic acquisition without it. Needs:
- Public `/` route (not login)
- Hero with one CTA ("Créer mon site gratuitement")
- Reuse the marquee component from login
- 2–3 real published site examples as proof
- Simple pricing section (Free vs Pro)
- SEO-indexed for "créer site web IA", "website builder AI france"
**Why first:** No landing page = no organic traffic = no growth.

### 2. Paywall enforcement — NO REVENUE WITHOUT IT
Stripe + webhook are wired, `profiles.plan` exists, but nothing actually blocks free users.
- Enforce 2-site limit on free plan (code has a check, needs verifying end-to-end)
- Gate custom domains behind Pro
- Show upgrade modal at the right friction points (deploy with custom domain, 3rd site, etc.)
**Why second:** Product works but generates no money.

### 3. Email activation flows
Resend is installed but only sends contact form notifications. Add:
- Welcome email on signup
- "Your site is live" on first deploy
- 7-day nudge if user hasn't deployed yet
**Why:** Cheapest way to improve activation and retention.

### 4. Section add/remove UI in the editor
Users currently rely 100% on the LLM to restructure sites. A sidebar with "Add section" buttons (hero, features, testimonials, pricing, team, FAQ…) would make the editor dramatically more useful and reduce LLM errors.

### 5. AI prompt quality improvements
The system prompt is functional but output is inconsistent. Needs:
- More curated examples of good schemas per site type
- Stricter schema validation before saving
- Better handling of edge cases (empty fields, long descriptions)

---

## Current known bugs / tech debt

- `schemaToHtml` team/gallery image fix — done 2026-04-05, requires redeploy to take effect
- `contact_submissions` table — SQL migration must be run manually in Supabase SQL editor
- Vercel `deployed_url` now uses stable project alias `https://sitebot-{id8}.vercel.app`
- Custom domains require the site to have been deployed at least once (Vercel project must exist)
