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
  slug:           string
  name:           string
  url:            string
  industry:       string
  site_type:      string
  tags:           string[]
  fonts:          string[]
  has_dark_bg:    boolean
  cta_texts:      string[]
  screenshot_url: string | null
}

// ── Industry keyword mapping ──────────────────────────────────────────────────
// Maps free-form siteType + user message keywords → `industry` values in DB.

const KEYWORD_TO_INDUSTRIES: Array<{ keywords: string[]; industries: string[] }> = [
  { keywords: ['restaurant', 'food', 'café', 'brasserie', 'bistro', 'gastrono', 'cuisine', 'menu'], industries: ['Restaurant', 'Food & Grocery'] },
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

  // Prefer exact industry match; fall back to a broader sample
  const query = supabaseAdmin
    .from('templates')
    .select('slug, name, url, industry, site_type, tags, fonts, has_dark_bg, cta_texts, screenshot_url')
    .limit(50) // fetch a pool to rank locally

  const { data, error } = industries.length > 0
    ? await query.in('industry', industries)
    : await query

  if (error || !data || data.length === 0) {
    // No industry match → return a sample across all industries
    const { data: fallback } = await supabaseAdmin
      .from('templates')
      .select('slug, name, url, industry, site_type, tags, fonts, has_dark_bg, cta_texts, screenshot_url')
      .limit(limit)

    return (fallback ?? []) as ScrapedTemplate[]
  }

  // Rank by tag overlap with the user message
  const combined = `${siteType} ${userMessage}`.toLowerCase()
  const scored = (data as ScrapedTemplate[]).map(t => {
    const tagScore = t.tags.filter(tag => combined.includes(tag.toLowerCase())).length
    return { t, score: tagScore }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ t }) => t)
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

  const lines = templates.map(t => {
    const fonts   = t.fonts.slice(0, 3).join(', ') || 'system-ui'
    const bg      = t.has_dark_bg ? 'dark background' : 'light background'
    const ctas    = t.cta_texts.slice(0, 3).join(' / ')
    return `• ${t.name} (${t.industry}): ${bg}, fonts: ${fonts}${ctas ? `, CTAs: "${ctas}"` : ''}`
  })

  return `\nRéférences visuelles réelles observées dans cette industrie :
${lines.join('\n')}
→ Inspire-toi de leurs patterns de mise en page et typographies, pas de leurs contenus.\n`
}
