# SiteBot — AI Handoff Prompt

> Copy-paste this entire document into Cursor, Claude, or any AI coding assistant
> to continue building SiteBot from where we left off.

---

## What is SiteBot?

SiteBot is a **SaaS AI website builder** — users describe what they want,
a chatbot (Claude API) generates complete HTML sites, and they can host them
with one click. Think Wix or Squarespace, but controlled entirely through chat.

## Tech Stack

| Layer         | Technology                                 |
|---------------|--------------------------------------------|
| Framework     | Next.js 15 (App Router, TypeScript)        |
| Styling       | Tailwind CSS + shadcn/ui                   |
| Auth          | Supabase Auth (email/password + Google SSO)|
| Database      | Supabase (PostgreSQL) with RLS             |
| AI            | Anthropic Claude API (`claude-opus-4-5`)   |
| Payments      | Stripe (subscriptions)                     |
| Deployment    | App on Vercel, generated sites on Vercel API |
| State         | React hooks + Supabase realtime            |

## Business Model

- **Free plan**: 1 site, 5 version snapshots, no custom domain
- **Pro plan**: €12/month — unlimited sites, unlimited versions, custom domain
- Stripe handles subscriptions; webhook updates `profiles.plan` in Supabase
- 7-day free trial on Pro

## Project Structure

```
sitebot/
├── app/
│   ├── layout.tsx               ✅ done
│   ├── globals.css              ✅ done
│   ├── login/page.tsx           ✅ done — full auth page with showcase
│   ├── dashboard/               ⬜ TODO — list of user's sites
│   │   └── page.tsx
│   ├── editor/[id]/             ⬜ TODO — split view: chat + preview
│   │   └── page.tsx
│   └── api/
│       ├── sites/route.ts       ✅ done — CRUD for sites
│       ├── generate/route.ts    ✅ done — Claude integration
│       ├── deploy/route.ts      ✅ done — Vercel deployment
│       └── stripe/
│           ├── checkout/route.ts ✅ done — checkout + portal
│           └── webhook/route.ts  ✅ done — subscription sync
├── components/
│   ├── dashboard/               ⬜ TODO
│   │   ├── SiteCard.tsx         — project card with thumbnail
│   │   ├── NewSiteModal.tsx     — create site form
│   │   └── PlanBanner.tsx       — upgrade prompt
│   ├── editor/                  ⬜ TODO
│   │   ├── ChatPanel.tsx        — message list + input
│   │   ├── PreviewPane.tsx      — iframe preview
│   │   ├── VersionPanel.tsx     — version history sidebar
│   │   └── EditorTopBar.tsx     — back, deploy, version buttons
│   └── ui/                      ⬜ TODO — shadcn/ui components
├── lib/
│   ├── supabase.ts              ✅ done
│   ├── stripe.ts                ✅ done
│   ├── anthropic.ts             ✅ done
│   └── deploy.ts                ✅ done
├── hooks/
│   └── useSites.ts              ✅ done
├── types/
│   └── supabase.ts              ✅ done
├── supabase/
│   └── schema.sql               ✅ done
├── middleware.ts                ✅ done
├── package.json                 ✅ done
└── .env.example                 ✅ done
```

## What's Already Built (✅)

1. **Auth middleware** — redirects unauthenticated to /login, authenticated away from /login
2. **Login page** — email/password + Google SSO, split layout with 6 site showcase cards
3. **All API routes**:
   - `POST /api/sites` — creates site (checks plan limit → 403 if exceeded)
   - `GET /api/sites` — lists user's sites
   - `DELETE /api/sites?id=` — deletes site
   - `POST /api/generate` — sends message to Claude, saves version, updates HTML
   - `PUT /api/generate` — generates initial HTML for new site
   - `POST /api/deploy` — deploys to Vercel, saves URL
   - `POST /api/stripe/checkout` — creates Stripe Checkout session
   - `PUT /api/stripe/checkout` — creates Stripe Portal session
   - `POST /api/stripe/webhook` — handles subscription created/updated/deleted
4. **Supabase schema** — profiles, sites, messages, versions, RLS policies, user_limits view
5. **Lib utilities** — typed Supabase client, Stripe helpers, Anthropic generation, Vercel deploy
6. **`useSites` hook** — data fetching with createSite/deleteSite/refetch
7. **Types** — full Supabase type definitions

## What Needs to Be Built (⬜ TODO — start here)

### Priority 1: Dashboard Page (`app/dashboard/page.tsx`)
This is the main page users see after login. It must:
- Fetch and display user's sites as cards (use `useSites` hook)
- Show the user's plan (free/pro) from Supabase `profiles` table
- Have a "New Site" button that opens `NewSiteModal`
- Show upgrade banner if free plan
- Navigate to `/editor/[id]` when a site card is clicked
- Handle `?upgraded=true` in URL (show success toast)

```tsx
// Expected component structure:
<DashboardLayout>
  <TopBar>  {/* SiteBot logo, plan badge, user avatar/logout */}
  <UpgradeBanner />  {/* show if plan === 'free' */}
  <SiteGrid>
    {sites.map(s => <SiteCard key={s.id} site={s} />)}
    <NewSiteButton />
  </SiteGrid>
  <NewSiteModal />
</DashboardLayout>
```

