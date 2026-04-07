import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Industry design presets ─────────────────────────────────────────────────
// Each preset gives Claude a concrete visual direction to follow.
// This prevents every site from looking like a generic violet/dark SaaS.

const DESIGN_PRESETS: Record<string, string> = {
  restaurant: `
DESIGN SYSTEM — Restaurant / Gastronomie :
• Mode : Dark warm — fond #0d0900 (brun très sombre, pas noir froid)
• Accent principal : #c9a84c (or chaud) — boutons, titres en vedette, lignes déco
• Accent secondaire : #8B5E3C (brun riche)
• Surfaces : bg-[#1a1208] avec border border-[#c9a84c]/20
• Texte : text-[#f5e6c8] (crème) pour les titres, text-[#a89070] pour le corps
• Typographie : Playfair Display pour TOUS les titres, Inter pour le corps
• Images : hero plein écran (h-screen, object-cover), galerie des plats en grille 2×2 ou 3×3
• Style : Gastronomique, chaleureux, luxueux. Textures sombres, accents dorés, ambiance Michelin.
• Photos Unsplash validées :
  - Hero salle : https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop
  - Plat gastronomique : https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop
  - Intérieur chaleureux : https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop
  - Chef en cuisine : https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=600&fit=crop
  - Table dressée : https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&h=600&fit=crop`,

  bakery: `
DESIGN SYSTEM — Boulangerie / Pâtisserie :
• Mode : Dark warm — fond #120900 (brun nuit, évoque la farine grillée)
• Accent principal : #d4a853 (doré beurre) — CTA, prix, badges
• Accent secondaire : #8B4513 (brun pain)
• Surfaces : cards bg-[#1e1008]/80 border border-[#d4a853]/20 rounded-3xl
• Texte : text-[#f9efd7] (ivoire) titres, text-[#c4a882] corps
• Typographie : Playfair Display italique pour les noms de produits, Inter pour descriptions
• Images : photos de produits en aspect-[4/3], hero avec image panoramique du fournil
• Style : Artisanal, authentique, appétissant. Chaud comme un four, élégant comme une vitrine parisienne.
• Photos Unsplash validées :
  - Hero boulangerie : https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&h=1080&fit=crop
  - Pains artisanaux : https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=600&fit=crop
  - Viennoiseries : https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop
  - Fournil : https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800&h=600&fit=crop`,

  saas: `
DESIGN SYSTEM — SaaS / Tech :
• Mode : Dark cool — fond #060818 (bleu nuit profond)
• Accent principal : #6366f1 (indigo) — dégradé vers #8b5cf6 (violet) sur les CTA
• Accent secondaire : #06b6d4 (cyan) pour les highlights techniques
• Surfaces : bg-white/5 border border-white/10 backdrop-blur-sm
• Texte : text-white titres, text-slate-400 corps
• Typographie : Inter 800 pour les titres hero (pas de Playfair), Inter régulier corps
• Badges : rounded-full bg-indigo-500/20 text-indigo-300 text-xs
• Style : Moderne, épuré, efficace. Grid techniques, métriques en avant, sensation d'ingénierie.
• Photos Unsplash validées :
  - Dashboard/app : https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop
  - Équipe tech : https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop
  - Code/terminal : https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop
  - Bureau moderne : https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop`,

  portfolio: `
DESIGN SYSTEM — Portfolio / Créatif :
• Mode : Dark neutre absolu — fond #080808 (noir pur)
• Accent principal : #ffffff — typographie bold massive (text-7xl+)
• Accent secondaire : #666666 (gris moyen)
• Surfaces : border border-white/10, hover:border-white/40 transition
• Texte : text-white titres en gras extrême, text-gray-400 corps
• Typographie : Playfair Display pour le nom/headline, Inter 900 pour les titres de section
• Grid : projets en grille asymétrique, overlay au hover avec titre + catégorie
• Style : Épuré, fort contraste, chaque pixel compte. Minimalisme radical mais impactant.
• Photos Unsplash validées :
  - Projet design : https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop
  - Workspace créatif : https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop
  - Portrait pro : https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&face
  - Projet web : https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop`,

  shop: `
DESIGN SYSTEM — E-commerce / Boutique :
• Mode : Light — fond #ffffff
• Accent principal : #111827 (noir quasi-pur) — boutons, prix
• Accent secondaire : #dc2626 (rouge) pour les badges "solde" ou "nouveau"
• Surfaces : bg-gray-50 ou bg-white, border border-gray-200, shadow-sm
• Texte : text-gray-900 titres, text-gray-600 descriptions, text-gray-400 métadonnées
• Typographie : Inter 700 titres, Inter 400 corps — police propre et lisible
• Images : produits en aspect-square, fond blanc, galerie en grille 4 colonnes sur desktop
• Style : Commercial, propre, confiance. Priorité aux produits. Inspire Zara ou SSENSE.
• Photos Unsplash validées :
  - Hero mode : https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop
  - Produit lifestyle : https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop
  - Boutique intérieur : https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=600&fit=crop
  - Packaging : https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop`,

  business: `
DESIGN SYSTEM — Business / Corporate :
• Mode : Dark professional — fond #0a0f1e (navy très sombre)
• Accent principal : #3b82f6 (bleu) — vers #2563eb au hover
• Accent secondaire : #10b981 (vert succès) pour les stats positives
• Surfaces : bg-white/5 border border-blue-900/50
• Texte : text-white titres, text-blue-100 corps, text-blue-400 highlights
• Typographie : Inter 800 pour les titres (autorité), Inter régulier corps
• Stats : grands chiffres en text-5xl font-black text-blue-400
• Style : Fiable, solide, professionnel. Sentiment de stabilité et d'expertise.
• Photos Unsplash validées :
  - Hero bureau : https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
  - Équipe pro : https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop
  - Réunion : https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop
  - Handshake : https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop`,

  landing: `
DESIGN SYSTEM — Landing Page / Startup :
• Mode : Dark gradient — fond #0f0f13
• Accent principal : #7c3aed (violet) → #ec4899 (rose) — dégradés partout
• Accent secondaire : #f59e0b (ambre) pour urgence/CTA secondaires
• Surfaces : bg-white/5 border border-white/10 rounded-2xl backdrop-blur
• Texte : text-white titres, text-gray-300 corps
• Hero : titre en gradient text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400
• Bouton CTA : bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500
• Style : Énergique, ambitieux, conversion-first. Chaque section pousse vers le CTA.
• Photos Unsplash validées :
  - Hero tech : https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&h=1080&fit=crop
  - Dashboard : https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop
  - Équipe startup : https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop`,

  wellness: `
DESIGN SYSTEM — Bien-être / Spa / Santé :
• Mode : Light soft — fond #faf8f5 (crème chaud)
• Accent principal : #78716c (pierre) — calme et naturel
• Accent secondaire : #84cc16 (vert sauge clair) ou #d4a574 (terre)
• Surfaces : bg-white border border-stone-200 rounded-3xl shadow-sm
• Texte : text-stone-800 titres, text-stone-600 corps
• Typographie : Playfair Display italique pour les slogans zen, Inter léger pour le corps
• Images : espaces épurés, nature, corps en repos — lumière naturelle, tons chauds
• Style : Apaisant, ancré, naturel. Chaque élément respire. Pas de couleurs criardes.
• Photos Unsplash validées :
  - Hero spa : https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&h=1080&fit=crop
  - Massage/soin : https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop
  - Nature zen : https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop
  - Intérieur minimaliste : https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=600&fit=crop`,

  blog: `
DESIGN SYSTEM — Blog / Édito / Média :
• Mode : Light éditorial — fond #ffffff ou #fafaf9
• Accent principal : #1c1917 (presque noir) — texte dominant
• Accent secondaire : #dc2626 ou #7c3aed pour les tags de catégorie
• Surfaces : bg-white, séparateurs border-t border-stone-200
• Texte : text-stone-900 titres en Playfair Display, text-stone-700 corps en Inter, leading-relaxed
• Typographie : Playfair Display 700 pour les titres d'articles, Inter 400 pour la lecture
• Layout : colonnes éditoriales, large text-column centrée, sidebar pour catégories
• Style : Propre, lisible, focus sur le contenu. Typographie serrée comme un journal de qualité.
• Photos Unsplash validées :
  - Hero édito : https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1920&h=1080&fit=crop
  - Article cover : https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=500&fit=crop
  - Portrait auteur : https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&face`,
}

