/**
 * lib/bakery-photos.ts
 *
 * Curated Unsplash photo library for bakery products.
 * Each product has 3-4 photos so templates can pick different ones.
 * Used by: template generator, design presets, generated site components.
 */

export type BakeryProduct = {
  slug:     string
  name:     string       // French display name
  category: 'pain' | 'viennoiserie' | 'patisserie' | 'snack' | 'boisson'
  price:    number       // Default price in EUR
  emoji:    string
  photos:   string[]     // Unsplash URLs, w=800&h=800&fit=crop
  hero?:    string       // Wide hero photo (w=1200&h=800&fit=crop)
}

export const BAKERY_PRODUCTS: BakeryProduct[] = [
  {
    slug: 'baguette',
    name: 'Baguette Tradition',
    category: 'pain',
    price: 1.20,
    emoji: '🥖',
    photos: [
      'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'croissant',
    name: 'Croissant au beurre',
    category: 'viennoiserie',
    price: 1.40,
    emoji: '🥐',
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
    photos: [
      'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1621955511813-7c1b8eed2be4?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-levain',
    name: 'Pain au levain',
    category: 'pain',
    price: 4.50,
    emoji: '🍞',
    photos: [
      'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'brioche',
    name: 'Brioche maison',
    category: 'viennoiserie',
    price: 3.20,
    emoji: '🧈',
    photos: [
      'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'eclair-chocolat',
    name: 'Éclair au chocolat',
    category: 'patisserie',
    price: 3.50,
    emoji: '🍫',
    photos: [
      'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600359764607-dbdc4b2d5f88?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'tarte-citron',
    name: 'Tarte au citron meringuée',
    category: 'patisserie',
    price: 4.20,
    emoji: '🍋',
    photos: [
      'https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1519915028121-7d3463d5b1ff?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'opera',
    name: 'Opéra',
    category: 'patisserie',
    price: 5.50,
    emoji: '🎂',
    photos: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'mille-feuille',
    name: 'Mille-feuille',
    category: 'patisserie',
    price: 4.80,
    emoji: '🍰',
    photos: [
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1612203985729-70726954388c?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'macaron',
    name: 'Macaron (x3)',
    category: 'patisserie',
    price: 4.50,
    emoji: '🟣',
    photos: [
      'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582736317408-b4f5db5f6d22?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'chausson-pommes',
    name: 'Chausson aux pommes',
    category: 'viennoiserie',
    price: 1.80,
    emoji: '🍎',
    photos: [
      'https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'pain-raisin',
    name: 'Pain aux raisins',
    category: 'viennoiserie',
    price: 1.60,
    emoji: '🍇',
    photos: [
      'https://images.unsplash.com/photo-1583338917451-face2751d8d5?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595271021852-8b7be32b7e0e?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1583338917451-face2751d8d5?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'tarte-framboise',
    name: 'Tarte aux framboises',
    category: 'patisserie',
    price: 4.50,
    emoji: '🫐',
    photos: [
      'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'financier',
    name: 'Financier amande',
    category: 'patisserie',
    price: 2.20,
    emoji: '🟡',
    photos: [
      'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=1200&h=800&fit=crop&q=80',
  },
  {
    slug: 'sandwich-jambon',
    name: 'Sandwich jambon-beurre',
    category: 'snack',
    price: 4.50,
    emoji: '🥪',
    photos: [
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=800&fit=crop&q=80',
    ],
    hero: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1200&h=800&fit=crop&q=80',
  },
]

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
 * Groups by category with photo URLs for each product.
 */
export function buildProductLibraryContext(): string {
  const byCategory: Record<string, BakeryProduct[]> = {}
  for (const p of BAKERY_PRODUCTS) {
    if (!byCategory[p.category]) byCategory[p.category] = []
    byCategory[p.category].push(p)
  }

  const lines: string[] = ['CATALOGUE PRODUITS BOULANGERIE (utilise ces photos Unsplash réelles) :']
  for (const [cat, products] of Object.entries(byCategory)) {
    lines.push(`\n${cat.toUpperCase()} :`)
    for (const p of products) {
      lines.push(`• ${p.name} — ${p.price.toFixed(2).replace('.', ',')}€`)
      lines.push(`  Photos : ${p.photos.join(' | ')}`)
    }
  }
  return lines.join('\n')
}

/** All hero-format photos, good for section backgrounds */
export const BAKERY_HERO_PHOTOS = BAKERY_PRODUCTS
  .filter(p => p.hero)
  .map(p => p.hero!)
