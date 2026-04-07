export interface SiteMeta {
  title: string
  lang?: string
  primaryColor: string   // hex e.g. "#7c3aed"
  bgColor?: string       // page background
  textColor?: string     // main text
  accentColor?: string   // secondary accent
  darkMode?: boolean
  fontStyle?: 'sans' | 'serif' | 'mono'
}

export interface NavLink { label: string; href: string }

export interface SiteNav {
  logo: string
  links: NavLink[]
  cta?: { label: string; href: string }
}

// ─── Block types ───────────────────────────────────────────────────────────────

export interface HeroBlock {
  type: 'hero'
  id?: string
  variant?: 'centered' | 'split' | 'minimal'  // default: centered
  title: string
  subtitle?: string
  badge?: string
  image?: string        // URL — shown as hero background or side image
  ctaLabel?: string
  ctaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
}

export interface FeaturesBlock {
  type: 'features'
  id?: string
  variant?: 'cards' | 'list' | 'alternating'  // default: cards
  title: string
  subtitle?: string
  columns?: 2 | 3 | 4
  items: { icon?: string; title: string; desc: string }[]
}

export interface TestimonialsBlock {
  type: 'testimonials'
  id?: string
  title?: string
  items: { name: string; role?: string; text: string; rating?: number }[]
}

export interface PricingBlock {
  type: 'pricing'
  id?: string
  title?: string
  subtitle?: string
  plans: {
    name: string
    price: string
    period?: string
    desc?: string
    features: string[]
    highlighted?: boolean
    ctaLabel?: string
  }[]
}

export interface ContactBlock {
  type: 'contact'
  id?: string
  title?: string
  subtitle?: string
  email?: string
  phone?: string
  address?: string
  showForm?: boolean
}

export interface TeamBlock {
  type: 'team'
  id?: string
  title?: string
  members: { name: string; role: string; bio?: string; emoji?: string; color?: string; image?: string }[]
}

export interface FAQBlock {
  type: 'faq'
  id?: string
  title?: string
  items: { q: string; a: string }[]
}

export interface StatsBlock {
  type: 'stats'
  id?: string
  title?: string
  items: { value: string; label: string }[]
}

export interface CTABlock {
  type: 'cta'
  id?: string
  title: string
  subtitle?: string
  ctaLabel: string
  ctaHref?: string
}

export interface GalleryBlock {
  type: 'gallery'
  id?: string
  title?: string
  items: { label?: string; color: string; emoji?: string; image?: string }[]
}

export interface ContentBlock {
  type: 'content'
  id?: string
  title?: string
  text: string
  align?: 'left' | 'center'
}

export type SiteBlock =
  | HeroBlock | FeaturesBlock | TestimonialsBlock | PricingBlock
  | ContactBlock | TeamBlock | FAQBlock | StatsBlock | CTABlock
  | GalleryBlock | ContentBlock

export interface SiteFooter {
  text: string
  links?: NavLink[]
  socials?: { platform: string; href: string }[]
}

export interface SiteSchema {
  meta: SiteMeta
  nav?: SiteNav
  sections: SiteBlock[]
  footer?: SiteFooter
}

export function isSiteSchema(value: unknown): value is SiteSchema {
  if (typeof value !== 'object' || !value) return false
  const v = value as Record<string, unknown>
  return typeof v.meta === 'object' && Array.isArray(v.sections)
}

export function parseSchema(raw: string): SiteSchema | null {
  try {
    const parsed = JSON.parse(raw)
    return isSiteSchema(parsed) ? parsed : null
  } catch { return null }
}