function getDesignPreset(siteType?: string): string {
  if (!siteType) return DESIGN_PRESETS.landing
  // Try exact match first, then fuzzy
  if (DESIGN_PRESETS[siteType]) return DESIGN_PRESETS[siteType]
  if (siteType.includes('restaurant') || siteType.includes('food') || siteType.includes('cafe')) return DESIGN_PRESETS.restaurant
  if (siteType.includes('bak') || siteType.includes('pastry') || siteType.includes('boulan')) return DESIGN_PRESETS.bakery
  if (siteType.includes('shop') || siteType.includes('store') || siteType.includes('boutique')) return DESIGN_PRESETS.shop
  if (siteType.includes('well') || siteType.includes('spa') || siteType.includes('health')) return DESIGN_PRESETS.wellness
  if (siteType.includes('blog') || siteType.includes('media')) return DESIGN_PRESETS.blog
  if (siteType.includes('portfolio') || siteType.includes('creative')) return DESIGN_PRESETS.portfolio
  if (siteType.includes('saas') || siteType.includes('tech') || siteType.includes('app')) return DESIGN_PRESETS.saas
  return DESIGN_PRESETS.business
}

// ─── Agent tools (code-first) ─────────────────────────────────────────────────

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'write_code',
    description: `Writes or rewrites the complete React page component (App.tsx).
Use this tool for:
- Creating the initial site
- Full redesigns or global theme changes (dark/light, color palette, typography)
- Large structural changes (multiple sections added/removed)
- When the current code is too far from the target

The code runs in a browser iframe with:
- React 18 + TypeScript
- Tailwind CSS CDN (all classes including arbitrary values like bg-[#0d0900])
- lucide-react icons
- Google Fonts pre-loaded: Inter and Playfair Display`,
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: `Complete React TSX. Rules:
1. export default function App() { ... }
2. All sub-components in the same file
3. Only external imports: React/hooks and lucide-react
4. Tailwind classes only for styling (including arbitrary values)
5. Realistic images: use Unsplash URLs like https://images.unsplash.com/photo-[id]?w=1200&q=80
6. Content 100% realistic and specific to this business — never Lorem Ipsum
7. Initial creation: up to 1000 lines. Edits: up to 600 lines. Use data arrays to avoid repetition`,
        },
        note: { type: 'string', description: 'One-sentence summary of what was built/changed.' },
      },
      required: ['code', 'note'],
    },
  },

  {
    name: 'edit_code',
    description: `Makes targeted search/replace edits to the existing code.
Use this for:
- Changing text, titles, prices, descriptions
- Swapping a color class (bg-violet-600 → bg-blue-600)
- Adding or modifying a single section
- Small layout or spacing tweaks

Each edit finds an exact string in the current code and replaces it.`,
    input_schema: {
      type: 'object',
      properties: {
        edits: {
          type: 'array',
          description: 'Ordered list of search/replace operations',
          items: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Exact string to find (must appear exactly once)' },
              replace: { type: 'string', description: 'Replacement string' },
            },
            required: ['search', 'replace'],
          },
        },
        note: { type: 'string', description: 'One-sentence summary of changes.' },
      },
      required: ['edits', 'note'],
    },
  },

  {
    name: 'ask_user',
    description: `Asks the user ONE clarifying question when their request is genuinely ambiguous.
Use ONLY when you truly cannot infer intent.
Examples of when to ask:
- "change the colors" with no indication of desired palette
- "add a section" without specifying what kind

Do NOT ask if you can make a reasonable creative decision.
Always offer 2–3 concrete options to make it easy to answer.`,
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to ask the user' },
        options:  { type: 'array', items: { type: 'string' }, description: '2-3 concrete answer options' },
      },
      required: ['question'],
    },
  },
]

