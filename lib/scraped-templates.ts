/**
 * Reference template database — backed by the `templates` Supabase table.
 * Populated by: node scripts/import-templates.mjs
 *
 * Used to inject real-world design patterns (and optional screenshots) into
 * the manifest generation prompt, so Claude sees what real industry sites
 * look like before producing a design spec.
 */

import { supabaseAdmin } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapedTemplate {
  slug:             string
  name:             string
  url:              string
  industry:         string
  site_type:        string
  tags:             string[]
  fonts:            string[]
  has_dark_bg:      boolean
  cta_texts:        string[]
  screenshot_url:   string | null
  quality_score:    number | null
  html_url:         string | null
  react_code?:      string | null   // populated from reference_sites
}

// ── Industry keyword mapping ──────────────────────────────────────────────────
// Maps free-form siteType + user message keywords → `industry` values in DB.

const KEYWORD_TO_INDUSTRIES: Array<{ keywords: string[]; industries: string[] }> = [
  { keywords: ['boulangerie', 'boulanger', 'pâtisserie', 'patisserie', 'bakery', 'viennoiserie', 'croissant', 'pain', 'bread'], industries: ['Boulangerie'] },
  { keywords: ['restaurant', 'food', 'café', 'brasserie', 'bistro', 'gastrono', 'cuisine', 'menu'], industries: ['Restaurant', 'Food & Grocery', 'Boulangerie'] },
  { keywords: ['fashion', 'mode', 'luxury', 'luxe', 'vêtement', 'clothing', 'apparel', 'couture'],  industries: ['Fashion & Luxury', 'E-commerce'] },
  { keywords: ['shop', 'ecommerce', 'store', 'boutique', 'product', 'produit', 'marketplace'],       industries: ['E-commerce'] },
  { keywords: ['saas', 'software', 'app', 'platform', 'tool', 'productivity', 'dashboard'],          industries: ['SaaS', 'Developer Tools'] },
  { keywords: ['developer', 'dev', 'code', 'api', 'open source', 'github', 'cli'],                   industries: ['Developer Tools', 'SaaS'] },
  { keywords: ['health', 'medical', 'doctor', 'clinic', 'santé', 'médecin', 'soin'],                 industries: ['Healthcare'] },
  { keywords: ['fitness', 'gym', 'sport', 'workout', 'coach', 'training', 'entraînement'],           industries: ['Fitness'] },
  { keywords: ['beauty', 'wellness', 'spa', 'skincare', 'cosmetic', 'beauté', 'bien-être'],          industries: ['Beauty & Wellness'] },
  { keywords: ['real estate', 'immobilier', 'property', 'apartment', 'maison', 'logement'],          industries: ['Real Estate'] },
  { keywords: ['travel', 'voyage', 'hotel', 'tourism', 'airbnb', 'booking'],                         industries: ['Travel'] },
  { keywords: ['education', 'cours', 'formation', 'learning', 'school', 'academy', 'université'],    industries: ['Education'] },
  { keywords: ['finance', 'fintech', 'banking', 'invest', 'crypto', 'payment', 'paiement'],          industries: ['Finance'] },
  { keywords: ['agency', 'agence', 'studio', 'portfolio', 'creative', 'design', 'branding'],         industries: ['Agency / Portfolio', 'Design & Creative'] },
  { keywords: ['marketing', 'analytics', 'seo', 'growth', 'ads', 'email', 'campaign'],               industries: ['Marketing & Analytics'] },
  { keywords: ['legal', 'law', 'avocat', 'juridique', 'notaire', 'cabinet'],                         industries: ['Legal'] },
  { keywords: ['nonprofit', 'association', 'ngo', 'charity', 'cause', 'donation'],                   industries: ['Non-profit'] },
  { keywords: ['event', 'ticket', 'festival', 'conference', 'evenement'],                             industries: ['Events & Ticketing'] },
  { keywords: ['media', 'blog', 'news', 'magazine', 'editorial', 'journal'],                         industries: ['Media / Blog'] },
  { keywords: ['gaming', 'game', 'esport', 'jeu'],                                                   industries: ['Gaming'] },
  { keywords: ['interior', 'furniture', 'home', 'décor', 'maison'],                                  industries: ['Home & Interior'] },
  { keywords: ['sustainability', 'green', 'eco', 'climate', 'environnement'],                        industries: ['Sustainability'] },
  { keywords: ['hr', 'recrut', 'hiring', 'talent', 'rh', 'emploi'],                                  industries: ['HR & Recruiting'] },
  { keywords: ['logistics', 'shipping', 'supply', 'freight', 'livraison'],                           industries: ['Logistics'] },
]

