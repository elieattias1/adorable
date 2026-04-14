'use client'

type CardType = 'hero' | 'shop' | 'split' | 'list' | 'gallery' | 'features' | 'article' | 'minimal'

interface CardDef {
  label:   string
  tag:     string
  accent:  string
  type:    CardType
  bg:      string        // main bg color
  bg2?:    string        // secondary bg
  content: string[]
}

const ALL_CARDS: CardDef[] = [
  { label: 'Le Bistrot',      tag: 'Restaurant',   accent: '#f97316', type: 'hero',     bg: '#120800', bg2: '#f97316',
    content: ['Le Bistrot Paris', 'Gastronomie française', 'Réserver une table'] },

  { label: 'Alex.dev',        tag: 'Portfolio',    accent: '#8b5cf6', type: 'gallery',  bg: '#0f0a1a',
    content: ['#1e1035', '#2a1a4a', '#16103a', '#1a1240', '#0d091f', '#231550'] },

  { label: 'ShopGreen',       tag: 'E-commerce',   accent: '#10b981', type: 'shop',     bg: '#071410',
    content: ['Sac Tote', '29€', 'Gourde', '24€', 'Carnet', '12€', 'Kit', '49€'] },

  { label: 'AppFlow',         tag: 'SaaS',         accent: '#3b82f6', type: 'features', bg: '#030b1a',
    content: ['⚡', 'Ship faster', '🔒', 'Secure', '📊', 'Analytics'] },

  { label: 'The Journal',     tag: 'Blog',         accent: '#f43f5e', type: 'article',  bg: '#ffffff', bg2: '#f43f5e',
    content: ['Comment l\'IA change tout', 'Technologie · 4 min', '#fee2e2'] },

  { label: 'ConseilPro',      tag: 'Cabinet',      accent: '#6366f1', type: 'split',    bg: '#050a1f', bg2: '#6366f1',
    content: ['ConseilPro', 'Votre partenaire stratégique', 'RDV →'] },

  { label: 'DrSmile',         tag: 'Médecin',      accent: '#06b6d4', type: 'list',     bg: '#041418',
    content: ['Dr. Smile', 'Chirurgie dentaire', 'Blanchiment', 'Orthodontie', 'Implants'] },

  { label: 'FitLife',         tag: 'Coach',        accent: '#f59e0b', type: 'hero',     bg: '#1a1000', bg2: '#f59e0b',
    content: ['FitLife', 'Transformez votre corps', 'Essai 7 jours'] },

  { label: 'Maison Clara',    tag: 'Immobilier',   accent: '#14b8a6', type: 'shop',     bg: '#031412',
    content: ['Studio', '650€/m', 'T3', '4 500€', 'Maison', '320k€', 'Loft', '890k€'] },

  { label: 'Legalix',         tag: 'Avocat',       accent: '#94a3b8', type: 'minimal',  bg: '#f8fafc', bg2: '#1e293b',
    content: ['LEGALIX', 'Cabinet d\'avocats', 'Consultation offerte'] },

  { label: 'BakeryCo',        tag: 'Boulangerie',  accent: '#d97706', type: 'list',     bg: '#1a0f00',
    content: ['🥐 BakeryCo', 'Croissant beurre', 'Pain au chocolat', 'Baguette tradition', 'Tarte aux pommes'] },

  { label: 'NomadePhoto',     tag: 'Photographe',  accent: '#ec4899', type: 'gallery',  bg: '#0d0010',
    content: ['#2d0025', '#1f0018', '#3a0030', '#150010', '#260020', '#1a0015'] },

  { label: 'GreenArchi',      tag: 'Architecture', accent: '#84cc16', type: 'split',    bg: '#0a1400', bg2: '#84cc16',
    content: ['GreenArchi', 'Design durable & innovant', 'Voir projets'] },

  { label: 'YogaFlow',        tag: 'Bien-être',    accent: '#a78bfa', type: 'features', bg: '#0f0a1f',
    content: ['🧘', 'Yoga', '🌿', 'Méditation', '✨', 'Retraites'] },

  { label: 'AutoMax',         tag: 'Garage',       accent: '#f97316', type: 'list',     bg: '#1a0800',
    content: ['AutoMax', 'Révision complète', 'Changement pneus', 'Carrosserie', 'Diagnostic'] },

  { label: 'MindSpace',       tag: 'Psy',          accent: '#06b6d4', type: 'minimal',  bg: '#f0f9ff', bg2: '#0e7490',
    content: ['MINDSPACE', 'Thérapie & bien-être', 'Séance découverte'] },

  { label: 'PixelAgency',     tag: 'Agence',       accent: '#8b5cf6', type: 'gallery',  bg: '#0c0820',
    content: ['#231550', '#1a0f3d', '#2d1a5c', '#160b38', '#1f1245', '#12093a'] },

  { label: 'La Crêperie',     tag: 'Restaurant',   accent: '#f59e0b', type: 'hero',     bg: '#1a1200', bg2: '#b45309',
    content: ['La Crêperie', 'Galettes & crêpes bretonnes', 'Réserver'] },

  { label: 'CleanHome',       tag: 'Services',     accent: '#10b981', type: 'features', bg: '#041412',
    content: ['🏠', 'Ménage', '🪟', 'Vitres', '🌱', 'Jardinage'] },

  { label: 'FinTrack',        tag: 'FinTech',      accent: '#3b82f6', type: 'article',  bg: '#ffffff', bg2: '#3b82f6',
    content: ['Suivez chaque euro en temps réel', 'Finances · 2 min', '#eff6ff'] },

  { label: 'TechRepair',      tag: 'Réparation',   accent: '#64748b', type: 'split',    bg: '#0a0c10', bg2: '#475569',
    content: ['TechRepair', 'Réparation express', 'Devis →'] },

  { label: 'EcoBox',          tag: 'Livraison bio', accent: '#84cc16', type: 'shop',    bg: '#0a1200',
    content: ['Box S', '19€', 'Box M', '34€', 'Box L', '49€', 'Box XL', '69€'] },

  { label: 'LuxSpa',          tag: 'Spa',          accent: '#d4b896', type: 'minimal',  bg: '#1a1710', bg2: '#b8975a',
    content: ['LUX SPA', 'Massages & soins d\'exception', 'Réserver'] },

  { label: 'Vélo & Co',       tag: 'Sport',        accent: '#22d3ee', type: 'features', bg: '#041416',
    content: ['🚴', 'Location', '🔧', 'Réparation', '🗺️', 'Circuits'] },
]