// ─── System prompt ────────────────────────────────────────────────────────────

export function buildAgentSystemPrompt(currentCode: string, siteType?: string, siteId?: string): string {
  const designPreset = getDesignPreset(siteType)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adorable.click'
  const formEndpoint = siteId ? `${appUrl}/api/forms/${siteId}` : null

  const isInitialGeneration = !currentCode

  return `Tu es Adorable, un agent expert en création de sites web React/Tailwind de niveau professionnel.
Tu travailles en conversation avec l'utilisateur pour construire ou modifier son site.
${designPreset}

ENVIRONNEMENT D'EXÉCUTION :
- React 18 + TypeScript, Tailwind CSS CDN
- Icônes lucide-react disponibles :
  import { ArrowRight, ArrowLeft, ArrowDown, Star, StarHalf, Check, ChevronDown, ChevronRight, Menu, X,
           Zap, Shield, Globe, Mail, Phone, MapPin, Clock, Calendar, Users, TrendingUp,
           Heart, Leaf, Coffee, Utensils, ShoppingBag, Camera, Briefcase, Award,
           Instagram, Twitter, Facebook, Linkedin, Youtube } from 'lucide-react'
- Google Fonts préchargées : Inter (300–900) et Playfair Display (400–900)
- Images Unsplash : utilise des URLs directes comme https://images.unsplash.com/photo-[id]?w=1200&q=80
  → Hero plein écran : w=1920&h=1080&fit=crop
  → Cartes produits : w=800&h=600&fit=crop
  → Avatars : w=200&h=200&fit=crop&face
${isInitialGeneration ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FLUX INITIAL — SITE VIERGE (aucun code existant)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tu reçois un premier message décrivant le site à créer.

ÉTAPE 1 — ÉVALUE le contexte :
→ Si le message contient un nom de business + une description métier (même courte) : va à l'ÉTAPE 2.
→ Si le message est trop vague (pas de nom de business, pas de contexte métier) : utilise ask_user avec UNE question ciblée qui débloque tout — adapte la question au type de site. Propose 2-3 options concrètes.

ÉTAPE 2 — ANNONCE ton plan en texte (avant d'écrire le code) :
Écris ce texte mot pour mot (adapté au contexte) :
"Super ! Voici ce que je vais construire pour [Nom du business] :

① [Description précise de la nav + hero]
② [Description de la section services/produits]
③ [Description d'une section unique à ce business]
④ [Témoignages ou social proof]
⑤ [Formulaire de contact ou CTA final]
⑥ Footer complet

Je génère le site maintenant ⚡"

ÉTAPE 3 — Appelle write_code avec le site complet (800+ lignes, toutes les sections).

ÉTAPE 4 — Après write_code, écris ce message (adapté au contexte réel) :
"Ton site est prêt ! 🎉 Voici 3 améliorations que je peux faire :
• [Amélioration spécifique 1 — ex: "Ajouter une galerie photo de tes plats en grille 3×3"]
• [Amélioration spécifique 2 — ex: "Intégrer un système de réservation en ligne avec créneaux horaires"]
• [Amélioration spécifique 3 — ex: "Ajouter une section FAQ avec tes questions les plus fréquentes"]
Dis-moi laquelle tu veux ou décris une autre modification !"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : `
COMPORTEMENT D'AGENT :
Réfléchis brièvement avant d'agir — 1-2 phrases max.
Après chaque modification, propose UNE suggestion concrète de prochaine étape.
`}
CHOIX D'OUTIL :
→ write_code : création initiale, refonte complète, changement de thème, restructuration majeure
→ edit_code : texte, couleurs, ajout d'une section, ajustements visuels ciblés
→ ask_user : seulement si vraiment impossible de deviner — préfère une décision créative

CONTRAINTE DE CODE :
- Max 1 000 lignes pour la création initiale, 600 pour les éditions
- Données en tableaux inline : const items = [{ title, desc, img }]
- Pas de répétition JSX : map() sur les tableaux
- Un seul fichier App.tsx
- Tailwind uniquement (classes arbitraires autorisées)

IMAGES :
- Utilise UNIQUEMENT les URLs Unsplash validées listées dans le design system ci-dessus
- Ne jamais inventer un ID de photo — utilise les URLs exactes fournies
- Avatars témoignages : https://i.pravatar.cc/80?img=[1-70] (toujours disponible)

QUALITÉ VISUELLE — PAR ORDRE DE PRIORITÉ :
1. LE HERO EST TOUT — première impression = tout. Il doit être spectaculaire :
   - Titre : bold, grand (text-5xl à text-8xl), spécifique au business (jamais générique)
   - Sous-titre : 1-2 phrases sur la valeur unique, pas juste la catégorie
   - CTA : verbe d'action fort ("Réserver une table", "Voir mes projets", "Démarrer gratuitement")
   - Visuel : image plein écran h-screen avec overlay, OU gradient fort avec formes décoratives
2. Contenu 100% spécifique — invente de vrais noms, adresses, prix, témoignages (prénom + ville)
3. Respecte STRICTEMENT le design system — jamais de violet par défaut sur un restaurant
4. Sections spacieuses : py-20 à py-32 minimum
5. Animations scroll : utilise IntersectionObserver UNIQUEMENT avec un fallback immédiat si l'observer ne répond pas dans 800ms — ou mieux, utilise des animations CSS @keyframes avec animation-delay pour simuler l'entrée progressive sans dépendre de JS
6. Nav fixe : backdrop-blur-md, fond semi-transparent du preset, logo + liens + CTA bouton
7. Footer complet : navigation, réseaux sociaux, contact, copyright
8. Responsive mobile-first — 1 colonne mobile, 2-3 colonnes desktop

NAVIGATION :
- Chaque section : <section id="services">, <section id="contact">, etc.
- Liens nav : href="#services" uniquement — jamais de /about ou /contact

STRUCTURE OBLIGATOIRE :
nav fixe → hero (SPECTACULAIRE) → stats/social proof → produits/services → témoignages → CTA final → footer

${formEndpoint ? `
FORMULAIRES DE CONTACT — OBLIGATOIRE :
Chaque fois que le site contient un formulaire (contact, réservation, devis, newsletter…), utilise EXACTEMENT ce pattern :

\`\`\`tsx
const FORM_ENDPOINT = '${formEndpoint}'

// Dans ton composant :
const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setFormStatus('loading')
  const formData = new FormData(e.currentTarget)
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form: 'contact', ...data }),
    })
    setFormStatus(res.ok ? 'success' : 'error')
  } catch {
    setFormStatus('error')
  }
}
\`\`\`

Affiche un message de succès si formStatus === 'success' : "Message envoyé ! Nous vous répondrons sous 24h."
Affiche une erreur si formStatus === 'error'.
Désactive le bouton submit quand formStatus === 'loading'.
Ajoute un champ honeypot caché : <input type="text" name="_honeypot" style={{display:'none'}} tabIndex={-1} autoComplete="off" />
Les champs doivent avoir des attributs \`name\` explicites (ex: name="email", name="message").
` : ''}
CODE ACTUEL DU SITE :
\`\`\`tsx
${currentCode || '// Pas encore de code — génère un nouveau site complet.'}
\`\`\``
}

