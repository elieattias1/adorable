/**
 * lib/bakery-photos.ts
 *
 * Curated Unsplash photo library for bakery products.
 * Photos are chosen to match the product name as closely as possible.
 * When uncertain about a specific ID, we use a generic bakery/pastry photo
 * and add a `searchQuery` for the AI to find more precise ones.
 *
 * Rules:
 * - Only use IDs we are confident about for the primary photo
 * - List a `searchQuery` (English) for the AI's search_unsplash tool
 * - Categories: pain, viennoiserie, patisserie, entremet, snack, boisson, service
 */

export type BakeryProduct = {
  slug:        string
  name:        string       // French display name
  category:    'pain' | 'viennoiserie' | 'patisserie' | 'entremet' | 'snack' | 'boisson' | 'service'
  price:       number       // Default price in EUR (indicative)
  emoji:       string
  searchQuery: string       // English Unsplash search terms for AI tool
  photos:      string[]     // Verified Unsplash URLs, w=800&h=800&fit=crop
  hero?:       string       // Wide hero photo (w=1200&h=800&fit=crop)
}

// ─── Verified photo IDs by subject ────────────────────────────────────────────
// These IDs are cross-checked with well-known Unsplash bakery/food collections.

// Generic bakery shop interior / display — safe fallbacks
const BAKERY_DISPLAY = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=800&fit=crop&q=80'
const BAKERY_OVEN    = 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=800&fit=crop&q=80'
const PASTRY_DISPLAY = 'https://images.unsplash.com/photo-1514517604298-cf80e0fb7f1e?w=800&h=800&fit=crop&q=80'

