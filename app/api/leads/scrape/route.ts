import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const SKIP_EMAIL_DOMAINS = new Set([
  'sentry.io','wix.com','squarespace.com','wordpress.com','shopify.com',
  'example.com','w3.org','schema.org','facebook.com','instagram.com',
  'twitter.com','google.com','apple.com','microsoft.com','amazon.com',
])

interface ScrapeResult {
  url:              string
  business_name?:   string
  page_title?:      string
  meta_description?: string
  email?:           string
  phone?:           string
  cms?:             string
  og_image?:        string
  error?:           string
}

async function scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
  let url = rawUrl.trim()
  if (!url.startsWith('http')) url = 'https://' + url

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)

    if (!res.ok) return { url, error: `HTTP ${res.status}` }

    const html = await res.text()

    // Title
    const title = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]
      ?.trim().replace(/\s+/g, ' ') || ''

    // Meta description
    const description =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})/i)?.[1]?.trim() ||
      html.match(/<meta[^>]+content=["']([^"']{1,300})["'][^>]+name=["']description["']/i)?.[1]?.trim() ||
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,300})/i)?.[1]?.trim() || ''

    // OG image
    const ogImage =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] || ''

    // Emails from mailto links (highest quality)
    const emailMatches = [...html.matchAll(/href=["']mailto:([^"'?@\s]{1,80}@[^"'?\s]{1,80})/gi)]
    const emails = [...new Set(emailMatches.map(m => m[1].toLowerCase().trim()))]
      .filter(e => {
        const domain = e.split('@')[1]
        return domain && !SKIP_EMAIL_DOMAINS.has(domain) && !domain.endsWith('.png') && !domain.endsWith('.jpg')
      })

    // Phone (French format or international)
    const phones = html.match(/(?:0|\+33)[1-9](?:[\s.\-]?\d{2}){4}/g) || []

    // CMS detection
    const cms = html.includes('wp-content')                    ? 'WordPress'
      : (html.includes('wix.com') || html.includes('_wix'))   ? 'Wix'
      : html.includes('squarespace')                           ? 'Squarespace'
      : html.includes('webflow')                               ? 'Webflow'
      : html.includes('shopify')                               ? 'Shopify'
      : html.includes('jimdo')                                 ? 'Jimdo'
      : html.includes('prestashop')                            ? 'PrestaShop'
      : 'Custom'

    // Best guess at business name: og:site_name > title (before separator)
    const siteName =
      html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{1,100})["']/i)?.[1]?.trim() ||
      html.match(/<meta[^>]+content=["']([^"']{1,100})["'][^>]+property=["']og:site_name["']/i)?.[1]?.trim()

    const businessName = siteName || title.split(/[|\-–—]/)[0].trim()

    return {
      url,
      business_name:    businessName || '',
      page_title:       title,
      meta_description: description,
      email:            emails[0]  || undefined,
      phone:            phones[0]  || undefined,
      cms,
      og_image:         ogImage    || undefined,
    }
  } catch (err) {
    clearTimeout(timer)
    const msg = err instanceof Error ? err.message : 'Failed'
    return { url, error: msg.includes('abort') ? 'Timeout' : msg }
  }
}

// POST /api/leads/scrape
// Body: { urls: string[] }   (max 50)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const urls: string[] = (body.urls ?? []).slice(0, 50)

  if (!urls.length) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
  }

  // Process with limited concurrency (3 at a time)
  const results: ScrapeResult[] = []
  const CONCURRENCY = 3

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch  = urls.slice(i, i + CONCURRENCY)
    const batch_results = await Promise.all(batch.map(scrapeUrl))
    results.push(...batch_results)
  }

  return NextResponse.json({ results })
}
