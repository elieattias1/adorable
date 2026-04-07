'use client'

const ALL_CARDS = [
  { label: 'Le Bistrot', tag: 'Restaurant', accent: '#f97316',
    bars: [['#1a0800','Le Bistrot Paris ✦ Réserver'],['#7c1d0c','Menu · Galerie · Contact'],['#1a0800','🍷 Entrées · Plats · Desserts'],['#0d0400','★★★★★ 312 avis']] },
  { label: 'Alex.dev', tag: 'Portfolio', accent: '#8b5cf6',
    bars: [['#0f0a1a','Alex Dupont'],['#1e1035','Designer & Dev ✦ Voir mes projets'],['#0f0a1a','⬛ ⬛ ⬛ ⬛ Galerie'],['#141020','Contactez-moi →']] },
  { label: 'ShopGreen', tag: 'E-commerce', accent: '#10b981',
    bars: [['#0a1a12','ShopGreen 🛒 Panier'],['#0d2b1a','🟩 🟩 🟩 🟩 Nouveautés'],['#071410','€29 · €49 · €79 · €129'],['#0a1a12','Livraison gratuite dès 50€']] },
  { label: 'AppFlow', tag: 'SaaS', accent: '#3b82f6',
    bars: [['#030b1a','AppFlow — Start Free'],['#05122e','Ship 10x faster ⚡'],['#030b1a','Features · Pricing · Docs'],['#040e24','2 400+ équipes font confiance']] },
  { label: 'The Journal', tag: 'Blog', accent: '#f43f5e',
    bars: [['#fafafa','THE JOURNAL',true],['#ffffff','📝 Comment l\'IA change tout',true],['#f9f9f9','📝 Top 10 outils 2025',true],['#ffffff','📝 Guide du freelance',true]] },
  { label: 'ConseilPro', tag: 'Cabinet', accent: '#6366f1',
    bars: [['#050a1f','ConseilPro — Services'],['#0a1240','Votre partenaire stratégique'],['#050a1f','Strategy · Finance · Legal'],['#030818','Prendre rendez-vous →']] },
  { label: 'DrSmile', tag: 'Médecin', accent: '#06b6d4',
    bars: [['#041418','Dr. Smile — Dentiste'],['#072030','Prenez rendez-vous en ligne'],['#041418','Lundi–Vendredi 9h–19h'],['#030e18','Doctolib · Parking gratuit']] },
  { label: 'FitLife', tag: 'Coach sportif', accent: '#f59e0b',
    bars: [['#1a1000','FitLife Coaching'],['#2d1f00','Transformez votre corps 💪'],['#1a1000','Programmes · Suivi · Nutrition'],['#120c00','Essai gratuit 7 jours']] },
  { label: 'Maison Clara', tag: 'Immobilier', accent: '#14b8a6',
    bars: [['#031412','Maison Clara Immobilier'],['#052420','Trouvez votre bien idéal 🏠'],['#031412','Vente · Location · Estimation'],['#020e0c','+ de 200 biens disponibles']] },
  { label: 'Legalix', tag: 'Avocat', accent: '#64748b',
    bars: [['#0a0a0f','Legalix — Cabinet d\'avocats'],['#12121f','Défendons vos droits ensemble'],['#0a0a0f','Droit · Famille · Business'],['#080810','Consultation offerte']] },
  { label: 'BakeryCo', tag: 'Boulangerie', accent: '#d97706',
    bars: [['#1a0f00','🥐 Boulangerie Artisanale'],['#2d1800','Pains · Viennoiseries · Gâteaux'],['#1a0f00','Ouvert 7j/7 dès 7h'],['#120b00','Commande Click & Collect']] },
  { label: 'NomadePhoto', tag: 'Photographe', accent: '#ec4899',
    bars: [['#1a0010','NomadePhoto Studio'],['#2d0020','Mariages · Portraits · Events'],['#1a0010','📸 📸 📸 📸 Portfolio'],['#110008','Devis gratuit en 24h']] },
  { label: 'GreenArchi', tag: 'Architecture', accent: '#84cc16',
    bars: [['#0a1400','GreenArchi Studio'],['#142400','Design durable & innovant 🌿'],['#0a1400','Projets · Équipe · Contact'],['#071000','Prix Green Building 2024']] },
  { label: 'YogaFlow', tag: 'Bien-être', accent: '#a78bfa',
    bars: [['#0f0a1f','YogaFlow Studio'],['#1a1235','Trouvez votre équilibre ✨'],['#0f0a1f','Cours · Retraites · Online'],['#0a0818','Premier cours offert']] },
  { label: 'AutoMax', tag: 'Garage', accent: '#f97316',
    bars: [['#1a0800','AutoMax Garage'],['#2d1400','Votre voiture entre de bonnes mains 🔧'],['#1a0800','Révision · Carrosserie · Pneus'],['#100600','Devis immédiat en ligne']] },
  { label: 'MindSpace', tag: 'Psy', accent: '#06b6d4',
    bars: [['#030f1a','MindSpace Thérapie'],['#051828','Un espace pour vous reconstruire'],['#030f1a','Individuel · Couple · Groupe'],['#020c18','Séance de découverte offerte']] },
  { label: 'PixelAgency', tag: 'Agence web', accent: '#8b5cf6',
    bars: [['#0c0820','PixelAgency'],['#16103a','We build digital experiences 🚀'],['#0c0820','Web · Brand · Growth'],['#09061a','Voir nos réalisations']] },
  { label: 'La Crêperie', tag: 'Restaurant', accent: '#f59e0b',
    bars: [['#1a1000','La Crêperie Bretonne'],['#2d1a00','Galettes · Crêpes · Cidre 🍺'],['#1a1000','Sur place · À emporter'],['#100c00','Réservez votre table']] },
  { label: 'CleanHome', tag: 'Services', accent: '#10b981',
    bars: [['#041412','CleanHome Services'],['#072420','Votre maison, impeccable ✨'],['#041412','Ménage · Vitres · Jardinage'],['#030e0c','Devis gratuit en 2 min']] },
  { label: 'FinTrack', tag: 'FinTech', accent: '#3b82f6',
    bars: [['#020810','FinTrack — Vos finances'],['#040f20','Suivez chaque euro 📊'],['#020810','Dashboard · Alertes · Reports'],['#020710','Essai gratuit 30 jours']] },
  { label: 'TechRepair', tag: 'Réparation', accent: '#64748b',
    bars: [['#0a0c10','TechRepair Pro'],['#121520','Réparation express 🔋'],['#0a0c10','iPhone · Mac · Android'],['#080a10','Devis en 5 minutes']] },
  { label: 'EcoBox', tag: 'Livraison bio', accent: '#84cc16',
    bars: [['#0a1200','EcoBox — Panier bio'],['#121f00','Producteurs locaux 🥦🥕'],['#0a1200','Hebdo · Bi-mensuel · Libre'],['#070d00','1ère box -50%']] },
  { label: 'LuxSpa', tag: 'Spa', accent: '#d4b896',
    bars: [['#12100a','LuxSpa & Bien-être'],['#1f1c12','Massages · Soins · Hammam'],['#12100a','Offrez un moment d\'exception'],['#0e0c08','Réservation en ligne']] },
]