// ── Layout renderers ─────────────────────────────────────────────────────────

function HeroLayout({ card }: { card: CardDef }) {
  return (
    <div className="h-full flex flex-col" style={{ background: card.bg }}>
      {/* nav strip */}
      <div className="flex items-center justify-between px-2 py-1" style={{ background: `${card.bg}cc` }}>
        <div className="w-8 h-1 rounded-full opacity-60" style={{ background: card.accent }} />
        <div className="flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-3 h-0.5 rounded-full opacity-30" style={{ background: card.accent }} />)}
        </div>
      </div>
      {/* hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 text-center gap-1">
        <div className="w-12 h-0.5 rounded-full mb-1" style={{ background: card.accent, opacity: 0.5 }} />
        <div className="text-[6px] font-black uppercase tracking-wide" style={{ color: card.accent }}>{card.content[0]}</div>
        <div className="text-[5px] opacity-50 text-white leading-tight">{card.content[1]}</div>
        <div className="mt-1.5 px-2 py-0.5 rounded-full text-[5px] font-bold" style={{ background: card.accent, color: '#fff' }}>{card.content[2]}</div>
      </div>
      {/* stats bar */}
      <div className="flex gap-1 px-2 pb-1">
        {[0,1,2,3].map(i => <div key={i} className="flex-1 h-1 rounded-full opacity-20" style={{ background: card.accent }} />)}
      </div>
    </div>
  )
}