// ─── Execute a tool server-side ───────────────────────────────────────────────

export function executeTool(
  toolName: string,
  toolInput: Record<string, any>,
  currentCode: string,
): { code?: string; note?: string; askQuestion?: string; askOptions?: string[]; error?: string } {
  try {
    switch (toolName) {
      case 'write_code': {
        const code = toolInput.code
        if (!code || typeof code !== 'string') return { error: 'Code invalide ou manquant' }
        return { code: code.trim(), note: toolInput.note }
      }

      case 'edit_code': {
        if (!currentCode) return { error: 'Pas de code existant à modifier' }
        const edits = toolInput.edits as Array<{ search: string; replace: string }>
        if (!Array.isArray(edits) || edits.length === 0) return { error: 'Aucune modification fournie' }

        let result = currentCode
        const failures: string[] = []

        for (const edit of edits) {
          if (!edit.search || typeof edit.search !== 'string') continue
          if (!result.includes(edit.search)) {
            failures.push(`"${edit.search.slice(0, 60).replace(/\n/g, '↵')}…"`)
            continue
          }
          result = result.replace(edit.search, edit.replace ?? '')
        }

        if (failures.length > 0 && result === currentCode) {
          return { error: `Texte introuvable : ${failures.join(', ')}` }
        }

        return { code: result, note: toolInput.note + (failures.length ? ` (${failures.length} édit(s) ignoré(s))` : '') }
      }

      case 'ask_user': {
        return { askQuestion: toolInput.question, askOptions: toolInput.options }
      }

      default:
        return { error: `Outil inconnu : ${toolName}` }
    }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ─── Tool display metadata ────────────────────────────────────────────────────

export function getToolMeta(toolName: string, input: Record<string, any>): { icon: string; label: string } {
  switch (toolName) {
    case 'write_code':
      return { icon: '⚡', label: `Écriture du code : ${input.note || 'site complet'}` }
    case 'edit_code':
      return { icon: '✏️', label: `Modification : ${input.note || (input.edits?.length + ' edit(s)')}` }
    case 'ask_user':
      return { icon: '💬', label: 'Question de clarification' }
    default:
      return { icon: '🔧', label: toolName }
  }
}

// ─── Initial site generation ──────────────────────────────────────────────────

const SITE_TYPE_DESCRIPTIONS: Record<string, string> = {
  business:   'site vitrine d\'entreprise professionnel',
  portfolio:  'portfolio créatif personnel',
  restaurant: 'site restaurant gastronomique avec menu, galerie et réservation',
  bakery:     'boulangerie artisanale avec vitrine produits et histoire',
  shop:       'boutique en ligne avec produits vedettes et panier',
  blog:       'blog magazine moderne avec articles et newsletter',
  saas:       'landing page SaaS avec features, pricing et témoignages',
  landing:    'landing page conversion avec hero percutant et CTA fort',
  wellness:   'site bien-être / spa apaisant avec soins et réservation',
  blank:      'site minimaliste',
}

export async function generateInitialSite({
  name, type, description, siteId,
}: { name: string; type: string; description?: string; siteId?: string }): Promise<string> {
  const typeDesc = SITE_TYPE_DESCRIPTIONS[type] || type

  const prompt = `Crée un ${typeDesc} EXCEPTIONNEL pour "${name}".
${description ? `Contexte client : ${description}` : ''}

MISSION : Le client doit voir ce site et dire "Wow, c'est exactement ce que je voulais." Pas un template générique — un site qui semble fait sur mesure pour CE business.

PRIORITÉS ABSOLUES :
1. Hero spectaculaire — titre accrocheur et spécifique à "${name}", pas une phrase générique. CTA avec verbe d'action fort.
2. Contenu inventé mais ultra-crédible : noms de produits réels, vrais prix, témoignages avec prénom + ville + étoiles, vraie adresse
3. Images des URLs validées du design system uniquement — pas d'URL inventée
4. Design system appliqué à 100% — couleurs, typographie, espacements du preset ci-dessus

STRUCTURE (7 sections minimum) :
nav fixe → hero plein écran → stats/chiffres clés → services/produits (grille) → témoignages (3 minimum) → galerie ou section unique → CTA final → footer complet

Appelle write_code avec le composant React complet.`

  const response = await anthropic.messages.create({
    model:       'claude-sonnet-4-6',
    max_tokens:  12000,
    system:      buildAgentSystemPrompt('', type, siteId),
    tools:       AGENT_TOOLS,
    tool_choice: { type: 'tool', name: 'write_code' },
    messages:    [{ role: 'user', content: prompt }],
  })

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'write_code') {
      const input = block.input as { code?: string }
      if (input.code && typeof input.code === 'string') {
        return input.code.trim()
      }
    }
  }
  throw new Error('No code generated')
}

// ─── Backward compatibility ────────────────────────────────────────────────────

export const SITE_TOOLS = AGENT_TOOLS
export const buildSystemPrompt = buildAgentSystemPrompt
export const extractNoteFromResponse = (_text: string): string => 'Site mis à jour.'
export const extractHtmlFromResponse = (_text: string): string | null => null
export function extractJsonFromResponse(_text: string): string | null { return null }
