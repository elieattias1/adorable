'use client'

import React, { useCallback, useState, useRef } from 'react'
import type {
  SiteSchema, SiteMeta, SiteNav, SiteFooter, SiteBlock,
  HeroBlock, FeaturesBlock, TestimonialsBlock, PricingBlock,
  ContactBlock, TeamBlock, FAQBlock, StatsBlock, CTABlock,
  GalleryBlock, ContentBlock,
} from '@/types/site-schema'

// ─── Editable text primitive ──────────────────────────────────────────────────

interface EditableTextProps {
  value: string
  path: string
  editable: boolean
  multiline?: boolean
  style?: React.CSSProperties
  className?: string
}

function EditableText({ value, path, editable, multiline, style, className }: EditableTextProps) {
  if (!editable) return <span style={style} className={className}>{value}</span>

  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const newValue = e.currentTarget.textContent ?? ''
    if (newValue !== value) {
      window.parent.postMessage({ type: 'FIELD_UPDATE', path, value: newValue }, '*')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      e.currentTarget.blur()
    }
    if (e.key === 'Escape') {
      e.currentTarget.textContent = value
      e.currentTarget.blur()
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLSpanElement>) => {
    e.currentTarget.style.outline = '2px dashed rgba(124,58,237,0.6)'
    e.currentTarget.style.outlineOffset = '3px'
    e.currentTarget.style.borderRadius = '3px'
    // Select all on focus
    const range = document.createRange()
    range.selectNodeContents(e.currentTarget)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  const handleBlurStyle = (e: React.FocusEvent<HTMLSpanElement>) => {
    e.currentTarget.style.outline = ''
    e.currentTarget.style.outlineOffset = ''
  }

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      data-path={path}
      onBlur={(e) => { handleBlurStyle(e); handleBlur(e) }}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      style={{
        ...style,
        cursor: 'text',
        whiteSpace: multiline ? 'pre-wrap' : undefined,
      }}
      className={className}
    >
      {value}
    </span>
  )
}

// Shorthand factory — returns a pre-bound E component for a given section path
function makeE(basePath: string, editable: boolean) {
  return function E({
    children, field, multiline, style, className,
  }: {
    children: string
    field: string
    multiline?: boolean
    style?: React.CSSProperties
    className?: string
  }) {
    if (!children) return null
    return (
      <EditableText
        value={children}
        path={`${basePath}.${field}`}
        editable={editable}
        multiline={multiline}
        style={style}
        className={className}
      />
    )
  }
}

// ─── Image replacement wrapper (edit mode) ────────────────────────────────────

interface ImageWrapperProps {
  path: string
  siteId?: string
  editable: boolean
  children: React.ReactNode
  /** Extra styles on the wrapping div */
  wrapStyle?: React.CSSProperties
  /** Where to position the replace button — defaults to bottom-right */
  btnStyle?: React.CSSProperties
  /** If true, renders a full-cover overlay (for small containers like avatars) */
  fullOverlay?: boolean
}

function ImageWrapper({ path, siteId, editable, children, wrapStyle, btnStyle, fullOverlay }: ImageWrapperProps) {
  const [hovered, setHovered] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Always render the wrapper div so wrapStyle (e.g. avatar circle dimensions) is applied in both modes
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (siteId) fd.append('siteId', siteId)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        window.parent.postMessage({ type: 'FIELD_UPDATE', path, value: data.url }, '*')
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const showOverlay = editable && (hovered || uploading)

  return (
    <div
      style={{ position: 'relative', ...wrapStyle }}
      onMouseEnter={editable ? () => setHovered(true) : undefined}
      onMouseLeave={editable ? () => setHovered(false) : undefined}
    >
      {children}
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      )}
      {showOverlay && (
        fullOverlay ? (
          /* Full-cover semi-transparent overlay for small items (avatars, small thumbnails) */
          <div
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10, borderRadius: 'inherit',
              flexDirection: 'column', gap: '4px',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{uploading ? '⏳' : '📷'}</span>
            {!uploading && <span style={{ fontSize: '0.6rem', color: '#fff', fontFamily: 'system-ui', fontWeight: 600, letterSpacing: '0.03em' }}>REMPLACER</span>}
          </div>
        ) : (
          /* Corner button for larger images */
          <button
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            style={{
              position: 'absolute',
              bottom: '10px', right: '10px',
              background: 'rgba(0,0,0,0.72)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '8px',
              padding: '5px 11px',
              fontSize: '0.72rem',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              backdropFilter: 'blur(6px)',
              zIndex: 20,
              whiteSpace: 'nowrap',
              ...btnStyle,
            }}
          >
            {uploading ? '⏳ Chargement…' : '📷 Remplacer'}
          </button>
        )
      )}
    </div>
  )
}