function ShopLayout({ card }: { card: CardDef }) {
  const items = []
  for (let i = 0; i < 8; i += 2) items.push({ name: card.content[i], price: card.content[i+1] })
  return (
    <div className="h-full flex flex-col" style={{ background: card.bg }}>
      <div className="flex items-center gap-1 px-2 py-1">
        <div className="w-5 h-1 rounded-full" style={{ background: card.accent, opacity: 0.8 }} />
        <div className="ml-auto flex gap-1">
          <div className="w-3 h-3 rounded" style={{ background: `${card.accent}33` }} />
          <div className="w-3 h-3 rounded" style={{ background: `${card.accent}33` }} />
        </div>
      </div>
      <div className="flex-1 grid grid-cols-4 gap-1 px-2 pb-1">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col rounded overflow-hidden" style={{ background: `${card.accent}18` }}>
            <div className="flex-1" style={{ background: `${card.accent}25` }} />
            <div className="px-0.5 pb-0.5">
              <div className="text-[4px] truncate opacity-50 text-white">{item.name}</div>
              <div className="text-[4.5px] font-bold" style={{ color: card.accent }}>{item.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SplitLayout({ card }: { card: CardDef }) {
  return (
    <div className="h-full flex" style={{ background: card.bg }}>
      {/* left */}
      <div className="flex-1 flex flex-col justify-center px-2.5 gap-1.5">
        <div className="w-6 h-0.5 rounded-full" style={{ background: card.accent }} />
        <div className="text-[6px] font-black leading-tight text-white opacity-90">{card.content[0]}</div>
        <div className="text-[4.5px] opacity-40 text-white leading-tight">{card.content[1]}</div>
        <div className="mt-1 px-2 py-0.5 rounded text-[4.5px] font-bold self-start" style={{ background: card.accent, color: '#fff' }}>{card.content[2]}</div>
      </div>
      {/* right gradient panel */}
      <div className="w-14 flex-shrink-0 flex flex-col justify-end p-1.5"
        style={{ background: `linear-gradient(135deg, ${card.accent}55 0%, ${card.accent}22 100%)` }}>
        <div className="w-full h-8 rounded" style={{ background: `${card.accent}30` }} />
        <div className="w-full h-3 rounded mt-1" style={{ background: `${card.accent}20` }} />
      </div>
    </div>
  )
}

function ListLayout({ card }: { card: CardDef }) {
  const [title, ...items] = card.content
  return (
    <div className="h-full flex flex-col" style={{ background: card.bg }}>
      <div className="px-2 pt-1.5 pb-1">
        <div className="text-[5.5px] font-black" style={{ color: card.accent }}>{title}</div>
        <div className="w-8 h-px mt-0.5" style={{ background: `${card.accent}50` }} />
      </div>
      <div className="flex-1 flex flex-col justify-around px-2 pb-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: card.accent }} />
            <div className="text-[4.5px] text-white opacity-50 truncate">{item}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GalleryLayout({ card }: { card: CardDef }) {
  const [c1, c2, c3, c4, c5, c6] = card.content
  return (
    <div className="h-full flex flex-col gap-0.5 p-1" style={{ background: card.bg }}>
      <div className="flex gap-0.5 h-[38%]">
        <div className="flex-1 rounded" style={{ background: c1 }} />
        <div className="flex-1 rounded" style={{ background: c2 }} />
        <div className="flex-[2] rounded" style={{ background: c3 }} />
      </div>
      <div className="flex gap-0.5 flex-1">
        <div className="flex-[2] rounded" style={{ background: c4 }} />
        <div className="flex-1 rounded" style={{ background: c5 }} />
        <div className="flex-1 rounded" style={{ background: c6 }} />
      </div>
    </div>
  )
}

function FeaturesLayout({ card }: { card: CardDef }) {
  const features = []
  for (let i = 0; i < 6; i += 2) features.push({ icon: card.content[i], label: card.content[i+1] })
  return (
    <div className="h-full flex flex-col" style={{ background: card.bg }}>
      <div className="flex items-center gap-1 px-2 pt-1.5 pb-1">
        <div className="w-4 h-0.5 rounded-full" style={{ background: card.accent }} />
        <div className="text-[5px] font-black" style={{ color: card.accent }}>{card.label}</div>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-1 px-2 pb-1.5">
        {features.map((f, i) => (
          <div key={i} className="flex flex-col items-center justify-center rounded gap-0.5"
            style={{ background: `${card.accent}15` }}>
            <span style={{ fontSize: '10px', lineHeight: 1 }}>{f.icon}</span>
            <div className="text-[3.5px] text-center opacity-50 text-white leading-tight">{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ArticleLayout({ card }: { card: CardDef }) {
  const [title, meta, heroBg] = card.content
  const isLight = card.bg === '#ffffff'
  return (
    <div className="h-full flex flex-col" style={{ background: card.bg }}>
      {/* hero image placeholder */}
      <div className="h-10 flex-shrink-0 relative overflow-hidden" style={{ background: heroBg }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${card.accent}60, ${card.accent}20)` }} />
        <div className="absolute bottom-1 left-2">
          <div className="text-[4px] font-bold opacity-70" style={{ color: card.accent }}>{meta}</div>
        </div>
      </div>
      {/* content */}
      <div className="flex-1 flex flex-col justify-center px-2 py-1 gap-0.5">
        <div className={`text-[5.5px] font-black leading-tight ${isLight ? 'text-gray-900' : 'text-white'} opacity-90`}>{title}</div>
        <div className={`text-[4px] leading-tight ${isLight ? 'text-gray-400' : 'text-white opacity-30'} line-clamp-2`}>
          Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor
        </div>
      </div>
      {/* footer */}
      <div className={`flex items-center gap-1 px-2 pb-1`}>
        <div className="w-4 h-px" style={{ background: card.accent, opacity: 0.6 }} />
        <div className="text-[4px] opacity-30" style={{ color: isLight ? '#000' : '#fff' }}>Lire la suite →</div>
      </div>
    </div>
  )
}

function MinimalLayout({ card }: { card: CardDef }) {
  const isLight = card.bg.startsWith('#f') || card.bg.startsWith('#e')
  return (
    <div className="h-full flex flex-col items-center justify-center gap-1.5 px-3 text-center" style={{ background: card.bg }}>
      <div className="w-8 h-px" style={{ background: card.bg2 ?? card.accent, opacity: 0.5 }} />
      <div className="text-[7px] font-black tracking-widest" style={{ color: isLight ? '#111' : '#fff' }}>{card.content[0]}</div>
      <div className="w-full h-px" style={{ background: isLight ? '#e2e8f0' : `${card.accent}30` }} />
      <div className="text-[4.5px] leading-tight opacity-50" style={{ color: isLight ? '#444' : '#fff' }}>{card.content[1]}</div>
      <div className="px-2 py-0.5 rounded text-[4.5px] font-bold mt-0.5" style={{ background: card.bg2 ?? card.accent, color: '#fff' }}>{card.content[2]}</div>
    </div>
  )
}

// ── Card dispatcher ───────────────────────────────────────────────────────────

function SiteCard({ card }: { card: CardDef }) {
  const body = (() => {
    switch (card.type) {
      case 'hero':     return <HeroLayout card={card} />
      case 'shop':     return <ShopLayout card={card} />
      case 'split':    return <SplitLayout card={card} />
      case 'list':     return <ListLayout card={card} />
      case 'gallery':  return <GalleryLayout card={card} />
      case 'features': return <FeaturesLayout card={card} />
      case 'article':  return <ArticleLayout card={card} />
      case 'minimal':  return <MinimalLayout card={card} />
    }
  })()

  return (
    <div className="w-44 flex-shrink-0 rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition-all"
      style={{ borderTopColor: card.accent + '44' }}>
      <div className="h-28 overflow-hidden">
        {body}
      </div>
      <div className="px-2.5 py-1.5 border-t flex items-center gap-1.5"
        style={{ background: '#0d0d12', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: card.accent }} />
        <p className="text-[9px] font-semibold text-gray-300 truncate">{card.label}</p>
        <span className="text-[8px] text-gray-600 ml-auto flex-shrink-0">{card.tag}</span>
      </div>
    </div>
  )
}

// ── Marquee row ───────────────────────────────────────────────────────────────

const ROW_A = ALL_CARDS.slice(0, 8)
const ROW_B = ALL_CARDS.slice(8, 16)
const ROW_C = ALL_CARDS.slice(16)

function MarqueeRow({ cards, reverse = false }: { cards: CardDef[]; reverse?: boolean }) {
  const doubled = [...cards, ...cards]
  return (
    <div className="flex overflow-hidden"
      style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
      <div
        className="flex gap-3 flex-shrink-0"
        style={{
          animation: `marquee${reverse ? 'R' : ''} ${cards.length * 4}s linear infinite`,
          width: 'max-content',
        }}
      >
        {doubled.map((card, i) => <SiteCard key={i} card={card} />)}
      </div>
    </div>
  )
}

export default function MarqueeSection() {
  return (
    <div className="space-y-3 py-2">
      <MarqueeRow cards={ROW_A} />
      <MarqueeRow cards={ROW_B} reverse />
      <MarqueeRow cards={ROW_C} />
    </div>
  )
}