const ROW_A = ALL_CARDS.slice(0, 8)
const ROW_B = ALL_CARDS.slice(8, 16)
const ROW_C = ALL_CARDS.slice(16)

function MarqueeRow({ cards, reverse = false }: { cards: typeof ALL_CARDS; reverse?: boolean }) {
  const doubled = [...cards, ...cards]
  return (
    <div className="flex overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }}>
      <div
        className="flex gap-3 flex-shrink-0"
        style={{
          animation: `marquee${reverse ? 'R' : ''} ${cards.length * 4}s linear infinite`,
          width: 'max-content',
        }}
      >
        {doubled.map((card, i) => (
          <div key={i} className="w-44 flex-shrink-0 rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition-all" style={{ borderTopColor: card.accent + '44' }}>
            <div className="h-28 flex flex-col overflow-hidden">
              {card.bars.map(([bg, text, light], j) => (
                <div key={j} className="flex items-center justify-center flex-1 px-2"
                  style={{ background: bg as string, color: light ? '#333' : 'rgba(255,255,255,0.5)', fontSize: '5px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {text}
                </div>
              ))}
            </div>
            <div className="px-2.5 py-1.5 border-t flex items-center gap-1.5" style={{ background: '#0d0d12', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: card.accent }} />
              <p className="text-[9px] font-semibold text-gray-300 truncate">{card.label}</p>
              <span className="text-[8px] text-gray-600 ml-auto flex-shrink-0">{card.tag}</span>
            </div>
          </div>
        ))}
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