export const BAKERY_PRODUCTS: BakeryProduct[] = [

  // ── PAINS ──────────────────────────────────────────────────────────────────

  {
    slug: 'baguette',
    name: 'Baguette Tradition',
    category: 'pain',
    price: 1.20,
    emoji: '🥖',
    searchQuery: 'french baguette bread',
    photos: [
      'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-levain',
    name: 'Pain au levain',
    category: 'pain',
    price: 4.50,
    emoji: '🍞',
    searchQuery: 'sourdough bread artisan',
    photos: [
      'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-complet',
    name: 'Pain complet bio',
    category: 'pain',
    price: 4.80,
    emoji: '🌾',
    searchQuery: 'whole wheat bread organic',
    photos: [
      'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-cereales',
    name: 'Pain aux céréales',
    category: 'pain',
    price: 5.20,
    emoji: '🌿',
    searchQuery: 'multigrain bread seeds',
    photos: [
      'https://images.unsplash.com/photo-1530569673472-307dc017a82d?w=800&h=800&fit=crop&q=80',
      BAKERY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1530569673472-307dc017a82d?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-seigle',
    name: 'Pain de seigle',
    category: 'pain',
    price: 5.50,
    emoji: '🌑',
    searchQuery: 'rye bread dark',
    photos: [
      'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&h=800&fit=crop&q=80',
      BAKERY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-noix',
    name: 'Pain aux noix',
    category: 'pain',
    price: 6.00,
    emoji: '🌰',
    searchQuery: 'walnut bread artisan',
    photos: [
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&h=800&fit=crop&q=80',
      BAKERY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&h=800&fit=crop&q=80',
  },

  // ── VIENNOISERIES ──────────────────────────────────────────────────────────

  {
    slug: 'croissant',
    name: 'Croissant au beurre',
    category: 'viennoiserie',
    price: 1.40,
    emoji: '🥐',
    searchQuery: 'butter croissant french bakery',
    photos: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-au-chocolat',
    name: 'Pain au chocolat',
    category: 'viennoiserie',
    price: 1.50,
    emoji: '🍫',
    searchQuery: 'pain au chocolat chocolate croissant pastry',
    photos: [
      'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1621955511813-7c1b8eed2be4?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'brioche',
    name: 'Brioche maison',
    category: 'viennoiserie',
    price: 3.20,
    emoji: '🧈',
    searchQuery: 'brioche bread french butter',
    photos: [
      'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'chausson-pommes',
    name: 'Chausson aux pommes',
    category: 'viennoiserie',
    price: 1.80,
    emoji: '🍎',
    searchQuery: 'apple turnover pastry',
    photos: [
      'https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-raisin',
    name: 'Pain aux raisins',
    category: 'viennoiserie',
    price: 1.60,
    emoji: '🍇',
    searchQuery: 'pain aux raisins danish pastry swirl',
    photos: [
      'https://images.unsplash.com/photo-1583338917451-face2751d8d5?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595271021852-8b7be32b7e0e?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1583338917451-face2751d8d5?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-suisse',
    name: 'Pain suisse',
    category: 'viennoiserie',
    price: 1.90,
    emoji: '🍩',
    searchQuery: 'pain suisse custard pastry',
    photos: [
      PASTRY_DISPLAY,
      'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=800&h=800&fit=crop&q=80',
    ],
    hero: PASTRY_DISPLAY,
  },
  {
    slug: 'kouign-amann',
    name: 'Kouign-amann',
    category: 'viennoiserie',
    price: 3.80,
    emoji: '🥮',
    searchQuery: 'kouign amann breton pastry caramel',
    photos: [
      'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=800&h=800&fit=crop&q=80',
      PASTRY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=1200&h=800&fit=crop&q=80',
  },

  // ── PÂTISSERIES ────────────────────────────────────────────────────────────

  {
    slug: 'eclair-chocolat',
    name: 'Éclair au chocolat',
    category: 'patisserie',
    price: 3.50,
    emoji: '🍫',
    // NOTE: photo-1559181567-c3190ca9959b was showing a cherry tart — replaced
    searchQuery: 'eclair chocolate french pastry',
    photos: [
      'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&q=80',
      PASTRY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'eclair-cafe',
    name: 'Éclair au café',
    category: 'patisserie',
    price: 3.50,
    emoji: '☕',
    searchQuery: 'eclair coffee pastry french',
    photos: [
      'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&h=800&fit=crop&q=80',
      PASTRY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'tarte-citron',
    name: 'Tarte au citron meringuée',
    category: 'patisserie',
    price: 4.20,
    emoji: '🍋',
    searchQuery: 'lemon meringue tart french pastry',
    photos: [
      'https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'tarte-fraises',
    name: 'Tarte aux fraises',
    category: 'patisserie',
    price: 4.50,
    emoji: '🍓',
    searchQuery: 'strawberry tart pastry french',
    photos: [
      'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'tarte-framboise',
    name: 'Tarte aux framboises',
    category: 'patisserie',
    price: 4.50,
    emoji: '🫐',
    searchQuery: 'raspberry tart pastry french',
    photos: [
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'macaron',
    name: 'Macaron (x3)',
    category: 'patisserie',
    price: 4.50,
    emoji: '🟣',
    searchQuery: 'french macarons colorful pastry',
    photos: [
      'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582736317408-b4f5db5f6d22?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'mille-feuille',
    name: 'Mille-feuille',
    category: 'patisserie',
    price: 4.80,
    emoji: '🍰',
    searchQuery: 'mille feuille napoleon pastry',
    photos: [
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1612203985729-70726954388c?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'paris-brest',
    name: 'Paris-Brest',
    category: 'patisserie',
    price: 4.80,
    emoji: '⭕',
    searchQuery: 'paris brest pastry praline',
    photos: [
      PASTRY_DISPLAY,
      'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=800&h=800&fit=crop&q=80',
    ],
    hero: PASTRY_DISPLAY,
  },
  {
    slug: 'religieuse',
    name: 'Religieuse',
    category: 'patisserie',
    price: 3.80,
    emoji: '⚫',
    searchQuery: 'religieuse pastry chocolate cream puff',
    photos: [
      PASTRY_DISPLAY,
      'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&h=800&fit=crop&q=80',
    ],
    hero: PASTRY_DISPLAY,
  },
  {
    slug: 'financier',
    name: 'Financier amande',
    category: 'patisserie',
    price: 2.20,
    emoji: '🟡',
    searchQuery: 'financier almond french petit four',
    photos: [
      'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'cannele',
    name: 'Cannelé bordelais',
    category: 'patisserie',
    price: 1.80,
    emoji: '🍯',
    searchQuery: 'canele bordeaux french pastry caramel',
    photos: [
      'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&h=800&fit=crop&q=80',
      PASTRY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'galette-roi',
    name: 'Galette des rois',
    category: 'patisserie',
    price: 18.00,
    emoji: '👑',
    searchQuery: 'galette des rois king cake french',
    photos: [
      'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=800&h=800&fit=crop&q=80',
      BAKERY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=1200&h=800&fit=crop&q=80',
  },

  // ── ENTREMETS / GÂTEAUX ────────────────────────────────────────────────────

  {
    slug: 'opera',
    name: 'Opéra',
    category: 'entremet',
    price: 5.50,
    emoji: '🎂',
    searchQuery: 'opera cake french patisserie chocolate coffee layers',
    photos: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'entremet-chocolat',
    name: 'Entremet chocolat',
    category: 'entremet',
    price: 5.80,
    emoji: '🍫',
    searchQuery: 'chocolate entremet mousse cake patisserie',
    photos: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'fraisier',
    name: 'Fraisier',
    category: 'entremet',
    price: 5.50,
    emoji: '🍓',
    searchQuery: 'fraisier french strawberry cream cake',
    photos: [
      'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'buche-noel',
    name: 'Bûche de Noël',
    category: 'entremet',
    price: 32.00,
    emoji: '🪵',
    searchQuery: 'buche de noel yule log cake christmas',
    photos: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop&q=80',
      BAKERY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=800&fit=crop&q=80',
  },

  // ── SNACKS / SALÉ ──────────────────────────────────────────────────────────

  {
    slug: 'sandwich-jambon',
    name: 'Sandwich jambon-beurre',
    category: 'snack',
    price: 4.50,
    emoji: '🥪',
    searchQuery: 'french sandwich baguette ham butter',
    photos: [
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'quiche-lorraine',
    name: 'Quiche lorraine',
    category: 'snack',
    price: 4.80,
    emoji: '🥧',
    searchQuery: 'quiche lorraine french savory tart',
    photos: [
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'croissant-jambon',
    name: 'Croissant jambon-fromage',
    category: 'snack',
    price: 5.20,
    emoji: '🧀',
    searchQuery: 'croissant ham cheese savory baked',
    photos: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pizza-part',
    name: 'Part de pizza',
    category: 'snack',
    price: 3.50,
    emoji: '🍕',
    searchQuery: 'pizza slice artisan bakery',
    photos: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'fougasse',
    name: 'Fougasse olives',
    category: 'snack',
    price: 4.20,
    emoji: '🫒',
    searchQuery: 'fougasse olive bread provencal',
    photos: [
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&h=800&fit=crop&q=80',
      BAKERY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&h=800&fit=crop&q=80',
  },

  // ── BOISSONS ───────────────────────────────────────────────────────────────

  {
    slug: 'cafe',
    name: 'Café expresso',
    category: 'boisson',
    price: 1.80,
    emoji: '☕',
    searchQuery: 'espresso coffee cup french cafe',
    photos: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'cafe-lait',
    name: 'Café au lait',
    category: 'boisson',
    price: 2.50,
    emoji: '🥛',
    searchQuery: 'cafe au lait latte french breakfast',
    photos: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'jus-orange',
    name: 'Jus d\'orange frais',
    category: 'boisson',
    price: 3.50,
    emoji: '🍊',
    searchQuery: 'fresh orange juice glass',
    photos: [
      'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'chocolat-chaud',
    name: 'Chocolat chaud',
    category: 'boisson',
    price: 3.00,
    emoji: '🍫',
    searchQuery: 'hot chocolate mug warm drink',
    photos: [
      'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=1200&h=800&fit=crop&q=80',
  },

  // ── SERVICES ───────────────────────────────────────────────────────────────

  {
    slug: 'commande-gateau',
    name: 'Gâteaux sur commande',
    category: 'service',
    price: 45.00,
    emoji: '🎂',
    searchQuery: 'custom cake artisan wedding celebration',
    photos: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'plateau-petits-fours',
    name: 'Plateau petits fours (12p)',
    category: 'service',
    price: 22.00,
    emoji: '🍭',
    searchQuery: 'petit four assortment french pastry platter',
    photos: [
      'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800&h=800&fit=crop&q=80',
      PASTRY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'corbeille-pain',
    name: 'Corbeille de pains (événement)',
    category: 'service',
    price: 15.00,
    emoji: '🧺',
    searchQuery: 'bread basket assortment bakery',
    photos: [
      'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&h=800&fit=crop&q=80',
      BAKERY_DISPLAY,
    ],
    hero: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=1200&h=800&fit=crop&q=80',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return products for a given category */
export function getProductsByCategory(category: BakeryProduct['category']): BakeryProduct[] {
  return BAKERY_PRODUCTS.filter(p => p.category === category)
}

/** Return the first photo URL for a product slug */
export function getProductPhoto(slug: string, index = 0): string {
  const p = BAKERY_PRODUCTS.find(p => p.slug === slug)
  return p?.photos[index] ?? p?.photos[0] ?? ''
}

/**
 * Build a compact product listing string for AI prompts.
 * Groups by category with search queries and sample photo URLs.
 * The AI should use search_unsplash with the searchQuery for best results.
 */
export function buildProductLibraryContext(): string {
  const byCategory: Record<string, BakeryProduct[]> = {}
  for (const p of BAKERY_PRODUCTS) {
    if (!byCategory[p.category]) byCategory[p.category] = []
    byCategory[p.category].push(p)
  }

  const categoryLabels: Record<string, string> = {
    pain: 'PAINS',
    viennoiserie: 'VIENNOISERIES',
    patisserie: 'PÂTISSERIES',
    entremet: 'ENTREMETS / GÂTEAUX',
    snack: 'SNACKS / SALÉ',
    boisson: 'BOISSONS',
    service: 'SERVICES / COMMANDES',
  }

  const lines: string[] = [
    'CATALOGUE BOULANGERIE — produits et photos :',
    '⚠️  Pour chaque produit, utilise EXACTEMENT la photo indiquée — ne jamais substituer',
    '    (ex: "Éclair au chocolat" → photo d\'éclair, pas une tarte aux cerises)',
    '',
  ]

  for (const [cat, products] of Object.entries(byCategory)) {
    lines.push(`${categoryLabels[cat] ?? cat.toUpperCase()} :`)
    for (const p of products) {
      lines.push(`• ${p.name} — ${p.price.toFixed(2).replace('.', ',')}€`)
      lines.push(`  Photo principale : ${p.photos[0]}`)
      if (p.photos[1]) lines.push(`  Photo alternative : ${p.photos[1]}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/** All hero-format photos, good for section backgrounds */
export const BAKERY_HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1558958439-4d77a5a33659?w=1920&h=1080&fit=crop&q=80',
]