### Priority 2: Editor Page (`app/editor/[id]/page.tsx`)
Split-view page. Fetch site by ID, then render:
- **Left ~65%**: iframe preview of current HTML
- **Right ~35%**: chat panel (message history + input)
- **Top bar**: back button, site name, version count, "Deploy" button, desktop/mobile toggle
- **Version panel**: slides in from right when "X versions" is clicked

Key behaviors:
- On load: fetch site HTML + message history from Supabase
- On message send: `POST /api/generate` → update iframe + message list
- After 3+ messages: auto-save version
- Deploy button: `POST /api/deploy` → show deployed URL in toast
- Mobile preview: set iframe container to `width: 375px`

```tsx
// Expected data flow:
const site = await fetchSite(params.id)         // GET from Supabase
const messages = await fetchMessages(params.id)  // GET from Supabase
const versions = await fetchVersions(params.id)  // GET from Supabase

// On chat submit:
const { html, note } = await POST('/api/generate', { siteId, message })
// Update iframe srcDoc with new html
// Append messages to chat
// Increment version count
```

### Priority 3: Components

**`SiteCard.tsx`** — shows gradient thumbnail (based on site type), name, date, message count. Delete button on hover.

**`NewSiteModal.tsx`** — name input + type selector (6 types) + description textarea. On submit: calls `useSites.createSite()`, then navigates to `/editor/[id]`. If plan limit hit: shows paywall instead.

**`PaywallModal.tsx`** — free vs pro comparison table. "Upgrade" button calls `useProfile.startCheckout()`.

**`ChatPanel.tsx`** — scrollable message list (user bubbles right, AI left), typing indicator, quick suggestions chips, textarea input.

**`VersionPanel.tsx`** — slides in from right. Lists versions newest-first. "Restore" button sends the version's HTML back as current. Free plan: lock icon + upgrade prompt on versions > 5.

### Priority 4: Polish

- [ ] Add `loading.tsx` files for skeleton screens
- [ ] Add error boundaries
- [ ] Add toast notifications (Sonner or shadcn Toast) for deploy success, save, errors
- [ ] Add real-time site count from Supabase subscription
- [ ] Add site thumbnail generation (screenshot the iframe, save to Supabase Storage)
- [ ] Add custom domain input (Pro only) with DNS instructions modal
- [ ] Responsive: make editor work on tablet (stack chat below preview)

## Key Conventions

### Calling the generate API
```ts
// Client-side — in ChatPanel or EditorPage:
const res = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ siteId, message: userInput }),
})
const { html, note } = await res.json()
// html: full HTML string or null if Claude didn't generate one
// note: short explanation string (always present)
```

### Auth pattern (Client Components)
```ts
import { createClient } from '@/lib/supabase'
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
// Or use supabase.auth.onAuthStateChange for reactive updates
```

### Auth pattern (Server Components / API Routes)
```ts
import { createServerSupabaseClient } from '@/lib/supabase'
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Plan check pattern
```ts
// Check before creating site:
const res = await fetch('/api/sites', { method: 'POST', ... })
if (res.status === 403) {
  const { code } = await res.json()
  if (code === 'PLAN_LIMIT') openPaywall()
}
```

### Stripe upgrade flow
```ts
// 1. Call checkout endpoint
const res = await fetch('/api/stripe/checkout', {
  method: 'POST',
  body: JSON.stringify({ plan: 'pro' })
})
const { url } = await res.json()
window.location.href = url  // redirects to Stripe Checkout

// 2. After payment, Stripe redirects to /dashboard?upgraded=true
// 3. Webhook fires and updates profiles.plan = 'pro' in Supabase
```

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Create Supabase project at supabase.com, run `supabase/schema.sql`
3. Enable Google Auth in Supabase > Auth > Providers
4. Create Stripe products: one recurring price at €12/month
5. Set up Stripe webhook: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
6. Get Vercel access token for deployment API
7. Run: `npm install && npm run dev`

## Design System

- **Colors**: violet-600/pink-600 gradient for primary actions, gray-950 background, gray-900 cards
- **Border radius**: rounded-xl (12px) for cards, rounded-2xl (16px) for modals
- **Typography**: Inter (system font), bold headings, gray-400 for secondary text
- **Animations**: 200ms transitions, fadeUp for chat bubbles, smooth iframe transitions
- **Icons**: lucide-react throughout
- **Dark mode only** — no light mode for now

## Deployment Checklist

- [ ] Push to GitHub
- [ ] Import to Vercel, add all env vars
- [ ] Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
- [ ] Update Supabase auth redirect URLs to include production domain
- [ ] Create Stripe webhook endpoint pointing to `https://yourdomain.com/api/stripe/webhook`
- [ ] Test full flow: signup → create site → chat → upgrade → deploy

## Open Questions / Decisions Needed

1. **Thumbnail generation**: how to generate site previews? Options: server-side puppeteer screenshot, or just use gradient thumbnails (current approach).
2. **Site hosting model**: currently deploying to Vercel (requires a Vercel account). Alternative: host all sites on a subdomain (`user-site.sitebot.io`) using a single Next.js app that reads HTML from Supabase.
3. **Rate limiting**: add rate limiting on `/api/generate` (e.g., 10 req/min free, 60 req/min pro) using Upstash Redis.
4. **Email**: use Resend for welcome email, payment confirmation, subscription expiry warnings.
5. **Analytics**: add PostHog for user behavior tracking.

---

Start with **Priority 1 (Dashboard)** → **Priority 2 (Editor)** → **Priority 3 (Components)**.
The API is fully functional, so you just need to wire up the UI.