function detectIndustries(siteType: string, userMessage: string): string[] {
  const combined = `${siteType} ${userMessage}`.toLowerCase()
  for (const { keywords, industries } of KEYWORD_TO_INDUSTRIES) {
    if (keywords.some(k => combined.includes(k))) return industries
  }
  return []
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns up to `limit` reference templates from Supabase most relevant to
 * the given site context. Falls back to an empty array on DB errors.
 */
export async function getRelevantTemplates(
  siteType:    string,
  userMessage: string,
  limit = 3,
): Promise<ScrapedTemplate[]> {
  const industries = detectIndustries(siteType, userMessage)

  // ── 1. Query reference_sites (replicated React code from real sites) ─────────
  const refQuery = supabaseAdmin
    .from('reference_sites')
    .select('slug, name, url, industry, screenshot_url, html_url, react_code')
    .not('react_code', 'is', null)
    .order('id', { ascending: false })
    .limit(20)

  const { data: refData } = industries.length > 0
    ? await refQuery.in('industry', industries)
    : await refQuery

  const refTemplates: ScrapedTemplate[] = (refData ?? []).map(r => ({
    slug:           r.slug ?? r.url ?? '',
    name:           r.name ?? '',
    url:            r.url  ?? '',
    industry:       r.industry ?? '',
    site_type:      siteType,
    tags:           [],
    fonts:          [],
    has_dark_bg:    false,
    cta_texts:      [],
    screenshot_url: r.screenshot_url ?? null,
    quality_score:  null,
    html_url:       r.html_url ?? null,
    react_code:     r.react_code ?? null,
  }))

  // If we have enough reference_sites results with react_code, return those directly
  if (refTemplates.length >= limit) {
    return refTemplates.slice(0, limit)
  }

  // ── 2. Fall back to templates table for the remainder ──────────────────────
  const needed = limit - refTemplates.length

  const query = supabaseAdmin
    .from('templates')
    .select('slug, name, url, industry, site_type, tags, fonts, has_dark_bg, cta_texts, screenshot_url, quality_score, html_url')
    .not('has_cookies_wall', 'eq', true)
    .order('quality_score', { ascending: false, nullsFirst: false })
    .limit(50)

  const { data, error } = industries.length > 0
    ? await query.in('industry', industries)
    : await query

  if (error || !data || data.length === 0) {
    if (refTemplates.length > 0) return refTemplates
    const { data: fallback } = await supabaseAdmin
      .from('templates')
      .select('slug, name, url, industry, site_type, tags, fonts, has_dark_bg, cta_texts, screenshot_url')
      .limit(limit)
    return (fallback ?? []) as ScrapedTemplate[]
  }

  const combined = `${siteType} ${userMessage}`.toLowerCase()
  const scored = (data as ScrapedTemplate[]).map(t => {
    const tagScore = t.tags.filter(tag => combined.includes(tag.toLowerCase())).length
    return { t, score: tagScore }
  })
  const topTemplates = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, needed)
    .map(({ t }) => t)

  return [...refTemplates, ...topTemplates]
}

/**
 * Fetches a template screenshot from Supabase Storage and returns base64.
 * Returns null if no screenshot_url is stored for the template.
 */
export async function getTemplateScreenshot(
  template: ScrapedTemplate,
): Promise<{ base64: string; mimeType: 'image/png' } | null> {
  if (!template.screenshot_url) return null
  try {
    const res = await fetch(template.screenshot_url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    return { base64: buffer.toString('base64'), mimeType: 'image/png' }
  } catch {
    return null
  }
}

/**
 * Builds a compact text block describing reference templates for prompt injection.
 */
export function buildTemplateContext(templates: ScrapedTemplate[]): string {
  if (templates.length === 0) return ''

  const withCode    = templates.filter(t => t.react_code)
  const withoutCode = templates.filter(t => !t.react_code)

  const lines = withoutCode.map(t => {
    const fonts = t.fonts.slice(0, 3).join(', ') || 'system-ui'
    const bg    = t.has_dark_bg ? 'dark background' : 'light background'
    const ctas  = t.cta_texts.slice(0, 3).join(' / ')
    return `• ${t.name} (${t.industry}): ${bg}, fonts: ${fonts}${ctas ? `, CTAs: "${ctas}"` : ''}`
  })

  const codeBlocks = withCode.map(t =>
    `### Référence : ${t.name} (${t.industry})\n\`\`\`tsx\n${(t.react_code ?? '').slice(0, 6000)}\n\`\`\``
  )

  const metaSection = lines.length > 0
    ? `\nRéférences visuelles réelles observées dans cette industrie :\n${lines.join('\n')}\n→ Inspire-toi de leurs patterns de mise en page et typographies, pas de leurs contenus.\n`
    : ''

  const codeSection = codeBlocks.length > 0
    ? `\n━━ SITES DE RÉFÉRENCE — CODE REACT RÉEL (style anonymisé) ━━\nInspire-toi STRICTEMENT de ces patterns de layout, composants et style Tailwind. Adapte le contenu pour le nouveau business.\n\n${codeBlocks.join('\n\n')}\n`
    : ''

  return metaSection + codeSection
}
