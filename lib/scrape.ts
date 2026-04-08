// lib/scrape.ts — server-side only (Playwright)

const TIMEOUT    = 30_000
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export interface ScrapeSuccess {
  ok: true
  title: string
  metaDescription: string
  fonts: string[]
  backgroundColors: string[]
  textColors: string[]
  navLinks: string[]
  headings: Array<{ tag: string; text: string }>
  ctaTexts: string[]
  bodyTexts: string[]
  hasDarkBg: boolean
  hasVideo: boolean
  htmlSnippet: string
}

export interface ScrapeFailure {
  ok: false
  error: string
}

export type ScrapeResult = ScrapeSuccess | ScrapeFailure

function cleanHTML(raw: string): string {
  return raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/ style="[^"]*"/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function friendlyError(msg: string): string {
  if (msg.includes('ERR_NAME_NOT_RESOLVED'))  return 'Impossible de résoudre le domaine — vérifiez l\'URL'
  if (msg.includes('ERR_CONNECTION_REFUSED')) return 'Connexion refusée — le site est peut-être hors ligne'
  if (msg.includes('ERR_TOO_MANY_REDIRECTS')) return 'Trop de redirections — le site boucle sur lui-même'
  if (msg.includes('403') || msg.includes('Forbidden')) return 'Accès refusé (403) — le site bloque les bots'
  if (msg.includes('Timeout') || msg.includes('timeout')) return 'Délai dépassé (30s) — le site est trop lent ou bloque les bots'
  if (msg.includes('Executable') || msg.includes('MODULE_NOT_FOUND') || msg.includes('browserType.launch')) {
    return 'Playwright non disponible dans cet environnement — scraping impossible en production'
  }
  return msg.slice(0, 200)
}

export async function scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
  // Normalize URL
  let url = rawUrl.trim()
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  let browser: any
  try {
    const { chromium } = await import('playwright')
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    const context = await browser.newContext({
      viewport:  { width: 1440, height: 900 },
      userAgent: USER_AGENT,
      locale:    'en-US',
    })
    const page = await context.newPage()

    // Block fonts/videos to speed things up
    await page.route('**/*.{mp4,webm,woff,woff2,ttf,eot,otf}', (route: any) => route.abort())

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
    await page.waitForTimeout(2500)

    // Dismiss cookie banners
    for (const sel of [
      "[id*='cookie'] button", "[class*='cookie'] button",
      "[id*='consent'] button", "[class*='accept']",
      "[aria-label*='Accept']", "[aria-label*='accept']",
    ]) {
      try { await page.click(sel, { timeout: 800 }); break } catch {}
    }

    // Extract all metadata in one page.evaluate call
    const meta: Omit<ScrapeSuccess, 'ok' | 'htmlSnippet'> = await page.evaluate(() => {
      const bgMap: Record<string, number> = {}
      const fgMap: Record<string, number> = {}
      const fontSet = new Set<string>()

      document.querySelectorAll('*').forEach((el: Element) => {
        const style = window.getComputedStyle(el)

        // fonts
        const f = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim()
        if (f) fontSet.add(f)

        // background colors
        const bg = style.backgroundColor
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          bgMap[bg] = (bgMap[bg] || 0) + 1
        }

        // text colors
        const fg = style.color
        if (fg) fgMap[fg] = (fgMap[fg] || 0) + 1
      })

      const topBg = Object.entries(bgMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => c)
      const topFg = Object.entries(fgMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c)

      const navLinks = Array.from(document.querySelectorAll('nav a, header a'))
        .map((a: any) => a.textContent?.trim() ?? '').filter(Boolean).slice(0, 12) as string[]

      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map((h: any) => ({ tag: h.tagName as string, text: (h.textContent?.trim() ?? '').slice(0, 120) }))
        .filter(h => h.text).slice(0, 15)

      const ctas = Array.from(
        document.querySelectorAll("button, a[class*='btn'], a[class*='cta'], a[class*='button'], a[class*='cta']")
      ).map((el: any) => el.textContent?.trim() ?? '')
        .filter((t: string) => t.length > 1 && t.length < 60)
        .slice(0, 8) as string[]

      const bodyTexts = Array.from(document.querySelectorAll('p, li'))
        .map((el: any) => el.textContent?.trim() ?? '')
        .filter((t: string) => t.length > 20 && t.length < 400)
        .slice(0, 20) as string[]

      const hasDarkBg = topBg.some(c => {
        const m = c.match(/\d+/g)
        if (!m) return false
        const [r, g, b] = m.map(Number)
        return r < 80 && g < 80 && b < 80
      })

      return {
        title:            document.title,
        metaDescription:  document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
        fonts:            [...fontSet].slice(0, 8),
        backgroundColors: topBg,
        textColors:       topFg,
        navLinks,
        headings,
        ctaTexts:         ctas,
        bodyTexts,
        hasDarkBg,
        hasVideo:         !!document.querySelector('video'),
      }
    })

    const rawHTML    = await page.content()
    const htmlSnippet = cleanHTML(rawHTML).slice(0, 5000)

    await context.close()
    await browser.close()

    return { ok: true, ...meta, htmlSnippet }

  } catch (err: any) {
    if (browser) await browser.close().catch(() => {})
    return { ok: false, error: friendlyError(err?.message ?? 'Unknown error') }
  }
}

export function formatScrapeForAgent(r: ScrapeSuccess, url: string): string {
  const lines: string[] = []

  lines.push(`═══ SITE SCRAPED: ${url} ═══`)
  lines.push(`Titre : ${r.title}`)
  if (r.metaDescription) lines.push(`Description : ${r.metaDescription}`)
  lines.push('')

  lines.push('THÈME VISUEL :')
  lines.push(`• Fond sombre : ${r.hasDarkBg ? 'oui' : 'non'}`)
  lines.push(`• Couleurs de fond dominantes : ${r.backgroundColors.slice(0, 5).join(', ')}`)
  lines.push(`• Couleurs de texte : ${r.textColors.slice(0, 3).join(', ')}`)
  lines.push(`• Polices : ${r.fonts.join(', ')}`)
  if (r.hasVideo) lines.push('• Contient une vidéo hero')
  lines.push('')

  if (r.navLinks.length > 0) {
    lines.push(`NAVIGATION : ${r.navLinks.join(' | ')}`)
    lines.push('')
  }

  if (r.headings.length > 0) {
    lines.push('TITRES ET SOUS-TITRES :')
    r.headings.forEach(h => lines.push(`  ${h.tag}: "${h.text}"`))
    lines.push('')
  }

  if (r.ctaTexts.length > 0) {
    lines.push(`BOUTONS CTA : ${r.ctaTexts.join(' | ')}`)
    lines.push('')
  }

  if (r.bodyTexts.length > 0) {
    lines.push('CONTENU TEXTUEL (extraits) :')
    r.bodyTexts.slice(0, 10).forEach(t => lines.push(`  • ${t}`))
    lines.push('')
  }

  lines.push('STRUCTURE HTML (extrait nettoyé) :')
  lines.push(r.htmlSnippet)

  return lines.join('\n')
}