// ─── Theme helpers ─────────────────────────────────────────────────────────────

function themeVars(meta: SiteMeta): React.CSSProperties {
  const isDark = meta.darkMode !== false
  return {
    '--primary':  meta.primaryColor,
    '--bg':       meta.bgColor       || (isDark ? '#0f0f13' : '#ffffff'),
    '--text':     meta.textColor     || (isDark ? '#f0f0f5' : '#111111'),
    '--accent':   meta.accentColor   || meta.primaryColor,
    '--muted':    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    '--border':   isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.12)',
    '--card':     isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
  } as React.CSSProperties
}

function fontFamily(meta: SiteMeta): string {
  if (meta.fontStyle === 'serif') return '"Georgia", "Times New Roman", serif'
  if (meta.fontStyle === 'mono')  return '"Fira Code", "Courier New", monospace'
  return '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
}

// ─── Editable hint overlay ────────────────────────────────────────────────────

function EditHint({ editable }: { editable: boolean }) {
  if (!editable) return null
  return (
    <div style={{
      position: 'fixed', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(124,58,237,0.9)', color: '#fff',
      padding: '6px 14px', borderRadius: '999px', fontSize: '11px',
      fontFamily: 'system-ui, sans-serif', pointerEvents: 'none', zIndex: 9999,
      backdropFilter: 'blur(8px)',
    }}>
      ✏️ Cliquez sur un texte pour le modifier · 📷 Survolez une image pour la remplacer
    </div>
  )
}

// ─── Nav ───────────────────────────────────────────────────────────────────────

