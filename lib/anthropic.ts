import Anthropic from '@anthropic-ai/sdk'
import { scrapeUrl, formatScrapeForAgent } from './scrape'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Design variants — organized by industry ─────────────────────────────────
// 19 industries, 2-3 visual variants each.
// Variant is selected by scoring keywords against siteType + user message.
// Every variant has a distinct hero layout, palette, and typography direction
// so no two generated sites look the same.

type DesignVariant = {
  id: string
  keywords: string[]
  preset: string
}

// Each industry key maps to 2-3 visual variants. The variant is selected by
// scoring how many of its keywords appear in the combined siteType + user message.
// Every variant specifies a distinct hero layout, palette, and typography so
// no two generated sites look the same.
//
// HERO LAYOUTS used across variants (never repeat the same one for an industry):
//   FULLSCREEN   — h-screen image + overlay, text centered
//   SPLIT        — text 50% left / image 50% right (or vice versa)
//   TYPO-GIANT   — no image, enormous text fills screen, bold uppercase
//   EDITORIAL    — asymmetric columns, image bleeds to edge, numbered sections
//   BENTO        — masonry/bento grid for hero cards
//   MINIMAL      — lots of whitespace, small refined elements, nothing screams

const DESIGN_VARIANTS: Record<string, DesignVariant[]> = {

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  FOOD & HOSPITALITY                                                     ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  food_fine: [
    {
      id: 'michelin',
      keywords: ['luxe', 'luxueux', 'gastronomique', 'gastronomie', 'étoilé', 'étoile', 'fine dining', 'haut de gamme', 'prestige', 'michelin', 'bistronomie', 'chef', 'étoilée'],
      preset: `
DESIGN SYSTEM — Restaurant Gastronomique (Michelin) :
• Fond : #0a0800 (brun nuit profond) — jamais noir froid
• Accent : #c9a84c (or chaud) sur boutons, lignes déco, titres vedettes
• Secondaire : #8B5E3C (brun riche)
• Surfaces : bg-[#151008] border border-[#c9a84c]/20
• Texte : text-[#f5e6c8] titres, text-[#a89070] corps
• Typo : Playfair Display italic pour titres hero et noms de plats, Inter pour corps
• Hero : SPLIT 50/50 — texte gauche, image plein droite (md:grid-cols-2 min-h-screen)
• Nav : logo centré, liens fins letter-spacing-widest, CTA "Réserver" en or
• Photos : https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop`,
    },
    {
      id: 'brasserie',
      keywords: ['brasserie', 'moderne', 'contemporain', 'trendy', 'branché', 'bar', 'cocktail', 'brunch', 'wine bar', 'cave', 'tapas', 'mezze'],
      preset: `
DESIGN SYSTEM — Brasserie Moderne :
• Fond : #0f1a14 (vert forêt très sombre) — ambiance végétale et contemporaine
• Accent : #10b981 (emeraude) — boutons, prix, badges, soulignements
• Secondaire : #d1fae5 (vert clair) pour les highlights
• Surfaces : bg-[#0a120d] border border-emerald-900/50 rounded-2xl
• Texte : text-white titres, text-emerald-100 corps
• Typo : Inter 900 uppercase pour hero (PAS Playfair), Playfair pour les noms de plats
• Hero : TYPOGRAPHIQUE BOLD — fond vert foncé, titre géant text-7xl uppercase, image en arrière-plan très atténuée (opacity-10)
• Nav : fond transparent → backdrop-blur au scroll, logo left, liens emeraude
• Photos : https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop`,
    },
    {
      id: 'bistro',
      keywords: ['bistro', 'bistrot', 'traditionnel', 'familial', 'trattoria', 'italien', 'pizza', 'cantine', 'terrasse', 'quartier', 'convivial', 'chaleureux', 'authentique', 'maison'],
      preset: `
DESIGN SYSTEM — Bistro Authentique (mode CLAIR) :
• Fond : #fdf6ed (crème chaude) — jamais sombre
• Accent : #c2410c (terracotta/rouille) — CTA, prix, badges
• Secondaire : #92400e (brun caramel)
• Surfaces : bg-white border border-orange-100 rounded-2xl shadow-sm
• Texte : text-stone-900 titres, text-stone-600 corps
• Typo : Playfair Display 700 pour les titres de section, Inter pour les descriptions
• Hero : EDITORIAL — titre sur 2 colonnes, grande image décalée avec ombre, pas de plein écran
• Nav : fond blanc border-b, logo avec icône, liens discrets, CTA rouge terracotta
• Photos : https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=600&fit=crop`,
    },
    {
      id: 'street',
      keywords: ['street food', 'burger', 'ramen', 'tacos', 'fast', 'livraison', 'delivery', 'sushi', 'kebab', 'food truck', 'snack', 'rapide', 'poke', 'bowl'],
      preset: `
DESIGN SYSTEM — Street Food / Fast-Casual :
• Fond : #111111 (noir quasi-pur)
• Accent : #f59e0b (jaune/ambre vif) — très présent, presque agressif
• Secondaire : #ef4444 (rouge) pour urgence et badges "nouveau"
• Surfaces : bg-[#1a1a1a] border-0 rounded-xl (pas de borders subtiles — du contraste fort)
• Texte : text-white titres, text-gray-400 corps, prix en text-[#f59e0b] font-black
• Typo : Inter 900 UPPERCASE PARTOUT, letter-spacing-wider, jamais Playfair
• Hero : TYPOGRAPHIQUE GÉANT — fond noir, titre text-8xl md:text-[10rem] qui déborde, sous-titre court, CTA jaune
• Nav : fond #111, logo typographique, lien "Commander" en bouton jaune
• Photos : https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&h=600&fit=crop`,
    },
  ],

  bakery: [
    {
      id: 'artisan-dark',
      keywords: ['artisan', 'artisanal', 'traditionnel', 'four', 'levain', 'bio', 'maison', 'fait maison', 'authentique'],
      preset: `
DESIGN SYSTEM — Boulangerie Artisanale (dark warm) :
• Fond : #120900 (brun nuit, évoque la farine grillée)
• Accent : #d4a853 (doré beurre) — CTA, prix, badges
• Secondaire : #8B4513 (brun pain)
• Surfaces : bg-[#1e1008]/80 border border-[#d4a853]/20 rounded-3xl
• Texte : text-[#f9efd7] titres, text-[#c4a882] corps
• Typo : Playfair Display italic pour noms de produits, Inter pour descriptions
• Hero : IMAGE PLEIN ÉCRAN h-screen, overlay gradient from-[#120900]/80, texte centré
• Photos : https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&h=600&fit=crop`,
    },
    {
      id: 'patisserie-light',
      keywords: ['pâtisserie', 'pâtissier', 'gâteau', 'cake', 'wedding', 'mariage', 'anniversaire', 'chocolat', 'macaron', 'élégant', 'luxe', 'Paris'],
      preset: `
DESIGN SYSTEM — Pâtisserie Parisienne (mode CLAIR, luxueux) :
• Fond : #fdf9f6 (blanc cassé, papier crème)
• Accent : #b45309 (ambre foncé/caramel) — élégant, pas clinquant
• Secondaire : #fde68a (crème dorée) pour fond des cards produits
• Surfaces : bg-white border border-amber-100 rounded-3xl shadow-md
• Texte : text-stone-900 titres, text-stone-600 corps
• Typo : Playfair Display italic grand (text-6xl+) pour le nom/hero, Inter léger pour descriptions
• Hero : MINIMAL CENTRÉ — fond crème, logo élaboré, titre Playfair italic géant, sous-titre discret, CTA ambre
• Nav : fond blanc, liens en Inter 500 spacing-wide, aucun arrière-plan coloré
• Photos : https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1612203985729-70726954388c?w=800&h=600&fit=crop`,
    },
  ],

  saas: [
    {
      id: 'startup',
      keywords: ['startup', 'growth', 'users', 'viral', 'app', 'mobile', 'traction', 'scale', 'product', 'no-code', 'automation'],
      preset: `
DESIGN SYSTEM — SaaS Startup (dark indigo/violet) :
• Fond : #060818 (bleu nuit profond)
• Accent : #6366f1 → #8b5cf6 (indigo→violet) — dégradés sur CTA et titres
• Secondaire : #06b6d4 (cyan) pour highlights
• Surfaces : bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl
• Texte : text-white titres, text-slate-400 corps
• Typo : Inter 800 pour hero (PAS Playfair), badges rounded-full bg-indigo-500/20 text-indigo-300
• Hero : CENTRÉ avec badge "✦ Nouveau" au dessus du titre, titre gradient indigo→rose, mockup app en dessous
• Photos : https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop | https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop`,
    },
    {
      id: 'developer',
      keywords: ['api', 'developer', 'sdk', 'cli', 'code', 'devops', 'analytics', 'data', 'logs', 'monitoring', 'infrastructure', 'cloud', 'open source', 'terminal', 'git'],
      preset: `
DESIGN SYSTEM — Developer Tool / API (dark terminal) :
• Fond : #000000 (noir pur — comme un terminal)
• Accent : #22c55e (vert terminal) — primary CTA, highlights, code inline
• Secondaire : #f59e0b (ambre/warning) pour badges bêta, alertes
• Surfaces : bg-[#0d0d0d] border border-white/10 — ou bg-[#111] pour les "terminal windows"
• Texte : text-white titres Inter 900, text-gray-400 corps, code en font-mono text-green-400
• Typo : Inter uniquement, avec font-mono pour tout ce qui ressemble à du code
• Hero : SPLIT — gauche: titre bold + description + CTA ; droite: "terminal window" avec code animé (bg-black rounded-xl border border-white/20)
• Nav : fond noir, logo monospaced, lien "Docs" et "GitHub" proéminents
• Photos : https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop`,
    },
    {
      id: 'enterprise',
      keywords: ['enterprise', 'b2b', 'platform', 'crm', 'erp', 'hr', 'finance', 'compliance', 'workflow', 'corporate', 'business', 'solution', 'management'],
      preset: `
DESIGN SYSTEM — SaaS Enterprise / B2B (mode CLAIR) :
• Fond : #ffffff (blanc pur, clarté et confiance)
• Accent : #2563eb (bleu enterprise) — tous les CTA et liens
• Secondaire : #059669 (vert succès) pour les metrics positives
• Surfaces : bg-gray-50 border border-gray-200 rounded-xl shadow-sm
• Texte : text-gray-900 titres Inter 700, text-gray-600 corps
• Typo : Inter uniquement — clarté avant tout, rien de fantaisiste
• Hero : SPLIT 50/50 — texte gauche avec bullet points avantages, screenshot dashboard droite avec ombre
• Nav : fond blanc border-b, logo bleu, "Demander une démo" en bouton bleu, "Se connecter" en outline
• Photos : https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop | https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop`,
    },
  ],

  portfolio: [
    {
      id: 'dark-minimal',
      keywords: ['minimal', 'minimaliste', 'épuré', 'photographer', 'photographe', 'designer', 'graphiste'],
      preset: `
DESIGN SYSTEM — Portfolio Minimaliste (noir/blanc radical) :
• Fond : #080808 (noir pur)
• Accent : #ffffff — typographie massive (text-7xl+), pas de couleur
• Secondaire : #444444 (gris medium)
• Surfaces : border border-white/10, hover:border-white/30 transition
• Texte : text-white gras extrême pour titres, text-gray-500 corps
• Typo : Playfair Display 900 pour le nom, Inter 900 pour les sections
• Hero : TYPOGRAPHIQUE — nom en text-8xl, titre sous le nom en text-gray-500, scroll indicator
• Grid projets : overlay dark au hover avec titre + catégorie en blanc
• Photos : https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop | https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop`,
    },
    {
      id: 'editorial',
      keywords: ['fashion', 'mode', 'art', 'illustration', 'editorial', 'magazine', 'brand', 'branding', 'direction artistique', 'artistique', 'créatif'],
      preset: `
DESIGN SYSTEM — Portfolio Editorial (fond crème, typographie forte) :
• Fond : #f5f0e8 (crème chaude, papier editorial)
• Accent : #000000 (noir total) — chaque élément clé est noir sur crème
• Secondaire : #c2410c (terracotta) pour les numéros de section et accents
• Surfaces : bg-white border-0 shadow-none — jeu d'espaces blancs
• Texte : text-black titres Playfair Display 900 ultra-bold, text-stone-600 corps
• Typo : Playfair Display 900 pour les grands titres, Inter 400 pour le corps — contraste dramatique
• Hero : EDITORIAL — titre sur 2 colonnes asymétriques, image en plein droite qui coupe le bord, numéros de section en rouge terracotta
• Nav : fond crème, liens Inter 500 uppercase spacing-widest, minimaliste
• Photos : https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1523413555158-571e78758416?w=800&h=600&fit=crop`,
    },
    {
      id: 'vibrant',
      keywords: ['motion', '3d', 'animation', 'colorful', 'vibrant', 'neon', 'digital', 'creative technologist', 'ui', 'ux', 'développeur'],
      preset: `
DESIGN SYSTEM — Portfolio Vibrant / Créatif-Digital :
• Fond : #0d0d0d (noir quasi-pur)
• Accent : dégradé rotatif — from-fuchsia-500 via-violet-500 to-cyan-400 (appliqué sur le titre principal)
• Secondaire : #f0abfc (rose pale) pour les tags et badges
• Surfaces : bg-white/5 border border-white/10 rounded-2xl backdrop-blur — effet glassmorphism
• Texte : text-white titres, text-gray-400 corps
• Typo : Inter 900 avec gradient text-transparent bg-clip-text pour le nom, Inter 400 corps
• Hero : BENTO — grille asymétrique 3×2, une grande card = nom + titre, autres cards = projets avec hover effects
• Nav : transparent → blur au scroll, liens en blanc, point coloré animé avant le CTA
• Photos : https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop`,
    },
  ],

  shop: [
    {
      id: 'clean-light',
      keywords: ['mode', 'fashion', 'vêtement', 'accessoire', 'boutique', 'shop', 'store'],
      preset: `
DESIGN SYSTEM — E-commerce Fashion (light, clean) :
• Fond : #ffffff (blanc pur)
• Accent : #111827 (noir) — boutons, prix
• Secondaire : #dc2626 (rouge) pour badges "solde" et "nouveau"
• Surfaces : bg-gray-50 border border-gray-200 shadow-sm rounded-lg
• Texte : text-gray-900 titres Inter 700, text-gray-600 descriptions
• Typo : Inter — clarté totale, lecture des produits en priorité
• Hero : SPLIT — modèle/lifestyle à gauche, accroche + CTA à droite
• Photos : https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop | https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop | https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop`,
    },
    {
      id: 'luxury-dark',
      keywords: ['luxe', 'premium', 'bijoux', 'jewelry', 'montre', 'watch', 'maroquinerie', 'cuir', 'exclusif', 'haut de gamme'],
      preset: `
DESIGN SYSTEM — Boutique Luxe (dark, minimaliste premium) :
• Fond : #0a0a0a (noir profond)
• Accent : #d4af70 (or pâle) — jamais criard, toujours élégant
• Secondaire : #ffffff (blanc) pour les titres importants
• Surfaces : bg-[#141414] border border-white/10 — minimalisme radical
• Texte : text-white titres Playfair Display 300 (léger = luxe), text-gray-400 corps Inter 300
• Typo : Playfair Display en weight LÉGER (300-400) pour l'héro — le luxe ne crie pas
• Hero : MINIMAL CENTRÉ — fond noir, logo or, titre Playfair 300 text-5xl en blanc, sous-titre en gris, CTA outline blanc
• Photos : https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop | https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1549572082-8b9e2d9e7e34?w=800&h=600&fit=crop`,
    },
  ],

  business: [
    {
      id: 'dark-navy',
      keywords: ['consulting', 'conseil', 'finance', 'fintech', 'investissement', 'audit', 'stratégie', 'gestion', 'corporate'],
      preset: `
DESIGN SYSTEM — Business / Finance (dark navy professionnel) :
• Fond : #0a0f1e (navy très sombre)
• Accent : #3b82f6 (bleu) → #2563eb au hover
• Secondaire : #10b981 (vert) pour stats positives
• Surfaces : bg-white/5 border border-blue-900/50 rounded-xl
• Texte : text-white titres Inter 800, text-blue-100 corps, chiffres clés text-5xl font-black text-blue-400
• Typo : Inter uniquement — autorité et clarté
• Hero : SPLIT — texte + chiffres clés à gauche, dashboard/graphique stylisé à droite
• Photos : https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop`,
    },
    {
      id: 'white-editorial',
      keywords: ['avocat', 'notaire', 'médecin', 'dentiste', 'clinique', 'cabinet', 'kiné', 'ostéo', 'expert-comptable', 'comptable', 'juridique', 'droit', 'santé'],
      preset: `
DESIGN SYSTEM — Cabinet / Profession Libérale (blanc, austère, confiance) :
• Fond : #ffffff (blanc total — confiance institutionnelle)
• Accent : #1e3a5f (bleu marine foncé) — sérieux, jamais ludique
• Secondaire : #64748b (gris ardoise) pour éléments secondaires
• Surfaces : bg-slate-50 border border-slate-200 rounded-lg shadow-sm
• Texte : text-slate-900 titres Inter 700, text-slate-600 corps
• Typo : Inter uniquement — toujours sobre et lisible
• Hero : EDITORIAL simple — pas d'image plein écran. Titre à gauche, photo professionnelle à droite (rounded), fond blanc
• Nav : fond blanc border-b border-slate-200, logo discret, "Prendre RDV" en bouton marine
• Photos : https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop | https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop`,
    },
    {
      id: 'bold-agency',
      keywords: ['agence', 'marketing', 'communication', 'publicité', 'branding', 'créatif', 'digital', 'media', 'production', 'studio'],
      preset: `
DESIGN SYSTEM — Agence / Studio Créatif (noir, assertif, caractère) :
• Fond : #0c0c0c (noir quasi-pur)
• Accent : #f97316 (orange brûlé) — puissant et mémorable
• Secondaire : #ffffff pour grands titres hero
• Surfaces : bg-[#141414] border-0 (les bords = les espaces, pas des lignes)
• Texte : text-white titres Inter 900, text-gray-400 corps
• Typo : Inter 900 UPPERCASE pour les sections titles, Playfair pour les citations clients
• Hero : TYPOGRAPHIQUE GÉANT — titre text-7xl md:text-9xl qui prend toute la largeur, mot clé en orange, fond noir
• Nav : fond noir, logo typographique blanc, CTA orange
• Photos : https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  FINANCE & INSURANCE                                                    ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  finance: [
    {
      id: 'fintech-dark',
      keywords: ['fintech', 'néo-banque', 'paiement', 'crypto', 'blockchain', 'trading', 'investissement', 'bourse', 'epargne', 'épargne', 'retraite', 'bilan', 'patrimoine', 'actif'],
      preset: `
DESIGN SYSTEM — Fintech / Trading (dark premium) :
• Hero : BENTO GRID — grande card titre + cards métriques autour (rendement, AUM, clients)
• Fond : #030f0a · Accent : #10b981 (emeraude) · Secondaire : #6ee7b7
• Surfaces : bg-white/5 border border-emerald-900/50 rounded-2xl backdrop-blur
• Texte : text-white Inter 800 titres, text-emerald-100 corps, chiffres text-emerald-400 font-black text-5xl
• Typo : Inter uniquement — chiffres imposants, pas de Playfair
• Nav : fond #030f0a, logo typographique, CTA "Commencer" emeraude
• Photos : https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop | https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&h=600&fit=crop`,
    },
    {
      id: 'bank-trust',
      keywords: ['banque', 'assurance', 'crédit', 'prêt', 'hypothèque', 'mutuelle', 'courtier', 'conseil financier', 'gestion de patrimoine', 'fortune', 'family office'],
      preset: `
DESIGN SYSTEM — Banque / Assurance (dark navy, confiance institutionnelle) :
• Hero : SPLIT 50/50 — accroche + chiffres clés gauche, image institutionnelle droite
• Fond : #0a0f1e (navy profond) · Accent : #3b82f6 · Secondaire : #10b981
• Surfaces : bg-white/5 border border-blue-900/50 rounded-xl
• Texte : text-white Inter 800 titres, text-blue-100 corps, stats text-5xl font-black text-blue-400
• Nav : fond navy, logo sobre, "Prendre RDV" bouton bleu
• Photos : https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=800&h=600&fit=crop`,
    },
    {
      id: 'accounting-light',
      keywords: ['comptable', 'expert-comptable', 'audit', 'commissaire', 'bilan', 'fiscalité', 'TVA', 'RSE', 'conformité', 'cabinet comptable'],
      preset: `
DESIGN SYSTEM — Cabinet Comptable / Audit (light, rigueur) :
• Hero : EDITORIAL — titre sobre à gauche, photo équipe à droite, fond blanc
• Fond : #ffffff · Accent : #1e40af (bleu marine) · Secondaire : #64748b
• Surfaces : bg-slate-50 border border-slate-200 rounded-lg shadow-sm
• Texte : text-slate-900 Inter 700 titres, text-slate-600 corps
• Typo : Inter uniquement — rigueur et lisibilité avant tout
• Nav : fond blanc border-b, logo bleu, "Nous contacter" outline
• Photos : https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  LEGAL                                                                   ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  legal: [
    {
      id: 'law-dark',
      keywords: ['avocat', 'cabinet d\'avocats', 'barreau', 'droit', 'litige', 'contentieux', 'pénal', 'défense', 'procès', 'tribunal'],
      preset: `
DESIGN SYSTEM — Cabinet d'Avocats (dark, autorité) :
• Hero : TYPO-GIANT — fond noir quasi-pur, nom du cabinet en text-7xl Playfair Display blanc, sous-titre Inter 400 gris, CTA "Consulter"
• Fond : #0d0d0d · Accent : #d4af70 (or sobre) · Secondaire : #ffffff
• Surfaces : bg-[#141414] border border-white/10 rounded-xl
• Texte : text-white Playfair Display 700 titres, text-gray-400 Inter corps
• Typo : Playfair Display pour titres (autorité classique), Inter 400 corps
• Nav : fond #0d0d0d, logo doré, liens espacés, CTA "Prise de RDV" outline or
• Photos : https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop`,
    },
    {
      id: 'notary-light',
      keywords: ['notaire', 'étude notariale', 'acte', 'succession', 'testament', 'donation', 'immobilier', 'juridique', 'conseil juridique', 'conformité'],
      preset: `
DESIGN SYSTEM — Étude Notariale / Conseil Juridique (light, sobre) :
• Hero : SPLIT — texte sobre + domaines d'expertise gauche, photo bureau/équipe droite
• Fond : #fafaf9 · Accent : #44403c (marron-gris pierre) · Secondaire : #78716c
• Surfaces : bg-white border border-stone-200 rounded-lg shadow-sm
• Texte : text-stone-900 Playfair Display 600 titres, text-stone-600 Inter corps
• Nav : fond blanc border-b border-stone-200, logo Playfair, "Prendre RDV" bouton stone
• Photos : https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  MEDICAL                                                                 ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  medical: [
    {
      id: 'clinic-light',
      keywords: ['clinique', 'hôpital', 'médecin', 'généraliste', 'spécialiste', 'cabinet médical', 'ordonnance', 'consultation', 'urgences', 'centre de santé', 'maison de santé'],
      preset: `
DESIGN SYSTEM — Cabinet Médical / Clinique (light clinique, confiance) :
• Hero : SPLIT — photo médecin/salle d'attente à gauche, présentation + bouton "Prendre RDV" à droite
• Fond : #f8fafc (blanc légèrement bleuté) · Accent : #0ea5e9 · Secondaire : #10b981
• Surfaces : bg-white border border-slate-200 rounded-xl shadow-sm
• Texte : text-slate-900 Inter 700 titres, text-slate-600 corps
• Typo : Inter uniquement — rien de fantaisiste dans un contexte médical
• Nav : fond blanc border-b, logo bleu ciel, "Prendre RDV en ligne" bouton bleu proéminent
• Photos : https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&h=600&fit=crop`,
    },
    {
      id: 'dental-premium',
      keywords: ['dentiste', 'dentaire', 'orthodontiste', 'implant', 'blanchiment', 'orthodontie', 'chirurgien-dentiste', 'sourire', 'esthétique dentaire'],
      preset: `
DESIGN SYSTEM — Cabinet Dentaire (light premium, sourire) :
• Hero : FULLSCREEN — photo sourire/cabinet avec overlay blanc 30%, texte centré bleu marine
• Fond : #ffffff · Accent : #0284c7 (bleu ciel vif) · Secondaire : #0ea5e9
• Surfaces : bg-sky-50 border border-sky-100 rounded-2xl shadow-sm
• Texte : text-sky-900 Inter 800 titres, text-sky-700 corps
• Accents visuels : icônes dent stylisées, pastilles bleues, badges "Sans douleur", "Technologie laser"
• Nav : fond blanc, logo avec icône dent, CTA "Réserver" bleu vif
• Photos : https://images.unsplash.com/photo-1588776814546-1ffbb1e7e4e6?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop`,
    },
    {
      id: 'pharma-clean',
      keywords: ['pharmacie', 'pharmacien', 'médicament', 'parapharmacie', 'ordonnance', 'vaccin', 'officine'],
      preset: `
DESIGN SYSTEM — Pharmacie (light, couleurs santé) :
• Hero : EDITORIAL — titre "Votre santé, notre priorité" à gauche, photo pharmacien à droite
• Fond : #f0fdf4 (vert très clair) · Accent : #16a34a (vert pharmacie) · Secondaire : #0ea5e9
• Surfaces : bg-white border border-green-100 rounded-xl shadow-sm
• Texte : text-green-900 Inter 700 titres, text-green-700 corps
• Nav : fond blanc, croix verte proéminente dans le logo, "Horaires" et "Services" en avant
• Photos : https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  WELLNESS & BEAUTY                                                       ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  wellness: [
    {
      id: 'spa-light',
      keywords: ['spa', 'massage', 'soin', 'détente', 'relaxation', 'bien-être', 'hammam', 'sauna', 'thalasso', 'institut', 'beauty', 'beauté', 'esthétique'],
      preset: `
DESIGN SYSTEM — Spa / Institut Beauté (light naturel, douceur) :
• Hero : FULLSCREEN — h-screen image soin avec overlay très léger, titre Playfair italic blanc centré
• Fond : #faf8f5 (crème) · Accent : #78716c (pierre) · Secondaire : #d4a574 (terre)
• Surfaces : bg-white border border-stone-200 rounded-3xl shadow-sm
• Texte : text-stone-800 Playfair Display italic titres, text-stone-600 Inter léger corps
• Nav : fond crème, liens espacés Inter 400, CTA "Réserver un soin" stone
• Photos : https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800&h=600&fit=crop`,
    },
    {
      id: 'yoga-dark',
      keywords: ['yoga', 'méditation', 'mindfulness', 'retraite', 'pleine conscience', 'ayurvéda', 'holistique', 'naturopathie', 'coaching', 'développement personnel'],
      preset: `
DESIGN SYSTEM — Yoga / Méditation (dark forest, sérénité) :
• Hero : TYPO-GIANT — citation zen en Playfair Display italic text-5xl sur fond forêt, image en arrière-plan opacity-20
• Fond : #0a1208 (vert forêt profond) · Accent : #86efac (vert sage clair) · Secondaire : #fbbf24
• Surfaces : bg-[#0f1a0e] border border-green-900/40 rounded-3xl
• Texte : text-white Playfair Display italic titres, text-green-100 corps — poésie visuelle
• Nav : fond transparent → backdrop-blur, logo minimaliste, "Rejoindre" en vert sage
• Photos : https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=600&fit=crop`,
    },
    {
      id: 'hair-bold',
      keywords: ['coiffeur', 'coiffure', 'salon', 'barbier', 'barbershop', 'ongles', 'nail', 'make-up', 'maquillage', 'coloriste', 'extensions', 'lissage'],
      preset: `
DESIGN SYSTEM — Salon Coiffure / Barbershop (bold, attitude) :
• Hero : SPLIT — grande photo modèle/coupe à gauche (bords rognés), texte bold + "Réserver" à droite
• Fond : #111111 · Accent : #f59e0b (ambre) ou #ec4899 (rose) selon genre · Secondaire : #ffffff
• Surfaces : bg-[#1a1a1a] border-0 rounded-xl
• Texte : text-white Inter 900 titres en uppercase, text-gray-400 corps
• Typo : Inter 900 UPPERCASE pour le nom du salon, jamais de Playfair
• Nav : fond noir, logo typographique, lien "Book Now" en accent
• Photos : https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  RETAIL & COMMERCE                                                       ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  retail: [
    {
      id: 'fashion-light',
      keywords: ['mode', 'fashion', 'vêtement', 'vêtements', 'prêt-à-porter', 'accessoire', 'collection', 'tendance', 'lookbook'],
      preset: `
DESIGN SYSTEM — Mode / Fashion (light clean, Zara/SSENSE) :
• Hero : FULLSCREEN — modèle lifestyle plein écran, overlay minimal, texte blanc en bas à gauche
• Fond : #ffffff · Accent : #111827 (noir) · Badges : #dc2626 (rouge soldes)
• Surfaces : bg-gray-50 border border-gray-200 shadow-sm rounded-lg
• Texte : text-gray-900 Inter 700 titres, text-gray-600 descriptions
• Grid produits : 4 colonnes desktop, images aspect-square fond blanc, hover zoom
• Nav : fond blanc border-b, catégories horizontales, icônes panier/recherche
• Photos : https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop | https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop | https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop`,
    },
    {
      id: 'luxury-dark',
      keywords: ['luxe', 'premium', 'bijoux', 'jewelry', 'montre', 'watch', 'maroquinerie', 'cuir', 'exclusif', 'haut de gamme', 'joaillerie', 'haute couture', 'couture'],
      preset: `
DESIGN SYSTEM — Luxe / Maroquinerie (dark minimaliste premium) :
• Hero : MINIMAL CENTRÉ — fond noir, logo en or pâle, titre Playfair Display 300 blanc text-5xl, CTA outline blanc, beaucoup d'espace négatif
• Fond : #0a0a0a · Accent : #d4af70 (or pâle, pas criard) · Secondaire : #ffffff
• Surfaces : bg-[#141414] border border-white/10 — silences et espaces
• Texte : text-white Playfair Display 300 hero (poids léger = luxe), Inter 300 corps
• Typo : Playfair Display weight 300 uniquement pour les titres hero — jamais de gras dans le luxe
• Nav : fond transparent, logo minimaliste, liens letter-spacing-widest
• Photos : https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop | https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1549572082-8b9e2d9e7e34?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop`,
    },
    {
      id: 'home-decor',
      keywords: ['décoration', 'décor', 'maison', 'meuble', 'intérieur', 'mobilier', 'design d\'intérieur', 'luminaire', 'céramique', 'artisanat', 'fait main', 'handmade'],
      preset: `
DESIGN SYSTEM — Décoration / Artisanat (light éditorial, ambiance magasin) :
• Hero : EDITORIAL — titre grand à gauche, grande photo produit qui déborde à droite
• Fond : #fdf9f4 (ivoire chaud) · Accent : #92400e (brun caramel) · Secondaire : #d4a574
• Surfaces : bg-white border border-amber-100 rounded-2xl shadow-sm
• Texte : text-stone-900 Playfair Display 700 titres, text-stone-600 Inter corps
• Photos : https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  REAL ESTATE & ARCHITECTURE                                              ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  realestate: [
    {
      id: 'agency-dark',
      keywords: ['agence immobilière', 'immobilier', 'appartement', 'maison', 'vente', 'location', 'propriété', 'bien', 'mandat', 'estimation', 'promoteur', 'promotion immobilière'],
      preset: `
DESIGN SYSTEM — Agence Immobilière (dark premium, exclusivité) :
• Hero : FULLSCREEN — vue aérienne ou facade luxueuse, overlay #0a0a0a/70, titre Playfair Display blanc centré
• Fond : #0c0c0c · Accent : #d4af70 (or) · Secondaire : #ffffff
• Surfaces : bg-[#161616] border border-white/10 rounded-xl
• Texte : text-white Playfair Display 700 titres, text-gray-400 Inter corps
• Cards biens : image aspect-video, badges "Exclusivité" or, prix en blanc font-bold
• Nav : fond #0c0c0c, logo Playfair, "Estimer mon bien" CTA or
• Photos : https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop`,
    },
    {
      id: 'architect-editorial',
      keywords: ['architecte', 'architecture', 'design', 'bureau d\'études', 'cabinet', 'plan', 'rénovation', 'construction', 'projet', 'maquette', 'décorateur'],
      preset: `
DESIGN SYSTEM — Cabinet d'Architecture (editorial minimaliste) :
• Hero : EDITORIAL — numéro de section "01" en terracotta, titre en Playfair Display 900, image en plein droite qui déborde
• Fond : #f5f0e8 (papier crème) · Accent : #0c0c0c (noir total) · Numéros : #c2410c (terracotta)
• Surfaces : bg-white border-0 — jeu d'espaces et de proportions
• Texte : text-black Playfair Display 900 titres massifs, text-stone-600 Inter corps
• Typo : contraste extrême entre Playfair 900 (titres) et Inter 300 (corps)
• Nav : fond crème, liens Inter 500 uppercase spacing-widest
• Photos : https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  TECH & DIGITAL                                                          ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  tech: [
    {
      id: 'saas-startup',
      keywords: ['saas', 'startup', 'app', 'application', 'plateforme', 'product', 'growth', 'users', 'viral', 'scale', 'no-code', 'automation', 'workflow'],
      preset: `
DESIGN SYSTEM — SaaS Startup (dark indigo/violet, énergique) :
• Hero : CENTRÉ — badge "✦ Nouveau" → titre gradient indigo→rose text-5xl → sous-titre → CTA → chiffres clés
• Fond : #060818 · Accent : dégradé #6366f1→#8b5cf6 · Secondaire : #06b6d4 (cyan)
• Surfaces : bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl
• Texte : text-white Inter 800 titres, text-slate-400 corps, badges bg-indigo-500/20 text-indigo-300
• Nav : fond #060818, logo gradient, "Démarrer gratuitement" bouton gradient
• Photos : https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop | https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop`,
    },
    {
      id: 'developer-tool',
      keywords: ['api', 'sdk', 'cli', 'developer', 'développeur', 'devops', 'infrastructure', 'cloud', 'monitoring', 'logs', 'open source', 'terminal', 'git', 'déploiement'],
      preset: `
DESIGN SYSTEM — Developer Tool / API (black terminal, vert code) :
• Hero : SPLIT — gauche: titre bold Inter 900 + description + CTA vert ; droite: "terminal window" avec code statique (bg-black rounded-xl border border-white/20 font-mono text-green-400)
• Fond : #000000 · Accent : #22c55e (vert terminal) · Secondaire : #f59e0b (warning)
• Surfaces : bg-[#0d0d0d] border border-white/10
• Texte : text-white Inter 900 titres, text-gray-400 corps, code text-green-400 font-mono
• Nav : fond noir, logo monospaced, liens "Docs" et "GitHub" proéminents
• Photos : https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop`,
    },
    {
      id: 'digital-agency',
      keywords: ['agence digitale', 'agence web', 'agence marketing', 'communication', 'publicité', 'branding', 'stratégie digitale', 'SEO', 'réseaux sociaux', 'growth hacking'],
      preset: `
DESIGN SYSTEM — Agence Digitale (noir, orange, assertif) :
• Hero : TYPO-GIANT — titre text-7xl md:text-9xl qui prend toute la largeur, mot clé en orange, fond noir
• Fond : #0c0c0c · Accent : #f97316 (orange brûlé) · Secondaire : #ffffff
• Surfaces : bg-[#141414] border-0 — les bords = les espaces, pas des lignes
• Texte : text-white Inter 900 UPPERCASE titres de section, text-gray-400 Inter corps
• Nav : fond noir, logo typographique blanc, CTA orange
• Photos : https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  CREATIVE & PORTFOLIO                                                    ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  creative: [
    {
      id: 'minimal-bw',
      keywords: ['photographe', 'photographer', 'designer', 'graphiste', 'minimal', 'épuré', 'portfolio', 'works', 'projects'],
      preset: `
DESIGN SYSTEM — Portfolio Minimaliste (noir/blanc radical) :
• Hero : TYPO-GIANT — nom en text-8xl Playfair Display, titre en text-gray-500 dessous, scroll indicator
• Fond : #080808 · Accent : #ffffff · Secondaire : #444444
• Surfaces : border border-white/10, hover:border-white/30 transition
• Texte : text-white Playfair Display 900 titres, text-gray-500 Inter corps
• Grid projets : overlay dark au hover avec titre + catégorie en blanc
• Photos : https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop | https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop`,
    },
    {
      id: 'editorial-cream',
      keywords: ['fashion', 'mode', 'art', 'illustration', 'direction artistique', 'branding', 'brand', 'identité visuelle', 'créatif', 'artiste'],
      preset: `
DESIGN SYSTEM — Portfolio Editorial (crème, contrastes forts) :
• Hero : EDITORIAL — titre Playfair Display 900 sur 2 colonnes asymétriques, image qui déborde à droite, numéros de section terracotta
• Fond : #f5f0e8 (crème papier) · Accent : #000000 · Numéros : #c2410c
• Surfaces : bg-white border-0 — espaces blancs et proportions
• Texte : text-black Playfair Display 900 titres, text-stone-600 Inter 300 corps
• Nav : fond crème, liens Inter 500 uppercase spacing-widest
• Photos : https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1523413555158-571e78758416?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop`,
    },
    {
      id: 'vibrant-bento',
      keywords: ['motion', '3d', 'animation', 'neon', 'digital', 'ui', 'ux', 'développeur créatif', 'creative technologist', 'colorful'],
      preset: `
DESIGN SYSTEM — Portfolio Vibrant / Digital (bento, glassmorphism) :
• Hero : BENTO GRID — grille 3×2 : une grande card = nom + titre gradient, autres cards = projets avec hover
• Fond : #0d0d0d · Accent : dégradé from-fuchsia-500 via-violet-500 to-cyan-400 · Secondaire : #f0abfc
• Surfaces : bg-white/5 border border-white/10 rounded-2xl backdrop-blur glassmorphism
• Texte : text-white Inter 900 nom en gradient, text-gray-400 corps
• Nav : transparent → blur, liens blancs, point animé avant CTA
• Photos : https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  AGRICULTURE & FOOD PRODUCTION                                           ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  agriculture: [
    {
      id: 'farm-organic',
      keywords: ['ferme', 'agriculteur', 'agriculture', 'bio', 'biologique', 'maraîcher', 'producteur', 'local', 'circuit court', 'panier', 'AMAP', 'légumes', 'fruits', 'élevage'],
      preset: `
DESIGN SYSTEM — Ferme / Producteur Bio (light terre, authentique) :
• Hero : FULLSCREEN — photo champ/récolte h-screen, overlay from-green-900/40, titre Playfair italic blanc
• Fond : #fafaf5 (blanc cassé herbeux) · Accent : #16a34a (vert prairie) · Secondaire : #92400e (terre)
• Surfaces : bg-white border border-green-100 rounded-2xl shadow-sm
• Texte : text-green-900 Playfair Display 700 titres, text-green-700 Inter corps
• Nav : fond blanc, logo avec feuille, "Commander" en vert
• Photos : https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop`,
    },
    {
      id: 'vineyard-premium',
      keywords: ['vigne', 'vignoble', 'vin', 'cave', 'domaine', 'château', 'cuvée', 'millésime', 'dégustation', 'oenotourisme', 'terroir', 'appellation', 'AOC'],
      preset: `
DESIGN SYSTEM — Domaine Viticole (dark warm, prestige) :
• Hero : SPLIT 50/50 — texte gauche (nom domaine Playfair italic or, millésime), photo vigne à droite
• Fond : #0d0900 (brun nuit) · Accent : #c9a84c (or chaud) · Secondaire : #8B5E3C
• Surfaces : bg-[#1a1208] border border-[#c9a84c]/20 rounded-xl
• Texte : text-[#f5e6c8] Playfair Display italic titres, text-[#a89070] Inter corps
• Nav : logo centré Playfair, liens letter-spacing-widest, CTA "Commander" or
• Photos : https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1559628233-100c798642d5?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop`,
    },
    {
      id: 'food-producer',
      keywords: ['conserverie', 'fromagerie', 'charcuterie', 'épicerie fine', 'traiteur', 'confiture', 'miel', 'huile', 'artisan agroalimentaire', 'transformation', 'produits régionaux'],
      preset: `
DESIGN SYSTEM — Épicerie Fine / Artisan Agroalimentaire (light chaud) :
• Hero : EDITORIAL — titre grand à gauche "Fait avec passion", grande photo produit à droite qui déborde
• Fond : #fdf6ed (crème) · Accent : #b45309 (ambre caramel) · Secondaire : #92400e
• Surfaces : bg-white border border-amber-100 rounded-2xl shadow-sm
• Texte : text-stone-900 Playfair Display 700 titres, text-stone-600 Inter corps
• Photos : https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1519867219-3f46ef84fcdd?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  EDUCATION & TRAINING                                                    ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  education: [
    {
      id: 'school-trust',
      keywords: ['école', 'lycée', 'collège', 'université', 'établissement', 'enseignement', 'scolaire', 'académique', 'scolarité', 'inscription', 'rentrée', 'formation initiale'],
      preset: `
DESIGN SYSTEM — École / Établissement Scolaire (light, confiance) :
• Hero : SPLIT — accroche institution gauche, photo élèves/campus droite
• Fond : #ffffff · Accent : #2563eb (bleu) · Secondaire : #059669 (vert réussite)
• Surfaces : bg-slate-50 border border-slate-200 rounded-xl shadow-sm
• Texte : text-slate-900 Inter 700 titres, text-slate-600 corps
• Stats hero : taux de réussite, années d'existence, diplômés — format text-4xl font-black text-blue-600
• Nav : fond blanc border-b, logo institutionnel, "S'inscrire" CTA bleu
• Photos : https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=600&fit=crop`,
    },
    {
      id: 'elearning-modern',
      keywords: ['e-learning', 'formation en ligne', 'cours en ligne', 'MOOC', 'tutoriel', 'coaching', 'mentor', 'certification', 'compétence', 'upskilling', 'bootcamp'],
      preset: `
DESIGN SYSTEM — E-Learning / Formation (dark moderne, impact) :
• Hero : CENTRÉ — badge "⚡ +12 000 apprenants" → titre gradient indigo→cyan → CTA "Commencer gratuitement" → logos entreprises partenaires
• Fond : #060818 · Accent : #6366f1 → #06b6d4 · Secondaire : #f59e0b (badge "Pro")
• Surfaces : bg-white/5 border border-white/10 backdrop-blur rounded-2xl
• Texte : text-white Inter 800 titres, text-slate-400 corps
• Cards cours : image, durée, niveau, badge "Populaire", progression bar
• Nav : fond #060818, logo, "Se connecter" outline, "Commencer" filled gradient
• Photos : https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  DEFENSE & SECURITY                                                      ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  defense: [
    {
      id: 'cybersecurity',
      keywords: ['cybersécurité', 'sécurité informatique', 'pentesting', 'audit sécurité', 'SOC', 'SIEM', 'zero trust', 'ransomware', 'threat', 'vulnerabilité', 'RGPD sécurité', 'firewall', 'hacking', 'red team'],
      preset: `
DESIGN SYSTEM — Cybersécurité (dark terminal, rouge alerte) :
• Hero : SPLIT — gauche: titre "Protégez vos systèmes" Inter 900 + points de menaces + CTA ; droite: visualisation réseau animée (SVG points reliés sur fond noir)
• Fond : #000000 · Accent : #ef4444 (rouge alerte) · Secondaire : #22c55e (vert "secure")
• Surfaces : bg-[#0d0d0d] border border-red-900/50 rounded-xl
• Texte : text-white Inter 900 titres, text-gray-400 corps, alertes text-red-400 font-mono
• Typo : Inter + font-mono pour les termes techniques (CVE, IP, etc.)
• Nav : fond noir, logo avec bouclier, "Audit gratuit" CTA rouge
• Photos : https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1555066931-bf19f8fd1085?w=800&h=600&fit=crop`,
    },
    {
      id: 'defense-industry',
      keywords: ['défense', 'sécurité nationale', 'armement', 'militaire', 'renseignement', 'industrie de défense', 'système de sécurité', 'gardiennage', 'surveillance', 'protection', 'securitas'],
      preset: `
DESIGN SYSTEM — Industrie de Défense / Sécurité (dark navy sévère) :
• Hero : FULLSCREEN — image forces/équipement avec overlay navy/70, titre Inter 900 uppercase blanc, sous-ligne fine, CTA "En savoir plus"
• Fond : #020814 (navy profond) · Accent : #1d4ed8 (bleu régalien) · Secondaire : #64748b
• Surfaces : bg-white/5 border border-blue-900/30 rounded-lg
• Texte : text-white Inter 800 uppercase titres, text-slate-300 corps
• Typo : Inter uniquement, uppercase systématique pour les sections — sérieux et hiérarchie
• Nav : fond #020814 border-b border-blue-900/50, logo sobre, aucun emoji
• Photos : https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1561525155-a2bd73c1451d?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  EVENTS & ENTERTAINMENT                                                  ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  events: [
    {
      id: 'wedding',
      keywords: ['mariage', 'wedding', 'wedding planner', 'traiteur mariage', 'cérémonie', 'fleuriste mariage', 'photographe mariage', 'salle de mariage', 'réception'],
      preset: `
DESIGN SYSTEM — Wedding / Mariage (light romantique, élégance) :
• Hero : FULLSCREEN — photo couple ou décoration florale h-screen, overlay blanc 20%, titre Playfair Display italic text-6xl blanc centré
• Fond : #fdfaf7 (blanc ivoire) · Accent : #be9b7b (champagne/rosé) · Secondaire : #d4a0a0 (rose nude)
• Surfaces : bg-white border border-rose-100 rounded-3xl shadow-sm
• Texte : text-stone-800 Playfair Display 600 italic titres, text-stone-500 Inter 300 corps
• Nav : fond blanc, logo fleuri, liens Playfair italic, CTA "Nous contacter"
• Photos : https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=800&h=600&fit=crop`,
    },
    {
      id: 'nightlife',
      keywords: ['boîte de nuit', 'nightclub', 'club', 'bar', 'concert', 'festival', 'DJ', 'soirée', 'spectacle', 'événement', 'after', 'rooftop', 'lounge', 'entertainment'],
      preset: `
DESIGN SYSTEM — Nightlife / Club (noir total, néons) :
• Hero : FULLSCREEN — photo scène/foule avec overlay noir 60%, titre Inter 900 UPPERCASE en gradient violet→rose→cyan text-7xl
• Fond : #000000 · Accent : dégradé from-violet-500 via-pink-500 to-cyan-400 · Secondaire : #f0abfc
• Surfaces : bg-white/5 border border-white/10 rounded-2xl backdrop-blur glassmorphism
• Texte : text-white Inter 900 titres, text-gray-400 corps
• Boutons : gradient violet→rose avec glow (box-shadow: 0 0 20px rgba(167,139,250,0.5))
• Nav : fond noir transparent → blur, logo typographique, "Réserver table" CTA gradient
• Photos : https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&h=600&fit=crop`,
    },
    {
      id: 'corporate-events',
      keywords: ['événementiel', 'organisateur', 'conférence', 'séminaire', 'incentive', 'team building', 'gala', 'salon professionnel', 'congrès', 'networking'],
      preset: `
DESIGN SYSTEM — Événementiel Corporate (dark bleu, professionnel) :
• Hero : SPLIT — chiffres clés (500+ événements, 50K+ participants) gauche, photo événement haut-de-gamme droite
• Fond : #0a0f1e · Accent : #6366f1 · Secondaire : #f59e0b
• Surfaces : bg-white/5 border border-indigo-900/50 rounded-xl backdrop-blur
• Texte : text-white Inter 800 titres, text-indigo-100 corps, stats text-5xl font-black text-indigo-400
• Photos : https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  CONSTRUCTION & TRADES                                                   ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  construction: [
    {
      id: 'btp-dark',
      keywords: ['BTP', 'construction', 'bâtiment', 'entreprise de construction', 'génie civil', 'maçon', 'charpentier', 'couvreur', 'plombier', 'électricien', 'artisan', 'travaux'],
      preset: `
DESIGN SYSTEM — BTP / Artisan (dark jaune chantier, force) :
• Hero : FULLSCREEN — photo chantier/réalisation avec overlay #111/70, titre Inter 900 UPPERCASE blanc text-6xl, badge jaune "Devis gratuit"
• Fond : #111111 · Accent : #f59e0b (jaune chantier) · Secondaire : #ffffff
• Surfaces : bg-[#1a1a1a] border border-yellow-900/50 rounded-xl
• Texte : text-white Inter 900 titres uppercase, text-gray-300 corps
• Stats : années d'expérience, chantiers réalisés, garantie — en text-5xl font-black text-yellow-400
• Nav : fond #111, logo avec icône outil, "Devis gratuit" CTA jaune
• Photos : https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop`,
    },
    {
      id: 'interior-design',
      keywords: ['architecte d\'intérieur', 'design d\'intérieur', 'décoration intérieure', 'aménagement', 'rénovation', 'home staging', 'feng shui', 'espace de vie'],
      preset: `
DESIGN SYSTEM — Design d'Intérieur (light éditorial, inspiration) :
• Hero : EDITORIAL — photo réalisation plein droite, titre "Repensons votre espace" Playfair 700 gauche
• Fond : #faf7f4 (blanc chaleureux) · Accent : #44403c (pierre foncée) · Secondaire : #d4a574
• Surfaces : bg-white border border-stone-200 rounded-2xl shadow-sm
• Texte : text-stone-900 Playfair Display 700 titres, text-stone-600 Inter corps
• Portfolio : grille avant/après, étiquettes "Salon", "Cuisine", "Chambre"
• Photos : https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  AUTOMOTIVE                                                              ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  automotive: [
    {
      id: 'dealership-dark',
      keywords: ['concession', 'concessionnaire', 'voiture', 'automobile', 'véhicule', 'moto', 'occasion', 'neuf', 'leasing', 'LOA', 'financement auto', 'garage'],
      preset: `
DESIGN SYSTEM — Concession Auto (dark premium, puissance) :
• Hero : FULLSCREEN — photo voiture de profil h-screen, overlay noir 50%, titre Inter 900 UPPERCASE blanc text-7xl
• Fond : #0a0a0a · Accent : #ef4444 (rouge sportif) · Secondaire : #ffffff
• Surfaces : bg-[#141414] border border-white/10 rounded-xl
• Texte : text-white Inter 900 uppercase titres, text-gray-400 corps, prix text-red-400 font-black
• Cards véhicules : image aspect-video, kilométrage, année, carburant, prix
• Nav : fond noir, logo rouge, "Configurer" CTA rouge
• Photos : https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop`,
    },
    {
      id: 'garage-bold',
      keywords: ['garage', 'mécanique', 'réparation', 'entretien', 'révision', 'pneu', 'carrosserie', 'contrôle technique', 'dépannage'],
      preset: `
DESIGN SYSTEM — Garage / Mécanique (bold noir-jaune, confiance) :
• Hero : SPLIT — liste de services + "Devis en 24h" gauche, photo mécano au travail droite
• Fond : #111111 · Accent : #f59e0b (jaune-orange) · Secondaire : #ffffff
• Surfaces : bg-[#1c1c1c] border border-yellow-900/30 rounded-xl
• Texte : text-white Inter 900 uppercase titres, text-gray-300 corps
• Badges services : rounded-full bg-yellow-500/20 text-yellow-300 font-bold
• Nav : fond noir, logo avec clé à molette, "Prendre RDV" jaune
• Photos : https://images.unsplash.com/photo-1632823471565-1ecdf5c6da36?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  TRAVEL & TOURISM                                                        ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  travel: [
    {
      id: 'luxury-travel',
      keywords: ['agence de voyage', 'voyages', 'séjour', 'circuit', 'croisière', 'hotel', 'hôtel', 'luxe', 'sur mesure', 'privatif', 'villa', 'resort'],
      preset: `
DESIGN SYSTEM — Agence de Voyage Luxe (dark cinématique) :
• Hero : FULLSCREEN — photo destination spectaculaire h-screen, overlay noir 40%, titre Playfair Display italic text-6xl blanc centré "Le monde comme vous ne l'avez jamais vu"
• Fond : #0a0a0a · Accent : #d4af70 (or voyage) · Secondaire : #ffffff
• Surfaces : bg-[#141414] border border-[#d4af70]/20 rounded-2xl
• Texte : text-white Playfair Display italic titres, text-gray-300 Inter corps
• Cards destinations : image plein card, overlay au hover avec prix et durée
• Nav : fond transparent → blur, logo Playfair, "Créer mon voyage" CTA or
• Photos : https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800&h=600&fit=crop`,
    },
    {
      id: 'adventure-bold',
      keywords: ['aventure', 'randonnée', 'trek', 'expédition', 'outdoor', 'nature', 'montagne', 'surf', 'kitesurf', 'plongée', 'escalade', 'sport', 'adrénaline'],
      preset: `
DESIGN SYSTEM — Aventure / Sports Outdoor (dark vert forêt, adrénaline) :
• Hero : FULLSCREEN — photo action/nature spectaculaire, overlay from-black/60 to-transparent, titre Inter 900 UPPERCASE text-7xl blanc en bas à gauche
• Fond : #0a1208 · Accent : #22c55e (vert vif) · Secondaire : #f59e0b
• Surfaces : bg-[#0f1a0e] border border-green-800/50 rounded-xl
• Texte : text-white Inter 900 uppercase titres, text-green-100 corps
• Cards activités : image + badge "Niveau", durée, prix
• Nav : fond transparent → backdrop-blur, logo avec montagne, "Réserver" vert vif
• Photos : https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1539108136310-43e4f4b9bd59?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  NGO & PUBLIC SECTOR                                                     ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  ngo: [
    {
      id: 'association',
      keywords: ['association', 'ONG', 'fondation', 'bénévolat', 'don', 'solidarité', 'humanitaire', 'caritatif', 'cause', 'engagement', 'impact', 'social'],
      preset: `
DESIGN SYSTEM — Association / ONG (light engagé, chaleureux) :
• Hero : FULLSCREEN — photo terrain/impact h-screen, overlay from-orange-900/50, titre Inter 900 blanc centré, compteur de dons en temps réel
• Fond : #ffffff · Accent : #f97316 (orange énergie) · Secondaire : #10b981
• Surfaces : bg-orange-50 border border-orange-100 rounded-2xl shadow-sm
• Texte : text-stone-900 Inter 700 titres, text-stone-600 corps
• CTA principal : "Faire un don" orange proéminent, toujours visible
• Nav : fond blanc, logo avec icône cœur/main, "Faire un don" bouton orange
• Photos : https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop | https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=600&fit=crop`,
    },
    {
      id: 'municipality',
      keywords: ['mairie', 'commune', 'municipalité', 'collectivité', 'service public', 'administration', 'citoyen', 'ville', 'quartier', 'communauté', 'intercommunalité'],
      preset: `
DESIGN SYSTEM — Mairie / Collectivité (light institutionnel) :
• Hero : EDITORIAL — photo commune à gauche, titre institutionnel + "Services en ligne" à droite
• Fond : #ffffff · Accent : #1d4ed8 (bleu public) · Secondaire : #064e3b (vert)
• Surfaces : bg-blue-50 border border-blue-100 rounded-lg shadow-sm
• Texte : text-blue-900 Inter 700 titres, text-blue-700 corps
• Cartes services : icône + titre + description, grid 3 colonnes
• Nav : fond blanc border-b border-blue-200, armoirie + nom commune, liens services clés
• Photos : https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  MEDIA & CONTENT                                                         ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  media: [
    {
      id: 'editorial-light',
      keywords: ['blog', 'magazine', 'média', 'journal', 'actualité', 'culture', 'lifestyle', 'podcast', 'newsletter'],
      preset: `
DESIGN SYSTEM — Blog / Magazine Éditorial (light lecture) :
• Hero : EDITORIAL — titre featured article très grand, catégorie en rouge, image à droite
• Fond : #ffffff · Accent : #1c1917 · Tags : #dc2626 ou #7c3aed
• Surfaces : bg-white, séparateurs border-t border-stone-200
• Texte : text-stone-900 Playfair Display titres, text-stone-700 Inter corps leading-relaxed
• Photos : https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=500&fit=crop`,
    },
    {
      id: 'dark-media',
      keywords: ['streaming', 'vidéo', 'YouTube', 'twitch', 'influencer', 'contenu', 'creator', 'chaîne', 'podcast dark'],
      preset: `
DESIGN SYSTEM — Creator / Média Dark (noir, accent vif) :
• Hero : TYPO-GIANT — fond noir, titre Inter 900 text-8xl en gradient rouge→orange, sous-titre gris, thumbnail featured en dessous
• Fond : #0a0a0a · Accent : #ef4444 (rouge YouTube-like) · Secondaire : #f97316
• Surfaces : bg-[#161616] border border-white/10 rounded-xl
• Texte : text-white Inter 900 titres, text-gray-400 corps
• Grid épisodes : thumbnail + titre + date, badge "Nouveau" rouge
• Nav : fond noir, logo rouge, "S'abonner" CTA rouge
• Photos : https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop`,
    },
  ],

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  FALLBACK — Generic Landing Page                                         ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  landing: [
    {
      id: 'violet-startup',
      keywords: [],
      preset: `
DESIGN SYSTEM — Landing Page Générique (dark violet/rose, conversion) :
• Hero : CENTRÉ — badge "✦ Nouveau" → titre gradient violet→rose text-5xl → CTA → chiffres
• Fond : #0f0f13 · Accent : dégradé #7c3aed→#ec4899 · Secondaire : #f59e0b
• Surfaces : bg-white/5 border border-white/10 rounded-2xl backdrop-blur
• Texte : text-white Inter 800 titres, text-gray-300 corps
• Photos : https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&h=1080&fit=crop | https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop`,
    },
  ],
}

// ─── Variant picker — industry detection + keyword scoring ────────────────────

// Maps siteType strings → DESIGN_VARIANTS keys
const INDUSTRY_MAP: Array<{ keys: string[]; category: string }> = [
  { keys: ['restaurant', 'gastronomique', 'brasserie', 'bistro', 'bistrot', 'food', 'cafe', 'traiteur', 'catering', 'hotel', 'hôtel'],       category: 'food_fine' },
  { keys: ['bakery', 'boulangerie', 'pâtisserie', 'patisserie', 'pastry'],                                                                    category: 'bakery' },
  { keys: ['bar', 'cocktail', 'nightclub', 'club', 'concert', 'festival', 'events', 'événementiel', 'mariage', 'wedding'],                    category: 'events' },
  { keys: ['finance', 'fintech', 'banque', 'bank', 'assurance', 'insurance', 'comptable', 'audit', 'trading', 'investissement'],              category: 'finance' },
  { keys: ['avocat', 'notaire', 'legal', 'juridique', 'droit', 'law'],                                                                       category: 'legal' },
  { keys: ['médecin', 'clinique', 'clinic', 'hospital', 'dental', 'dentiste', 'pharmacie', 'medical', 'santé', 'health', 'kiné', 'ostéo'],    category: 'medical' },
  { keys: ['spa', 'wellness', 'yoga', 'massage', 'bien-être', 'beauty', 'beauté', 'coiffeur', 'barbershop', 'salon'],                        category: 'wellness' },
  { keys: ['shop', 'store', 'boutique', 'ecommerce', 'retail', 'mode', 'fashion', 'luxe', 'jewelry', 'bijoux'],                              category: 'retail' },
  { keys: ['immobilier', 'realestate', 'architecte', 'architecture', 'agence immobilière', 'promoteur'],                                     category: 'realestate' },
  { keys: ['saas', 'tech', 'app', 'api', 'developer', 'startup', 'digital', 'agence web', 'agence digitale'],                                category: 'tech' },
  { keys: ['portfolio', 'creative', 'créatif', 'designer', 'photographe', 'artiste'],                                                        category: 'creative' },
  { keys: ['agriculture', 'ferme', 'farm', 'vigne', 'vignoble', 'wine', 'producteur', 'bio'],                                                category: 'agriculture' },
  { keys: ['éducation', 'education', 'école', 'school', 'université', 'formation', 'e-learning'],                                            category: 'education' },
  { keys: ['défense', 'defense', 'cybersécurité', 'cybersecurity', 'sécurité', 'security', 'militaire'],                                     category: 'defense' },
  { keys: ['construction', 'btp', 'bâtiment', 'artisan', 'travaux', 'rénovation', 'garage', 'mécanique', 'intérieur'],                       category: 'construction' },
  { keys: ['auto', 'automobile', 'voiture', 'moto', 'concession', 'garage', 'automotive'],                                                   category: 'automotive' },
  { keys: ['voyage', 'travel', 'tourisme', 'tourism', 'hôtel', 'hotel', 'aventure', 'outdoor'],                                              category: 'travel' },
  { keys: ['ong', 'ngo', 'association', 'fondation', 'mairie', 'commune', 'solidarité', 'charity'],                                          category: 'ngo' },
  { keys: ['blog', 'magazine', 'média', 'media', 'podcast', 'streaming', 'creator'],                                                         category: 'media' },
]

export function getDesignPresetForManifest(siteType?: string, userMessage?: string): string {
  return getDesignPreset(siteType, userMessage)
}

function getDesignPreset(siteType?: string, userMessage?: string): string {
  const combined = ((siteType || '') + ' ' + (userMessage || '')).toLowerCase()

  // Detect industry from combined text
  let category = 'landing'
  let bestMatchCount = 0
  for (const { keys, category: cat } of INDUSTRY_MAP) {
    const count = keys.reduce((n, k) => n + (combined.includes(k) ? 1 : 0), 0)
    if (count > bestMatchCount) { bestMatchCount = count; category = cat }
  }

  const variants = DESIGN_VARIANTS[category] ?? DESIGN_VARIANTS.landing
  if (variants.length === 1) return variants[0].preset

  // Score variants by keyword match in combined text
  let best = variants[0]
  let bestScore = 0
  for (const v of variants) {
    const score = v.keywords.reduce((n, kw) => n + (combined.includes(kw) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; best = v }
  }
  return best.preset
}

// ─── Sequential generation types ─────────────────────────────────────────────

export type DesignTokens = {
  mode:        'dark' | 'light'
  bg:          string   // page background
  surface:     string   // card / panel bg
  accent:      string   // primary CTA color
  accentHover: string
  headingText: string
  bodyText:    string
  mutedText:   string
  border:      string
  headingFont: 'Playfair Display' | 'Inter'
  radius:      string   // e.g. "rounded-2xl"
  tone:        string   // e.g. "luxurious, warm, Michelin"
}

export type SectionSpec = {
  id:        string   // "hero"
  component: string   // "HeroSection"
  spec:      string   // natural language description
}

export type SiteManifest = {
  businessName: string
  industry:     string
  design:       DesignTokens
  sections:     SectionSpec[]
  unsplashUrls: string[]   // validated URLs from the design preset
}

// ─── Manifest tool ────────────────────────────────────────────────────────────

export const MANIFEST_TOOL: Anthropic.Tool = {
  name: 'create_manifest',
  description: 'Creates the complete design manifest and ordered section plan for the site.',
  input_schema: {
    type: 'object' as const,
    properties: {
      businessName: { type: 'string' },
      industry:     { type: 'string' },
      design: {
        type: 'object' as const,
        properties: {
          mode:        { type: 'string', enum: ['dark', 'light'] },
          bg:          { type: 'string', description: 'CSS hex — page background' },
          surface:     { type: 'string', description: 'CSS hex — card/panel background' },
          accent:      { type: 'string', description: 'CSS hex — primary CTA color' },
          accentHover: { type: 'string', description: 'CSS hex — hover state of accent' },
          headingText: { type: 'string', description: 'CSS hex — heading text color' },
          bodyText:    { type: 'string', description: 'CSS hex — body text color' },
          mutedText:   { type: 'string', description: 'CSS hex — secondary/muted text' },
          border:      { type: 'string', description: 'Tailwind border class, e.g. border-white/10' },
          headingFont: { type: 'string', enum: ['Playfair Display', 'Inter'] },
          radius:      { type: 'string', description: 'Tailwind radius class, e.g. rounded-2xl' },
          tone:        { type: 'string', description: '3 adjectives describing the visual style' },
        },
        required: ['mode','bg','surface','accent','accentHover','headingText','bodyText','mutedText','border','headingFont','radius','tone'],
      },
      sections: {
        type: 'array' as const,
        description: 'Ordered list of sections. Typically starts with NavSection and ends with FooterSection, but omit them if the design concept calls for a full-screen or immersive layout with no traditional nav. 5-8 total.',
        items: {
          type: 'object' as const,
          properties: {
            id:        { type: 'string' },
            component: { type: 'string', description: 'PascalCase component name, e.g. HeroSection' },
            spec:      { type: 'string', description: '1-2 sentences: layout, content, and purpose of this section' },
          },
          required: ['id', 'component', 'spec'],
        },
      },
      unsplashUrls: {
        type: 'array' as const,
        description: 'List of Unsplash URLs to use across all sections',
        items: { type: 'string' },
      },
    },
    required: ['businessName', 'industry', 'design', 'sections', 'unsplashUrls'],
  },
}

// ─── Section tool ─────────────────────────────────────────────────────────────

export const SECTION_TOOL: Anthropic.Tool = {
  name: 'write_section',
  description: 'Writes a single React section component.',
  input_schema: {
    type: 'object' as const,
    properties: {
      code: { type: 'string', description: 'Complete React component code for this section only.' },
    },
    required: ['code'],
  },
}

// ─── Manifest system prompt ───────────────────────────────────────────────────

export function buildManifestPrompt(designPreset: string, templateContext = ''): string {
  return `Tu es un expert en design de sites web. Tu analyses une demande et produis un manifest complet.

${designPreset}
${templateContext}
RÈGLES :
- businessName : extrait ou déduis le nom exact du business depuis la demande
- industry : catégorie courte en anglais (restaurant, saas, medical, etc.)
- design : respecte STRICTEMENT les valeurs du design system ci-dessus — couleurs, typographie, radius
- tone : 3 adjectifs décrivant précisément le style visuel (ex: "luxurieux, chaleureux, gastronomique")
- sections : 5 à 8 sections adaptées au type de business
  → NavSection en premier et FooterSection en dernier dans la plupart des cas
  → Pour les designs immersifs / full-screen / TYPO-GIANT, tu peux omettre la nav classique et utiliser une approche différente (logo flottant, sidebar, etc.)
  → spec : décrit précisément le layout (SPLIT/FULLSCREEN/EDITORIAL/BENTO/TYPO-GIANT), le contenu, et l'objectif
  → Choisis les sections les plus pertinentes pour CE business — pas une liste générique
- unsplashUrls : utilise les URLs validées du design system ci-dessus

Appelle create_manifest avec le manifest complet.`
}

// ─── Section system prompt ────────────────────────────────────────────────────

export function buildSectionPrompt(
  manifest:      SiteManifest,
  section:       SectionSpec,
  previousCode:  string,
  formEndpoint:  string | null,
  syntaxError?:  string | null,
): string {
  const d = manifest.design
  const photosLine = manifest.unsplashUrls.length > 0
    ? `Photos Unsplash : ${manifest.unsplashUrls.join(' | ')}`
    : ''

  return `Tu es un expert React/Tailwind. Tu écris UNE SEULE section : ${section.component}.

━━ DESIGN SYSTEM (ne jamais dévier de ces valeurs) ━━
Mode          : ${d.mode}
Fond page     : ${d.bg}
Fond surfaces : ${d.surface}
Accent        : ${d.accent}  (hover: ${d.accentHover})
Texte titres  : ${d.headingText}
Texte corps   : ${d.bodyText}
Texte muted   : ${d.mutedText}
Bordures      : ${d.border}
Police titres : ${d.headingFont}
Police corps  : Inter
Border radius : ${d.radius}
Ton visuel    : ${d.tone}
${photosLine}

━━ SITE ━━
Business : ${manifest.businessName}
Industrie : ${manifest.industry}

━━ SPEC DE CETTE SECTION ━━
${section.spec}

${previousCode ? `━━ SECTIONS DÉJÀ ÉCRITES (copie exactement leur style — mêmes couleurs hex, même espacement, même cohérence) ━━
\`\`\`tsx
${previousCode}
\`\`\`` : ''}

${formEndpoint && (section.id === 'contact' || section.id === 'reservation' || section.id === 'booking') ? `━━ FORMULAIRE ━━
Utilise exactement : fetch('${formEndpoint}', { method: 'POST', ... })` : ''}

━━ RÈGLES ABSOLUES ━━
1. Exporte UNIQUEMENT : export function ${section.component}() { ... }
2. PAS de default export — PAS d'autres exports
3. Imports autorisés : import { useState, useEffect, useRef } from 'react' et/ou import { IconName } from 'lucide-react'
4. Tailwind uniquement pour le style (valeurs arbitraires autorisées ex: bg-[${d.bg}])
5. Max 180 lignes — utilise des tableaux inline pour les données répétées
6. Contenu 100% réaliste et spécifique à ${manifest.businessName} — jamais Lorem Ipsum
7. Avatars témoignages : https://i.pravatar.cc/80?img=[1-70]
8. Sections spacieuses : py-20 minimum
9. Responsive : 1 colonne mobile, 2-3 colonnes desktop

${syntaxError ? `━━ ERREUR DE SYNTAXE À CORRIGER (tentative précédente rejetée) ━━
${syntaxError}

⚠️  Le code ci-dessus a été REJETÉ par le parser. Réécris ${section.component} en corrigeant cette erreur.
Causes fréquentes : apostrophes dans des strings single-quotées (utilise des backticks \`...\` ou échappe avec \\'), virgules manquantes, JSX mal fermé.
` : ''}Appelle write_section avec le code complet de ${section.component}.`
}

// ─── Section assembler ────────────────────────────────────────────────────────
// Merges individual section components into a single valid App.tsx

export function assembleSections(
  completedSections: Array<{ component: string; code: string }>,
): string {
  if (completedSections.length === 0) return ''

  const reactNames  = new Set<string>()
  const lucideNames = new Set<string>()
  const codeBlocks: string[] = []

  for (const { code } of completedSections) {
    const lines = code.split('\n')
    const body: string[] = []

    for (const line of lines) {
      const t = line.trim()
      if (t.startsWith('import') && (t.includes("'react'") || t.includes('"react"'))) {
        const m = t.match(/\{([^}]+)\}/)
        if (m) m[1].split(',').forEach(s => reactNames.add(s.trim()))
      } else if (t.startsWith('import') && t.includes('lucide')) {
        const m = t.match(/\{([^}]+)\}/)
        if (m) m[1].split(',').forEach(s => lucideNames.add(s.trim()))
      } else if (t === '') {
        // keep blank lines but collapse runs
        if (body.length > 0 && body[body.length - 1] !== '') body.push('')
      } else {
        // strip leading "export" so the function is not re-exported
        body.push(line.replace(/^export\s+(function|const)\s+/, '$1 '))
      }
    }
    codeBlocks.push(body.join('\n').trimEnd())
  }

  const imports: string[] = []
  if (reactNames.size  > 0) imports.push(`import { ${[...reactNames].join(', ')} } from 'react'`)
  if (lucideNames.size > 0) imports.push(`import { ${[...lucideNames].join(', ')} } from 'lucide-react'`)

  const appBody = completedSections
    .map(s => `      <${s.component} />`)
    .join('\n')

  return [
    ...imports,
    '',
    codeBlocks.join('\n\n'),
    '',
    'export default function App() {',
    '  return (',
    '    <div>',
    appBody,
    '    </div>',
    '  )',
    '}',
  ].join('\n')
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

  {
    name: 'remove_section',
    description: `Removes an entire named section component from the site.
Use when the user wants to delete a specific section (FAQ, gallery, testimonials, pricing, etc.).
Automatically removes BOTH the function definition AND its JSX usage in App().
Much faster than write_code for deletions — use this instead.`,
    input_schema: {
      type: 'object',
      properties: {
        component: {
          type: 'string',
          description: 'Exact function name of the component to remove (e.g. "TestimonialsSection", "FaqSection", "PricingSection")',
        },
        note: { type: 'string', description: 'One-sentence summary of what was removed.' },
      },
      required: ['component', 'note'],
    },
  },

  {
    name: 'add_section',
    description: `Adds a new section to the site without rewriting the whole file.
Write ONLY the new component code (50–150 lines). It will be inserted before or after the specified anchor component in App().
Use for adding FAQ, pricing, gallery, features, CTA, newsletter sections, etc.
Much faster than write_code for additions — use this instead.`,
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Complete TSX for the new section component. Must be a named function: function NewSection() { return <section>...</section> }. No imports needed.',
        },
        anchor: {
          type: 'string',
          description: 'Component name to insert near (e.g. "FooterSection"). The new section will be inserted before/after its JSX usage in App().',
        },
        position: {
          type: 'string',
          enum: ['before', 'after'],
          description: 'Whether to insert before or after the anchor component',
        },
        note: { type: 'string', description: 'One-sentence summary of what was added.' },
      },
      required: ['code', 'anchor', 'position', 'note'],
    },
  },

  {
    name: 'scrape_website',
    description: `Scrapes an external website and returns its content, structure, and design metadata.
Use when the user wants to:
- Copy or replicate a website ("fais un site comme ça", "copie ce site", "inspire-toi de X")
- Import content or branding from a URL
- Use an existing site as a visual or structural reference

Returns: title, nav links, headings, CTA texts, body content, color palette, fonts, and cleaned HTML.
After scraping, use write_code to create a similar site inspired by the data.
If the site cannot be scraped (blocked, offline, invalid URL), the error is explained to the user.`,
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Full URL to scrape, e.g. https://example.com. Will add https:// automatically if missing.',
        },
      },
      required: ['url'],
    },
  },

  {
    name: 'search_unsplash',
    description: `Searches Unsplash for relevant photos and returns their direct CDN URLs.
Use BEFORE swapping images with edit_code to get contextually correct photos.
Returns high-quality landscape URLs ready to paste into src attributes.
Example: to replace generic food photos, search "italian restaurant pasta interior".`,
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'English search query. Be specific for better results (e.g. "yoga studio sunrise stretch" not just "yoga")',
        },
        count: {
          type: 'number',
          description: 'Number of photos to return, between 1 and 6. Default: 4',
        },
      },
      required: ['query'],
    },
  },
]

// ─── System prompt ────────────────────────────────────────────────────────────

export function buildAgentSystemPrompt(currentCode: string, siteType?: string, siteId?: string, userMessage?: string): string {
  const designPreset = getDesignPreset(siteType, userMessage)
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
CHOIX D'OUTIL — préfère toujours l'outil le plus ciblé :
→ write_code    : création initiale, refonte complète, changement de thème global, restructuration majeure
→ edit_code     : texte, couleurs, ajustements visuels, swapper des URLs d'images
→ remove_section: supprimer une section entière (ex: "enlève la FAQ") → BEAUCOUP plus rapide que write_code
→ add_section   : ajouter une nouvelle section sans réécrire le site → BEAUCOUP plus rapide que write_code
→ search_unsplash : trouver de vraies photos contextuelles, puis les placer avec edit_code
→ scrape_website  : quand l'utilisateur dit "copie ce site" ou donne une URL de référence — scrape d'abord, puis write_code
→ ask_user        : seulement si vraiment impossible de deviner — préfère une décision créative

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

// Helper: remove a named function's full body from code (brace-counting)
function removeFunctionBody(code: string, name: string): string {
  const fnRegex = new RegExp(`\\n(?:export )?function ${name}[\\s(]`)
  const fnMatch = fnRegex.exec(code)
  if (!fnMatch) return code
  let depth = 0, i = fnMatch.index, foundOpen = false
  while (i < code.length) {
    if (code[i] === '{') { depth++; foundOpen = true }
    if (code[i] === '}') { depth-- }
    if (foundOpen && depth === 0) {
      return code.slice(0, fnMatch.index) + code.slice(i + 1)
    }
    i++
  }
  return code
}

export async function executeTool(
  toolName: string,
  toolInput: Record<string, any>,
  currentCode: string,
): Promise<{ code?: string; note?: string; askQuestion?: string; askOptions?: string[]; error?: string; info?: string }> {
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

      case 'remove_section': {
        const component = toolInput.component as string
        if (!component) return { error: 'Nom du composant manquant' }
        if (!currentCode) return { error: 'Pas de code existant' }

        let result = removeFunctionBody(currentCode, component)

        // Remove self-closing JSX usage: <Component /> or <Component prop={...} />
        result = result.replace(new RegExp(`[ \t]*<${component}[^>]*/>\n?`, 'g'), '')
        // Remove paired JSX usage: <Component>...</Component>
        result = result.replace(new RegExp(`[ \t]*<${component}[^>]*>[\\s\\S]*?</${component}>\n?`, 'g'), '')

        if (result === currentCode) {
          return { error: `Composant "${component}" introuvable dans le code. Vérifie le nom exact.` }
        }
        return { code: result, note: toolInput.note }
      }

      case 'add_section': {
        const sectionCode = (toolInput.code as string)?.trim()
        const anchor      = toolInput.anchor as string
        const position    = (toolInput.position as 'before' | 'after') ?? 'before'
        if (!sectionCode) return { error: 'code requis' }
        if (!anchor)      return { error: 'anchor requis' }
        if (!currentCode) return { error: 'Pas de code existant' }

        // Extract new component name from the provided code
        const nameMatch = /function\s+(\w+)\s*[(<]/.exec(sectionCode)
        if (!nameMatch) return { error: 'Le code doit contenir une fonction nommée, ex: function NewSection() {...}' }
        const newName = nameMatch[1]

        // Insert component code just before `export default function App(`
        const appMarker = '\nexport default function App('
        const appIdx = currentCode.indexOf(appMarker)
        if (appIdx === -1) return { error: 'export default function App() introuvable dans le code' }

        let result = currentCode.slice(0, appIdx) + '\n\n' + sectionCode + currentCode.slice(appIdx)

        // Find anchor JSX usage in the (now updated) App return and insert new component tag
        const anchorTag   = `<${anchor}`
        const anchorIdx   = result.indexOf(anchorTag, appIdx)
        if (anchorIdx === -1) return { error: `Anchor "${anchor}" introuvable dans le JSX de App()` }

        const newJSX = `\n              <${newName} />`
        if (position === 'before') {
          result = result.slice(0, anchorIdx) + newJSX + '\n              ' + result.slice(anchorIdx)
        } else {
          // Find the end of the anchor tag (self-close or closing tag line)
          const lines = result.split('\n')
          // Find the line index from position
          let offset = 0
          let insertAfterLine = -1
          for (let li = 0; li < lines.length; li++) {
            if (offset + lines[li].length >= anchorIdx) {
              // Walk forward from this line to find "/> " or closing tag
              for (let lj = li; lj < Math.min(li + 20, lines.length); lj++) {
                if (lines[lj].includes('/>') || lines[lj].includes(`</${anchor}>`)) {
                  insertAfterLine = lj
                  break
                }
              }
              if (insertAfterLine === -1) insertAfterLine = li
              break
            }
            offset += lines[li].length + 1
          }
          if (insertAfterLine === -1) insertAfterLine = lines.findIndex(l => l.includes(anchorTag))
          lines.splice(insertAfterLine + 1, 0, `              <${newName} />`)
          result = lines.join('\n')
        }

        return { code: result, note: toolInput.note }
      }

      case 'scrape_website': {
        const url = (toolInput.url as string)?.trim()
        if (!url) return { error: 'URL manquante' }
        try { new URL(url.startsWith('http') ? url : `https://${url}`) } catch {
          return { error: `URL invalide : "${url}"` }
        }

        const result = await scrapeUrl(url)
        if (!result.ok) {
          return { error: `Impossible de scraper ${url} : ${result.error}` }
        }

        const formatted = formatScrapeForAgent(result, url)
        return {
          info: `${formatted}\n\n─────\nScraping terminé. Utilise write_code pour recréer ce site en t'inspirant du contenu, des titres, des couleurs et de la structure ci-dessus.`,
        }
      }

      case 'search_unsplash': {
        const query      = toolInput.query as string
        const count      = Math.min(Math.max(Number(toolInput.count ?? 4), 1), 6)
        const accessKey  = process.env.UNSPLASH_ACCESS_KEY

        if (!accessKey) {
          return { info: `Clé Unsplash non configurée (UNSPLASH_ACCESS_KEY). Utilise les URLs du design system déjà fournies, ou demande à l'utilisateur de configurer la clé.` }
        }

        const resp = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${accessKey}` } }
        )
        if (!resp.ok) return { error: `Unsplash API error ${resp.status}` }

        const data = await resp.json() as { results: Array<{ urls: { raw: string }; alt_description: string }> }
        const photos = data.results ?? []
        if (photos.length === 0) return { error: `Aucune photo trouvée pour "${query}"` }

        const lines = photos.map((p, i) => {
          const url = `${p.urls.raw}&w=1200&h=800&fit=crop&q=80`
          return `${i + 1}. ${url}${p.alt_description ? `  ← ${p.alt_description}` : ''}`
        })

        return {
          info: `Photos Unsplash pour "${query}" :\n${lines.join('\n')}\n\nUtilise edit_code pour remplacer les URLs existantes dans le code.`,
        }
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
    case 'scrape_website':
      return { icon: '🌐', label: `Scraping : ${input.url}` }
    case 'remove_section':
      return { icon: '🗑️', label: `Suppression : ${input.component || 'section'}` }
    case 'add_section':
      return { icon: '➕', label: `Ajout section : ${input.note || input.component || 'nouvelle section'}` }
    case 'search_unsplash':
      return { icon: '🖼️', label: `Recherche photos : "${input.query}"` }
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
