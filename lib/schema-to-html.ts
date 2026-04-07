import type { SiteSchema, SiteMeta, SiteBlock } from '@/types/site-schema'

/**
 * Converts a SiteSchema JSON to a standalone, deployable HTML page.
 * Used by the deploy route to publish sites.
 */
export function schemaToHtml(schema: SiteSchema): string {
  const { meta, nav, sections, footer } = schema
  const isDark = meta.darkMode !== false

  const fontFamily = meta.fontStyle === 'serif'
    ? '"Georgia", "Times New Roman", serif'
    : meta.fontStyle === 'mono'
    ? '"Fira Code", "Courier New", monospace'
    : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

  const bg      = meta.bgColor    || (isDark ? '#0f0f13' : '#ffffff')
  const text     = meta.textColor  || (isDark ? '#f0f0f5' : '#111111')
  const primary  = meta.primaryColor
  const accent   = meta.accentColor || primary
  const muted    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const border   = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.12)'
  const card     = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: ${primary};
      --accent: ${accent};
      --bg: ${bg};
      --text: ${text};
      --muted: ${muted};
      --border: ${border};
      --card: ${card};
    }
    html { scroll-behavior: smooth; }
    body { font-family: ${fontFamily}; background: var(--bg); color: var(--text); line-height: 1.5; }
    a { color: inherit; }
    img { max-width: 100%; }
    details summary { cursor: pointer; }

    /* Nav */
    .nav { display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 64px; background: rgba(0,0,0,0.3); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
    .nav-logo { font-weight: 800; font-size: 1.2rem; color: var(--primary); text-decoration: none; }
    .nav-links { display: flex; gap: 1.5rem; align-items: center; }
    .nav-links a { text-decoration: none; font-size: 0.9rem; opacity: 0.75; transition: opacity 0.2s; }
    .nav-links a:hover { opacity: 1; }
    .nav-cta { background: var(--primary); color: #fff !important; padding: 0.5rem 1.2rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; opacity: 1 !important; }

    /* Sections */
    .section { padding: 5rem 2rem; }
    .section-inner { max-width: 1100px; margin: 0 auto; }
    .section-narrow { max-width: 720px; margin: 0 auto; }
    .section-header { text-align: center; margin-bottom: 3rem; }
    .section-header h2 { font-size: clamp(1.6rem, 3.5vw, 2.5rem); font-weight: 800; letter-spacing: -0.02em; }
    .section-header p { opacity: 0.6; max-width: 560px; margin: 0.75rem auto 0; line-height: 1.6; }

    /* Hero */
    .hero { min-height: 90vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 5rem 2rem; background: radial-gradient(ellipse 80% 50% at 50% 0%, ${primary}22, transparent 60%); }
    .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: ${primary}22; color: var(--primary); border: 1px solid ${primary}44; padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 1.5rem; letter-spacing: 0.05em; }
    .hero h1 { font-size: clamp(2.2rem, 6vw, 4.5rem); font-weight: 900; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 1.25rem; max-width: 800px; }
    .hero p { font-size: clamp(1rem, 2vw, 1.25rem); opacity: 0.65; max-width: 560px; line-height: 1.6; margin-bottom: 2.5rem; }
    .hero-btns { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
    .btn-primary { background: var(--primary); color: #fff; padding: 0.85rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 1rem; }
    .btn-secondary { background: var(--muted); color: var(--text); border: 1px solid var(--border); padding: 0.85rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 1rem; }

    /* Grid */
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }

    /* Card */
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.75rem; transition: border-color 0.2s; }
    .card:hover { border-color: var(--primary); }
    .card h3 { font-weight: 700; margin-bottom: 0.5rem; font-size: 1.05rem; }
    .card p { opacity: 0.65; line-height: 1.6; font-size: 0.92rem; }

    /* Feature icon */
    .feature-icon { font-size: 2rem; margin-bottom: 1rem; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: ${primary}18; border-radius: 12px; }

    /* Testimonial */
    .testimonial-rating { color: #f59e0b; margin-bottom: 0.75rem; }
    .testimonial-text { line-height: 1.7; opacity: 0.8; margin-bottom: 1.25rem; font-style: italic; }
    .testimonial-name { font-weight: 700; font-size: 0.9rem; }
    .testimonial-role { opacity: 0.5; font-size: 0.8rem; }

    /* Pricing */
    .plan { border-radius: 20px; padding: 2rem; }
    .plan-highlighted { background: var(--primary); color: #fff; box-shadow: 0 20px 60px ${primary}40; }
    .plan-normal { background: var(--card); border: 1px solid var(--border); }
    .plan-name { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .plan-desc { opacity: 0.7; font-size: 0.85rem; margin-bottom: 1.25rem; }
    .plan-price { font-size: 2.5rem; font-weight: 900; }
    .plan-period { opacity: 0.6; font-size: 0.9rem; margin-left: 0.25rem; }
    .plan-features { list-style: none; padding: 0; margin: 0 0 1.75rem; display: flex; flex-direction: column; gap: 0.6rem; }
    .plan-features li { display: flex; align-items: center; gap: 0.6rem; font-size: 0.88rem; opacity: 0.85; }
    .plan-features li::before { content: "✓"; font-weight: 700; color: var(--primary); }
    .plan-highlighted .plan-features li::before { color: #fff; }
    .plan-cta { display: block; text-align: center; background: var(--primary); color: #fff; padding: 0.75rem; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.9rem; }
    .plan-highlighted .plan-cta { background: rgba(255,255,255,0.2); }

    /* Stats */
    .stats-section { padding: 4rem 2rem; background: linear-gradient(135deg, ${primary}18, ${accent}10); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
    .stats-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 3rem; }
    .stat-value { font-size: 3rem; font-weight: 900; color: var(--primary); letter-spacing: -0.03em; }
    .stat-label { opacity: 0.6; font-size: 0.9rem; margin-top: 0.25rem; }

    /* Team */
    .team-avatar { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem; }
    .team-name { font-weight: 700; margin-bottom: 0.25rem; }
    .team-role { opacity: 0.55; font-size: 0.82rem; }
    .team-bio { opacity: 0.65; font-size: 0.82rem; line-height: 1.5; margin-top: 0.75rem; }
    .team-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 2rem 1.5rem; text-align: center; }

    /* FAQ */
    .faq-section { background: var(--muted); }
    .faq-item { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
    .faq-item summary { font-weight: 600; font-size: 0.95rem; user-select: none; }
    .faq-item p { margin-top: 0.75rem; opacity: 0.7; line-height: 1.7; font-size: 0.9rem; }

    /* CTA */
    .cta-section { padding: 6rem 2rem; text-align: center; background: radial-gradient(ellipse 60% 80% at 50% 50%, ${primary}28, transparent); }
    .cta-section h2 { font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 900; margin-bottom: 1rem; letter-spacing: -0.02em; }
    .cta-section p { opacity: 0.65; max-width: 480px; margin: 0 auto 2.5rem; line-height: 1.6; }
    .btn-cta { display: inline-block; background: var(--primary); color: #fff; padding: 1rem 2.5rem; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 1.05rem; box-shadow: 0 12px 40px ${primary}44; }

    /* Contact */
    .contact-item { display: flex; align-items: center; gap: 1rem; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
    .contact-icon { font-size: 1.25rem; }
    .contact-form { margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; }
    .contact-form input, .contact-form textarea { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 0.85rem 1rem; color: var(--text); font-size: 0.95rem; font-family: inherit; outline: none; width: 100%; }
    .contact-form textarea { resize: vertical; }
    .contact-form button { background: var(--primary); color: #fff; border: none; padding: 0.85rem; border-radius: 10px; font-weight: 700; font-size: 1rem; cursor: pointer; font-family: inherit; }

    /* Gallery */
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .gallery-item { aspect-ratio: 4/3; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.5rem; }
    .gallery-emoji { font-size: 2.5rem; }
    .gallery-label { font-size: 0.85rem; font-weight: 600; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }

    /* Content */
    .content-text { opacity: 0.8; line-height: 1.8; font-size: 1rem; }

    /* Footer */
    footer { border-top: 1px solid var(--border); padding: 2rem; text-align: center; opacity: 0.6; font-size: 0.85rem; }
    .footer-links { display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .footer-links a { text-decoration: none; opacity: 0.75; }
    .footer-socials { display: flex; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
    .footer-socials a { text-decoration: none; opacity: 0.75; }

    /* Muted bg sections */
    .bg-muted { background: var(--muted); }

    @media (max-width: 640px) {
      .nav-links { display: none; }
      .grid-3, .grid-4 { grid-template-columns: 1fr; }
      .grid-2 { grid-template-columns: 1fr; }
    }
  `

  function renderNav(): string {
    if (!nav) return ''
    return `<nav class="nav">
      <a href="#" class="nav-logo">${esc(nav.logo)}</a>
      <div class="nav-links">
        ${nav.links.map(l => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}
        ${nav.cta ? `<a href="${esc(nav.cta.href)}" class="nav-cta">${esc(nav.cta.label)}</a>` : ''}
      </div>
    </nav>`
  }

  function renderBlock(block: SiteBlock): string {
    switch (block.type) {
      case 'hero': return `
        <section id="${block.id || 'hero'}" class="hero">
          ${block.badge ? `<div class="hero-badge">✦ ${esc(block.badge)}</div>` : ''}
          <h1>${esc(block.title)}</h1>
          ${block.subtitle ? `<p>${esc(block.subtitle)}</p>` : ''}
          <div class="hero-btns">
            ${block.ctaLabel ? `<a href="${esc(block.ctaHref || '#')}" class="btn-primary">${esc(block.ctaLabel)}</a>` : ''}
            ${block.secondaryCtaLabel ? `<a href="${esc(block.secondaryCtaHref || '#')}" class="btn-secondary">${esc(block.secondaryCtaLabel)}</a>` : ''}
          </div>
        </section>`

      case 'features': {
        const cols = block.columns || 3
        const gridClass = cols === 2 ? 'grid-2' : cols === 4 ? 'grid-4' : 'grid-3'
        return `
        <section id="${block.id || 'features'}" class="section">
          <div class="section-inner">
            <div class="section-header"><h2>${esc(block.title)}</h2>${block.subtitle ? `<p>${esc(block.subtitle)}</p>` : ''}</div>
            <div class="${gridClass}">
              ${block.items.map(item => `
                <div class="card">
                  ${item.icon ? `<div class="feature-icon">${item.icon}</div>` : ''}
                  <h3>${esc(item.title)}</h3>
                  <p>${esc(item.desc)}</p>
                </div>`).join('')}
            </div>
          </div>
        </section>`
      }

      case 'testimonials': return `
        <section id="${block.id || 'testimonials'}" class="section bg-muted">
          <div class="section-inner">
            ${block.title ? `<div class="section-header"><h2>${esc(block.title)}</h2></div>` : ''}
            <div class="grid-3">
              ${block.items.map(item => `
                <div class="card" style="border-radius:16px">
                  ${item.rating !== undefined ? `<div class="testimonial-rating">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</div>` : ''}
                  <p class="testimonial-text">"${esc(item.text)}"</p>
                  <div class="testimonial-name">${esc(item.name)}</div>
                  ${item.role ? `<div class="testimonial-role">${esc(item.role)}</div>` : ''}
                </div>`).join('')}
            </div>
          </div>
        </section>`

      case 'pricing': return `
        <section id="${block.id || 'pricing'}" class="section">
          <div class="section-inner">
            ${block.title ? `<div class="section-header"><h2>${esc(block.title)}</h2>${block.subtitle ? `<p>${esc(block.subtitle)}</p>` : ''}</div>` : ''}
            <div class="grid-3" style="align-items:start">
              ${block.plans.map(plan => `
                <div class="plan ${plan.highlighted ? 'plan-highlighted' : 'plan-normal'}">
                  <div class="plan-name">${esc(plan.name)}</div>
                  ${plan.desc ? `<p class="plan-desc">${esc(plan.desc)}</p>` : ''}
                  <div style="margin-bottom:1.5rem"><span class="plan-price">${esc(plan.price)}</span>${plan.period ? `<span class="plan-period">/${esc(plan.period)}</span>` : ''}</div>
                  <ul class="plan-features">${plan.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
                  <a href="#" class="plan-cta">${esc(plan.ctaLabel || 'Commencer')}</a>
                </div>`).join('')}
            </div>
          </div>
        </section>`

      case 'contact': return `
        <section id="${block.id || 'contact'}" class="section">
          <div class="section-narrow">
            ${block.title ? `<div class="section-header"><h2>${esc(block.title)}</h2>${block.subtitle ? `<p>${esc(block.subtitle)}</p>` : ''}</div>` : ''}
            ${block.email   ? `<div class="contact-item"><span class="contact-icon">✉</span><span>${esc(block.email)}</span></div>` : ''}
            ${block.phone   ? `<div class="contact-item"><span class="contact-icon">☎</span><span>${esc(block.phone)}</span></div>` : ''}
            ${block.address ? `<div class="contact-item"><span class="contact-icon">📍</span><span>${esc(block.address)}</span></div>` : ''}
            ${block.showForm ? `
              <form class="contact-form" onsubmit="return false">
                <input type="text" placeholder="Nom" />
                <input type="email" placeholder="Email" />
                <textarea rows="4" placeholder="Message"></textarea>
                <button type="submit">Envoyer</button>
              </form>` : ''}
          </div>
        </section>`

      case 'team': return `
        <section id="${block.id || 'team'}" class="section">
          <div class="section-inner">
            ${block.title ? `<div class="section-header"><h2>${esc(block.title)}</h2></div>` : ''}
            <div class="grid-4">
              ${block.members.map(m => `
                <div class="team-card">
                  <div class="team-avatar" style="background:${m.color || `${primary}22`};overflow:hidden">${
                    m.image && m.image.startsWith('http')
                      ? `<img src="${esc(m.image)}" alt="${esc(m.name)}" style="width:100%;height:100%;object-fit:cover">`
                      : (m.emoji && m.emoji.length <= 8 ? m.emoji : '👤')
                  }</div>
                  <div class="team-name">${esc(m.name)}</div>
                  <div class="team-role">${esc(m.role)}</div>
                  ${m.bio ? `<p class="team-bio">${esc(m.bio)}</p>` : ''}
                </div>`).join('')}
            </div>
          </div>
        </section>`

      case 'faq': return `
        <section id="${block.id || 'faq'}" class="section faq-section">
          <div class="section-narrow">
            ${block.title ? `<div class="section-header"><h2>${esc(block.title)}</h2></div>` : ''}
            ${block.items.map(item => `
              <details class="faq-item">
                <summary>${esc(item.q)}</summary>
                <p>${esc(item.a)}</p>
              </details>`).join('')}
          </div>
        </section>`

      case 'stats': return `
        <section id="${block.id || 'stats'}" class="stats-section">
          <div class="section-inner">
            ${block.title ? `<div class="section-header"><h2>${esc(block.title)}</h2></div>` : ''}
            <div class="stats-grid">
              ${block.items.map(item => `
                <div style="text-align:center">
                  <div class="stat-value">${esc(item.value)}</div>
                  <div class="stat-label">${esc(item.label)}</div>
                </div>`).join('')}
            </div>
          </div>
        </section>`

      case 'cta': return `
        <section id="${block.id || 'cta'}" class="cta-section">
          <h2>${esc(block.title)}</h2>
          ${block.subtitle ? `<p>${esc(block.subtitle)}</p>` : ''}
          <a href="${esc(block.ctaHref || '#')}" class="btn-cta">${esc(block.ctaLabel)}</a>
        </section>`

      case 'gallery': return `
        <section id="${block.id || 'gallery'}" class="section">
          <div class="section-inner">
            ${block.title ? `<div class="section-header"><h2>${esc(block.title)}</h2></div>` : ''}
            <div class="gallery-grid">
              ${block.items.map(item => `
                <div class="gallery-item" style="background:${item.image && item.image.startsWith('http') ? 'transparent' : item.color};overflow:hidden;position:relative">
                  ${item.image && item.image.startsWith('http')
                    ? `<img src="${esc(item.image)}" alt="${esc(item.label || '')}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">`
                    : (item.emoji ? `<span class="gallery-emoji">${item.emoji}</span>` : '')
                  }
                  ${item.label ? `<span class="gallery-label" style="position:relative;z-index:1">${esc(item.label)}</span>` : ''}
                </div>`).join('')}
            </div>
          </div>
        </section>`

      case 'content': return `
        <section id="${block.id || 'content'}" class="section">
          <div class="section-narrow" style="text-align:${block.align || 'left'}">
            ${block.title ? `<h2 style="font-size:2rem;font-weight:800;margin-bottom:1.5rem">${esc(block.title)}</h2>` : ''}
            <div class="content-text">${block.text.replace(/\n/g, '<br/>')}</div>
          </div>
        </section>`

      default: return ''
    }
  }

  function renderFooter(): string {
    if (!footer) return ''
    return `<footer>
      ${footer.links?.length ? `<div class="footer-links">${footer.links.map(l => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</div>` : ''}
      ${footer.socials?.length ? `<div class="footer-socials">${footer.socials.map(s => `<a href="${esc(s.href)}">${esc(s.platform)}</a>`).join('')}</div>` : ''}
      <p>${esc(footer.text)}</p>
    </footer>`
  }

  return `<!DOCTYPE html>
<html lang="${meta.lang || 'fr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(meta.title)}</title>
  <style>${css}</style>
</head>
<body>
  ${renderNav()}
  ${sections.map(renderBlock).join('\n')}
  ${renderFooter()}
</body>
</html>`
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