function Nav({ nav, meta, editable }: { nav: SiteNav; meta: SiteMeta; editable: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: '64px',
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
        <EditableText value={nav.logo} path="nav.logo" editable={editable} />
      </div>
      {/* Desktop links */}
      <div className={`sr-nav-links${open ? ' sr-open' : ''}`} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {nav.links.map((l, i) => (
          <a key={i} href={l.href} onClick={() => setOpen(false)} style={{
            color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', opacity: 0.75,
          }}>
            <EditableText value={l.label} path={`nav.links.${i}.label`} editable={editable} />
          </a>
        ))}
        {nav.cta && (
          <a href={nav.cta.href} onClick={() => setOpen(false)} style={{
            background: 'var(--primary)', color: '#fff',
            padding: '0.5rem 1.2rem', borderRadius: '8px',
            textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
          }}>
            <EditableText value={nav.cta.label} path="nav.cta.label" editable={editable} />
          </a>
        )}
      </div>
      {/* Hamburger — hidden on desktop via CSS */}
      <button
        className="sr-hamburger"
        onClick={() => setOpen(v => !v)}
        style={{ display: 'none', flexDirection: 'column', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
        aria-label="Menu"
      >
        <span style={{ display: 'block', width: '22px', height: '2px', background: 'var(--text)', transition: 'transform 0.2s', transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
        <span style={{ display: 'block', width: '22px', height: '2px', background: 'var(--text)', opacity: open ? 0 : 1, transition: 'opacity 0.2s' }} />
        <span style={{ display: 'block', width: '22px', height: '2px', background: 'var(--text)', transition: 'transform 0.2s', transform: open ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
      </button>
    </nav>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

function HeroCTAs({ block, idx, editable }: { block: HeroBlock; idx: number; editable: boolean }) {
  const E = makeE(`sections.${idx}`, editable)
  if (!block.ctaLabel && !block.secondaryCtaLabel) return null
  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {block.ctaLabel && (
        <a href={block.ctaHref || '#'} style={{ background: 'var(--primary)', color: '#fff', padding: '0.85rem 2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', display: 'inline-block' }}>
          <E field="ctaLabel">{block.ctaLabel}</E>
        </a>
      )}
      {block.secondaryCtaLabel && (
        <a href={block.secondaryCtaHref || '#'} style={{ background: 'var(--muted)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.85rem 2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', display: 'inline-block' }}>
          <E field="secondaryCtaLabel">{block.secondaryCtaLabel}</E>
        </a>
      )}
    </div>
  )
}

function Hero({ block, meta, editable, siteId, idx }: { block: HeroBlock; meta: SiteMeta; editable: boolean; siteId?: string; idx: number }) {
  const E = makeE(`sections.${idx}`, editable)
  const variant = block.variant || 'centered'

  const Badge = block.badge ? (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
      background: `${meta.primaryColor}22`, color: 'var(--primary)',
      border: `1px solid ${meta.primaryColor}44`,
      padding: '0.35rem 1rem', borderRadius: '999px',
      fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem', letterSpacing: '0.05em',
    }}>
      ✦ <E field="badge">{block.badge}</E>
    </div>
  ) : null

  // ── Minimal variant — pure typography, no background ─────────────────────────
  if (variant === 'minimal') {
    return (
      <section id={block.id} style={{ padding: '7rem 2rem 5rem', maxWidth: '900px', margin: '0 auto' }}>
        {Badge}
        <h1 style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
          <E field="title">{block.title}</E>
        </h1>
        {block.subtitle && (
          <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', opacity: 0.6, maxWidth: '640px', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            <E field="subtitle" multiline>{block.subtitle}</E>
          </p>
        )}
        <HeroCTAs block={block} idx={idx} editable={editable} />
      </section>
    )
  }

  // ── Split variant — text left, image right ────────────────────────────────────
  if (variant === 'split') {
    return (
      <section id={block.id} style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem',
        alignItems: 'center', padding: '5rem 4rem', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh',
      }}
        className="sr-hero-split"
      >
        <style>{`.sr-hero-split { } @media(max-width:768px){.sr-hero-split{grid-template-columns:1fr!important;padding:4rem 2rem!important}}`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {Badge}
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            <E field="title">{block.title}</E>
          </h1>
          {block.subtitle && (
            <p style={{ fontSize: '1.1rem', opacity: 0.65, lineHeight: 1.7, marginBottom: '2.5rem' }}>
              <E field="subtitle" multiline>{block.subtitle}</E>
            </p>
          )}
          <HeroCTAs block={block} idx={idx} editable={editable} />
        </div>
        <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', aspectRatio: '4/3', background: `${meta.primaryColor}18` }}>
          {block.image ? (
            <ImageWrapper path={`sections.${idx}.image`} siteId={siteId} editable={editable} wrapStyle={{ height: '100%' }}>
              <img src={block.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </ImageWrapper>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', opacity: 0.3 }}>
              ✦
            </div>
          )}
        </div>
      </section>
    )
  }

  // ── Centered variant (default) — full-width with optional bg image ────────────
  return (
    <section id={block.id} style={{
      minHeight: '90vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '5rem 2rem', position: 'relative', overflow: 'hidden',
      background: block.image ? 'transparent'
        : `radial-gradient(ellipse 80% 50% at 50% 0%, ${meta.primaryColor}22, transparent 60%)`,
    }}>
      {block.image && (
        <ImageWrapper
          path={`sections.${idx}.image`}
          siteId={siteId}
          editable={editable}
          wrapStyle={{ position: 'absolute', inset: 0, zIndex: 1 }}
          btnStyle={{ top: '10px', right: '10px', bottom: 'auto' }}
        >
          <img src={block.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${meta.primaryColor}44, ${meta.bgColor || '#0f0f13'}cc)` }} />
        </ImageWrapper>
      )}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {Badge}
        <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem', maxWidth: '800px' }}>
          <E field="title">{block.title}</E>
        </h1>
        {block.subtitle && (
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', opacity: 0.65, maxWidth: '560px', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            <E field="subtitle" multiline>{block.subtitle}</E>
          </p>
        )}
        <div style={{ justifyContent: 'center' }}>
          <HeroCTAs block={block} idx={idx} editable={editable} />
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features({ block, meta, editable, idx }: { block: FeaturesBlock; meta: SiteMeta; editable: boolean; idx: number }) {
  const cols = block.columns || 3
  const variant = (block as any).variant || 'cards'

  // ── List variant — icon + text in rows ───────────────────────────────────────
  if (variant === 'list') {
    return (
      <section id={block.id} style={{ padding: '5rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <SectionHeader title={block.title} subtitle={block.subtitle} titlePath={`sections.${idx}.title`} subtitlePath={`sections.${idx}.subtitle`} editable={editable} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '3rem' }}>
          {block.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '1.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              {item.icon && (
                <div style={{ fontSize: '1.5rem', width: '48px', height: '48px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${meta.primaryColor}18`, borderRadius: '12px' }}>
                  {item.icon}
                </div>
              )}
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.35rem', fontSize: '1.05rem' }}>
                  <EditableText value={item.title} path={`sections.${idx}.items.${i}.title`} editable={editable} />
                </h3>
                <p style={{ opacity: 0.65, lineHeight: 1.6, fontSize: '0.92rem', margin: 0 }}>
                  <EditableText value={item.desc} path={`sections.${idx}.items.${i}.desc`} editable={editable} multiline />
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // ── Cards variant (default) ──────────────────────────────────────────────────
  return (
    <section id={block.id} style={{ padding: '5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <SectionHeader title={block.title} subtitle={block.subtitle} titlePath={`sections.${idx}.title`} subtitlePath={`sections.${idx}.subtitle`} editable={editable} />
      <div className={`sr-features-grid sr-cols-${cols}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '1.5rem', marginTop: '3rem' }}>
        {block.items.map((item, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem', transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            {item.icon && (
              <div style={{ fontSize: '2rem', marginBottom: '1rem', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${meta.primaryColor}18`, borderRadius: '12px' }}>
                {item.icon}
              </div>
            )}
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.05rem' }}>
              <EditableText value={item.title} path={`sections.${idx}.items.${i}.title`} editable={editable} />
            </h3>
            <p style={{ opacity: 0.65, lineHeight: 1.6, fontSize: '0.92rem' }}>
              <EditableText value={item.desc} path={`sections.${idx}.items.${i}.desc`} editable={editable} multiline />
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials({ block, meta, editable, idx }: { block: TestimonialsBlock; meta: SiteMeta; editable: boolean; idx: number }) {
  return (
    <section id={block.id} style={{ padding: '5rem 2rem', background: 'var(--muted)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {block.title && <SectionHeader title={block.title} titlePath={`sections.${idx}.title`} editable={editable} />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
          {block.items.map((item, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem' }}>
              {item.rating !== undefined && (
                <div style={{ color: '#f59e0b', marginBottom: '0.75rem' }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>
              )}
              <p style={{ lineHeight: 1.7, opacity: 0.8, marginBottom: '1.25rem', fontStyle: 'italic' }}>
                "<EditableText value={item.text} path={`sections.${idx}.items.${i}.text`} editable={editable} multiline />"
              </p>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                <EditableText value={item.name} path={`sections.${idx}.items.${i}.name`} editable={editable} />
              </div>
              {item.role && (
                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                  <EditableText value={item.role} path={`sections.${idx}.items.${i}.role`} editable={editable} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing({ block, meta, editable, idx }: { block: PricingBlock; meta: SiteMeta; editable: boolean; idx: number }) {
  return (
    <section id={block.id} style={{ padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {(block.title || block.subtitle) && (
          <SectionHeader title={block.title || ''} subtitle={block.subtitle} titlePath={`sections.${idx}.title`} subtitlePath={`sections.${idx}.subtitle`} editable={editable} />
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', marginTop: '3rem', alignItems: 'start' }}>
          {block.plans.map((plan, i) => (
            <div key={i} style={{
              background: plan.highlighted ? 'var(--primary)' : 'var(--card)',
              border: plan.highlighted ? 'none' : '1px solid var(--border)',
              borderRadius: '20px', padding: '2rem',
              color: plan.highlighted ? '#fff' : 'var(--text)',
              boxShadow: plan.highlighted ? `0 20px 60px ${meta.primaryColor}40` : 'none',
            }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                <EditableText value={plan.name} path={`sections.${idx}.plans.${i}.name`} editable={editable} />
              </div>
              {plan.desc && (
                <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  <EditableText value={plan.desc} path={`sections.${idx}.plans.${i}.desc`} editable={editable} multiline />
                </p>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                  <EditableText value={plan.price} path={`sections.${idx}.plans.${i}.price`} editable={editable} />
                </span>
                {plan.period && (
                  <span style={{ opacity: 0.6, fontSize: '0.9rem', marginLeft: '0.25rem' }}>
                    /<EditableText value={plan.period} path={`sections.${idx}.plans.${i}.period`} editable={editable} />
                  </span>
                )}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', opacity: 0.85 }}>
                    <span style={{ color: plan.highlighted ? '#fff' : meta.primaryColor, fontWeight: 700 }}>✓</span>
                    <EditableText value={f} path={`sections.${idx}.plans.${i}.features.${j}`} editable={editable} />
                  </li>
                ))}
              </ul>
              <a href="#" style={{
                display: 'block', textAlign: 'center',
                background: plan.highlighted ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
                color: '#fff', padding: '0.75rem', borderRadius: '10px',
                textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
              }}>
                <EditableText value={plan.ctaLabel || 'Commencer'} path={`sections.${idx}.plans.${i}.ctaLabel`} editable={editable} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function Contact({ block, meta, editable, idx, siteId }: { block: ContactBlock; meta: SiteMeta; editable: boolean; idx: number; siteId?: string }) {
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!siteId) return
    const fd = new FormData(e.currentTarget)
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, name: fd.get('name'), email: fd.get('email'), message: fd.get('message') }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch { setStatus('error') }
  }

  return (
    <section id={block.id} style={{ padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {(block.title || block.subtitle) && (
          <SectionHeader title={block.title || ''} subtitle={block.subtitle} titlePath={`sections.${idx}.title`} subtitlePath={`sections.${idx}.subtitle`} editable={editable} />
        )}
        <div style={{ marginTop: '3rem', display: 'grid', gap: '1rem' }}>
          {[
            block.email   && { icon: '✉', text: block.email,   path: `sections.${idx}.email` },
            block.phone   && { icon: '☎', text: block.phone,   path: `sections.${idx}.phone` },
            block.address && { icon: '📍', text: block.address, path: `sections.${idx}.address` },
          ].filter(Boolean).map((item: any, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <EditableText value={item.text} path={item.path} editable={editable} />
            </div>
          ))}
        </div>
        {block.showForm && (
          status === 'sent' ? (
            <div style={{ marginTop: '2rem', padding: '2rem', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
              <p style={{ fontWeight: 600 }}>Message envoyé !</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(['name', 'email'] as const).map(n => (
                <input key={n} name={n} type={n === 'email' ? 'email' : 'text'} required
                  placeholder={n === 'name' ? 'Nom' : 'Email'}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem 1rem', color: 'var(--text)', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }} />
              ))}
              <textarea name="message" required rows={4} placeholder="Message"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem 1rem', color: 'var(--text)', fontSize: '0.95rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
              {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>Erreur lors de l'envoi.</p>}
              <button type="submit" disabled={status === 'sending'} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '10px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                {status === 'sending' ? 'Envoi…' : 'Envoyer'}
              </button>
            </form>
          )
        )}
      </div>
    </section>
  )
}

// ─── Team ─────────────────────────────────────────────────────────────────────

// Reject corrupted emoji values (UUID fragments, URLs, etc.)
function safeEmoji(s?: string): string | null {
  if (!s) return null
  if (s.length > 8) return null                      // too long to be an emoji
  if (/^[a-zA-Z0-9\-_]+$/.test(s)) return null      // pure ASCII = not an emoji
  return s
}

function Team({ block, meta, editable, siteId, idx }: { block: TeamBlock; meta: SiteMeta; editable: boolean; siteId?: string; idx: number }) {
  return (
    <section id={block.id} style={{ padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {block.title && <SectionHeader title={block.title} titlePath={`sections.${idx}.title`} editable={editable} />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
          {block.members.map((m, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center' }}>
              <ImageWrapper
                path={`sections.${idx}.members.${i}.image`}
                siteId={siteId}
                editable={editable}
                fullOverlay
                wrapStyle={{ width: '72px', height: '72px', borderRadius: '50%', background: m.color || `${meta.primaryColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem', overflow: 'hidden', flexShrink: 0 }}
              >
                {m.image && m.image.startsWith('http')
                  ? <img src={m.image} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (safeEmoji(m.emoji) || '👤')
                }
              </ImageWrapper>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                <EditableText value={m.name} path={`sections.${idx}.members.${i}.name`} editable={editable} />
              </div>
              <div style={{ opacity: 0.55, fontSize: '0.82rem', marginBottom: m.bio ? '0.75rem' : 0 }}>
                <EditableText value={m.role} path={`sections.${idx}.members.${i}.role`} editable={editable} />
              </div>
              {m.bio && (
                <p style={{ opacity: 0.65, fontSize: '0.82rem', lineHeight: 1.5 }}>
                  <EditableText value={m.bio} path={`sections.${idx}.members.${i}.bio`} editable={editable} multiline />
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ({ block, editable, idx }: { block: FAQBlock; editable: boolean; idx: number }) {
  return (
    <section id={block.id} style={{ padding: '5rem 2rem', background: 'var(--muted)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {block.title && <SectionHeader title={block.title} titlePath={`sections.${idx}.title`} editable={editable} />}
        <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {block.items.map((item, i) => (
            <details key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
              <summary style={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', userSelect: 'none' }}>
                <EditableText value={item.q} path={`sections.${idx}.items.${i}.q`} editable={editable} />
              </summary>
              <p style={{ marginTop: '0.75rem', opacity: 0.7, lineHeight: 1.7, fontSize: '0.9rem' }}>
                <EditableText value={item.a} path={`sections.${idx}.items.${i}.a`} editable={editable} multiline />
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function Stats({ block, meta, editable, idx }: { block: StatsBlock; meta: SiteMeta; editable: boolean; idx: number }) {
  return (
    <section id={block.id} style={{ padding: '4rem 2rem', background: `linear-gradient(135deg, ${meta.primaryColor}18, ${meta.accentColor || meta.primaryColor}10)`, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {block.title && <SectionHeader title={block.title} titlePath={`sections.${idx}.title`} editable={editable} />}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3rem', marginTop: block.title ? '2.5rem' : 0 }}>
          {block.items.map((item, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.03em' }}>
                <EditableText value={item.value} path={`sections.${idx}.items.${i}.value`} editable={editable} />
              </div>
              <div style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                <EditableText value={item.label} path={`sections.${idx}.items.${i}.label`} editable={editable} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA({ block, meta, editable, idx }: { block: CTABlock; meta: SiteMeta; editable: boolean; idx: number }) {
  const E = makeE(`sections.${idx}`, editable)
  return (
    <section id={block.id} style={{ padding: '6rem 2rem', textAlign: 'center', background: `radial-gradient(ellipse 60% 80% at 50% 50%, ${meta.primaryColor}28, transparent)` }}>
      <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
        <E field="title">{block.title}</E>
      </h2>
      {block.subtitle && (
        <p style={{ opacity: 0.65, maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          <E field="subtitle" multiline>{block.subtitle}</E>
        </p>
      )}
      <a href={block.ctaHref || '#'} style={{ display: 'inline-block', background: 'var(--primary)', color: '#fff', padding: '1rem 2.5rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '1.05rem', boxShadow: `0 12px 40px ${meta.primaryColor}44` }}>
        <E field="ctaLabel">{block.ctaLabel}</E>
      </a>
    </section>
  )
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

function Gallery({ block, editable, siteId, idx }: { block: GalleryBlock; editable: boolean; siteId?: string; idx: number }) {
  return (
    <section id={block.id} style={{ padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {block.title && <SectionHeader title={block.title} titlePath={`sections.${idx}.title`} editable={editable} />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '3rem' }}>
          {block.items.map((item, i) => (
            <div key={i} style={{ aspectRatio: '4/3', borderRadius: '12px', background: item.color, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
              <ImageWrapper
                path={`sections.${idx}.items.${i}.image`}
                siteId={siteId}
                editable={editable}
                fullOverlay={!item.image}
                wrapStyle={item.image ? { position: 'absolute', inset: 0 } : { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {item.image
                  ? <img src={item.image} alt={item.label || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  : item.emoji ? <span style={{ fontSize: '2.5rem' }}>{item.emoji}</span> : <span style={{ opacity: 0.3, fontSize: '2rem' }}>🖼️</span>
                }
              </ImageWrapper>
              {item.label && (
                <span style={{ position: 'relative', zIndex: 1, fontSize: '0.85rem', fontWeight: 600, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                  <EditableText value={item.label} path={`sections.${idx}.items.${i}.label`} editable={editable} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

function Content({ block, editable, idx }: { block: ContentBlock; editable: boolean; idx: number }) {
  return (
    <section id={block.id} style={{ padding: '5rem 2rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: block.align || 'left' }}>
        {block.title && (
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            <EditableText value={block.title} path={`sections.${idx}.title`} editable={editable} />
          </h2>
        )}
        <div style={{ opacity: 0.8, lineHeight: 1.8, fontSize: '1rem' }}>
          <EditableText value={block.text} path={`sections.${idx}.text`} editable={editable} multiline />
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ footer, meta, editable }: { footer: SiteFooter; meta: SiteMeta; editable: boolean }) {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem', textAlign: 'center', opacity: 0.6, fontSize: '0.85rem' }}>
      {footer.links && footer.links.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {footer.links.map((l, i) => (
            <a key={i} href={l.href} style={{ color: 'var(--text)', textDecoration: 'none', opacity: 0.75 }}>
              <EditableText value={l.label} path={`footer.links.${i}.label`} editable={editable} />
            </a>
          ))}
        </div>
      )}
      {footer.socials && footer.socials.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          {footer.socials.map((s, i) => (
            <a key={i} href={s.href} style={{ color: 'var(--text)', textDecoration: 'none', opacity: 0.75 }}>
              <EditableText value={s.platform} path={`footer.socials.${i}.platform`} editable={editable} />
            </a>
          ))}
        </div>
      )}
      <p style={{ margin: 0 }}>
        <EditableText value={footer.text} path="footer.text" editable={editable} />
      </p>
    </footer>
  )
}

// ─── Shared section header ─────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, titlePath, subtitlePath, editable }: {
  title: string; subtitle?: string
  titlePath: string; subtitlePath?: string
  editable: boolean
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: subtitle ? '0.75rem' : 0 }}>
        <EditableText value={title} path={titlePath} editable={editable} />
      </h2>
      {subtitle && subtitlePath && (
        <p style={{ opacity: 0.6, maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
          <EditableText value={subtitle} path={subtitlePath} editable={editable} multiline />
        </p>
      )}
    </div>
  )
}

// ─── Block dispatcher ─────────────────────────────────────────────────────────

function Block({ block, meta, siteId, editable, idx }: { block: SiteBlock; meta: SiteMeta; siteId?: string; editable: boolean; idx: number }) {
  switch (block.type) {
    case 'hero':         return <Hero         block={block} meta={meta} editable={editable} siteId={siteId} idx={idx} />
    case 'features':     return <Features     block={block} meta={meta} editable={editable} idx={idx} />
    case 'testimonials': return <Testimonials block={block} meta={meta} editable={editable} idx={idx} />
    case 'pricing':      return <Pricing      block={block} meta={meta} editable={editable} idx={idx} />
    case 'contact':      return <Contact      block={block} meta={meta} editable={editable} idx={idx} siteId={siteId} />
    case 'team':         return <Team         block={block} meta={meta} editable={editable} siteId={siteId} idx={idx} />
    case 'faq':          return <FAQ          block={block} editable={editable} idx={idx} />
    case 'stats':        return <Stats        block={block} meta={meta} editable={editable} idx={idx} />
    case 'cta':          return <CTA          block={block} meta={meta} editable={editable} idx={idx} />
    case 'gallery':      return <Gallery      block={block} editable={editable} siteId={siteId} idx={idx} />
    case 'content':      return <Content      block={block} editable={editable} idx={idx} />
    default:             return null
  }
}

// ─── Root renderer ─────────────────────────────────────────────────────────────

const MOBILE_CSS = `
  @media (max-width: 640px) {
    .sr-nav-links { display: none !important; }
    .sr-nav-links.sr-open {
      display: flex !important;
      flex-direction: column;
      align-items: flex-start;
      position: fixed;
      top: 64px; left: 0; right: 0;
      background: var(--bg, #0f0f13);
      padding: 1.5rem 2rem 2rem;
      border-bottom: 1px solid var(--border);
      z-index: 99;
      gap: 1.25rem !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .sr-hamburger { display: flex !important; }
    .sr-cols-2, .sr-cols-3, .sr-cols-4 { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 900px) {
    .sr-cols-3 { grid-template-columns: repeat(2, 1fr) !important; }
    .sr-cols-4 { grid-template-columns: repeat(2, 1fr) !important; }
  }
`

export default function SiteRenderer({ schema, siteId, editable = false }: { schema: SiteSchema; siteId?: string; editable?: boolean }) {
  const { meta, nav, sections, footer } = schema

  return (
    <div style={{ ...themeVars(meta), fontFamily: fontFamily(meta), background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: MOBILE_CSS }} />
      {nav && <Nav nav={nav} meta={meta} editable={editable} />}
      {sections.map((block, i) => (
        <Block key={block.id || i} block={block} meta={meta} siteId={siteId} editable={editable} idx={i} />
      ))}
      {footer && <Footer footer={footer} meta={meta} editable={editable} />}
      <EditHint editable={editable} />
    </div>
  )
}
