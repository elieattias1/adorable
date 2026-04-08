# Bug Fixes Log

## 2026-04-07

---

### Fix 1 — Loading overlay showed on every new empty site

**Symptom:** "Génération en cours…" full-screen overlay appeared as soon as the editor opened for a new site, even before the user had typed anything.

**Root cause:** `isWaitingForGeneration` was passed as `!siteCode && !isGenerating` — always `true` on any empty site.

**Fix:** Changed to `isGenerating && !siteCode` — the overlay now only appears when a generation is actively running and no code exists yet.

**Files:** `app/editor/[id]/page.tsx`

---

### Fix 2 — Background site generation never produced HTML

**Symptom:** After creating a new site, the editor would poll for content for up to 60s and find nothing. The loading overlay stayed forever.

**Root cause:** `POST /api/sites` fired `generateInitialSite()` as a background job. That function called Claude with the `ask_user` tool available, so Claude asked "Quel type de site voulez-vous créer?" instead of generating HTML. The question was sent to nobody, so the job silently failed.

**Fix:** Removed `generateInitialSite()` entirely from site creation. Sites now start empty. The editor auto-triggers the proper streaming generation flow on first open (see Fix 3).

**Files:** `app/api/sites/route.ts`

---

### Fix 3 — No streaming / no live feedback during generation

**Symptom:** After typing in the chat, users had to wait silently with no visual feedback. The preview stayed blank or showed the placeholder.

**Root cause:** The initial generation path (Fix 2) never used the streaming SSE endpoint. Even when it worked, there was no live code preview.

**Fix:** On site creation, the user's description is now passed via `?init=` URL param to the editor. When the editor opens to a fresh site (no code, no messages), it automatically calls `handleSend()` with that description after 300ms. This uses the existing `/api/generate` streaming endpoint — the user sees:
- An agent step indicator ("Analyse…", "Génération du code…")
- Code being written token by token in the `StreamingOverlay`
- The preview updating live as soon as a complete component is ready

**Files:** `app/editor/[id]/page.tsx`, `components/dashboard/NewSiteModal.tsx`

---

### Fix 4 — Next.js CVE-2025-66478 blocked Vercel deployment

**Symptom:** Vercel refused to deploy with: `Vulnerable version of Next.js detected, please update immediately.`

**Root cause:** Pinned to `15.2.4` which contains CVE-2025-66478.

**Fix:** Upgraded to `15.2.9` (latest 15.2.x patch). Intentionally staying on 15.2.x because all 15.3.x versions have a separate build crash (`pages-manifest.json ENOENT` during "Collecting build traces") that prevents Vercel builds from completing.

**Files:** `package.json`, `package-lock.json`
