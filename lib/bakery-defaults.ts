/**
 * lib/bakery-defaults.ts
 *
 * Default product catalogue seeded for every new bakery site.
 * Photos are curated Unsplash URLs where known; null otherwise
 * (the owner can update via the asset library or by chatting with the AI).
 */

export type DefaultProduct = {
  slug:        string
  name:        string
  category:    'pain' | 'viennoiserie' | 'patisserie' | 'snack' | 'boisson'
  price_cents: number
  emoji:       string
  photo_url:   string | null
  sort_order:  number
}

// ── Verified Unsplash IDs ─────────────────────────────────────────────────────
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=800&fit=crop&q=80`

export const DEFAULT_BAKERY_PRODUCTS: DefaultProduct[] = [

  // ── PAINS ──────────────────────────────────────────────────────────────────
  { slug: 'baguette_tradition',  name: 'Baguette tradition',     category: 'pain',        price_cents:  120, emoji: '🥖', photo_url: U('1549931319-a545dcf3bc73'), sort_order:  1 },
  { slug: 'baguette_ordinaire',  name: 'Baguette ordinaire',     category: 'pain',        price_cents:   95, emoji: '🥖', photo_url: U('1600369671236-e74521d4b6ad'), sort_order:  2 },
  { slug: 'pain_campagne',       name: 'Pain de campagne',       category: 'pain',        price_cents:  450, emoji: '🍞', photo_url: U('1568254183919-78a4f43a2877'), sort_order:  3 },
  { slug: 'pain_cereales',       name: 'Pain aux céréales',      category: 'pain',        price_cents:  520, emoji: '🌿', photo_url: U('1530569673472-307dc017a82d'), sort_order:  4 },
  { slug: 'pain_complet',        name: 'Pain complet bio',       category: 'pain',        price_cents:  480, emoji: '🌾', photo_url: U('1574085733277-851d9d856a3a'), sort_order:  5 },
  { slug: 'pain_seigle',         name: 'Pain de seigle',         category: 'pain',        price_cents:  550, emoji: '🌑', photo_url: U('1518779578993-ec3579fee39f'), sort_order:  6 },
  { slug: 'fougasse',            name: 'Fougasse',               category: 'pain',        price_cents:  380, emoji: '🫓', photo_url: null,                           sort_order:  7 },
  { slug: 'pain_levain',         name: 'Pain au levain',         category: 'pain',        price_cents:  450, emoji: '🍞', photo_url: U('1534620808146-d33bb39128b2'), sort_order:  8 },
  { slug: 'pain_mie',            name: 'Pain de mie',            category: 'pain',        price_cents:  280, emoji: '🍞', photo_url: null,                           sort_order:  9 },
  { slug: 'epi_ble',             name: 'Épi de blé',             category: 'pain',        price_cents:  180, emoji: '🌾', photo_url: null,                           sort_order: 10 },

  // ── VIENNOISERIES ──────────────────────────────────────────────────────────
  { slug: 'croissant',           name: 'Croissant au beurre',    category: 'viennoiserie', price_cents:  140, emoji: '🥐', photo_url: U('1555507036-ab1f4038808a'), sort_order: 11 },
  { slug: 'pain_chocolat',       name: 'Pain au chocolat',       category: 'viennoiserie', price_cents:  150, emoji: '🍫', photo_url: U('1586444248902-2f64eddc13df'), sort_order: 12 },
  { slug: 'brioche',             name: 'Brioche maison',         category: 'viennoiserie', price_cents:  320, emoji: '🧁', photo_url: U('1612240498936-65f5101365d2'), sort_order: 13 },
  { slug: 'pain_raisins',        name: 'Pain aux raisins',       category: 'viennoiserie', price_cents:  160, emoji: '🍇', photo_url: U('1583338917451-face2751d8d5'), sort_order: 14 },
  { slug: 'chausson_pommes',     name: 'Chausson aux pommes',    category: 'viennoiserie', price_cents:  180, emoji: '🥧', photo_url: U('1621743478914-cc8a86d7e7b5'), sort_order: 15 },
  { slug: 'palmier',             name: 'Palmier',                category: 'viennoiserie', price_cents:  120, emoji: '✨', photo_url: null,                           sort_order: 16 },
  { slug: 'kouign_amann',        name: 'Kouign-amann',           category: 'viennoiserie', price_cents:  350, emoji: '🧈', photo_url: null,                           sort_order: 17 },
  { slug: 'pain_suisse',         name: 'Pain suisse',            category: 'viennoiserie', price_cents:  180, emoji: '🍫', photo_url: null,                           sort_order: 18 },
  { slug: 'brioche_feuilletee',  name: 'Brioche feuilletée',     category: 'viennoiserie', price_cents:  280, emoji: '🥐', photo_url: null,                           sort_order: 19 },

  // ── PÂTISSERIES ────────────────────────────────────────────────────────────
  { slug: 'eclair',              name: 'Éclair au chocolat',     category: 'patisserie',   price_cents:  350, emoji: '🍫', photo_url: U('1614707267537-b85aaf00c4b7'), sort_order: 20 },
  { slug: 'millefeuille',        name: 'Millefeuille',           category: 'patisserie',   price_cents:  480, emoji: '🎂', photo_url: U('1551024601-bec78aea704b'),   sort_order: 21 },
  { slug: 'macaron',             name: 'Macaron',                category: 'patisserie',   price_cents:  180, emoji: '🍬', photo_url: U('1558326567-98ae2405596b'),   sort_order: 22 },
  { slug: 'tarte_fruits',        name: 'Tarte aux fruits',       category: 'patisserie',   price_cents:  450, emoji: '🍓', photo_url: U('1488477304112-4944851de03d'), sort_order: 23 },
  { slug: 'religieuse',          name: 'Religieuse',             category: 'patisserie',   price_cents:  420, emoji: '🎂', photo_url: null,                           sort_order: 24 },
  { slug: 'paris_brest',         name: 'Paris-Brest',            category: 'patisserie',   price_cents:  550, emoji: '🎂', photo_url: null,                           sort_order: 25 },
  { slug: 'flan_patissier',      name: 'Flan pâtissier',         category: 'patisserie',   price_cents:  380, emoji: '🥧', photo_url: null,                           sort_order: 26 },
  { slug: 'opera',               name: 'Opéra',                  category: 'patisserie',   price_cents:  550, emoji: '🎂', photo_url: U('1622483767028-3f66f32aef97'), sort_order: 27 },
  { slug: 'saint_honore',        name: 'Saint-Honoré',           category: 'patisserie',   price_cents:  650, emoji: '🎂', photo_url: null,                           sort_order: 28 },
  { slug: 'tarte_tatin',         name: 'Tarte Tatin',            category: 'patisserie',   price_cents:  450, emoji: '🥧', photo_url: null,                           sort_order: 29 },
  { slug: 'tarte_citron',        name: 'Tarte citron meringuée', category: 'patisserie',   price_cents:  420, emoji: '🍋', photo_url: U('1519915028121-7d3463d5b1ff'), sort_order: 30 },
  { slug: 'tarte_chocolat',      name: 'Tarte au chocolat',      category: 'patisserie',   price_cents:  450, emoji: '🍫', photo_url: null,                           sort_order: 31 },
  { slug: 'madeleine',           name: 'Madeleine',              category: 'patisserie',   price_cents:  120, emoji: '🧁', photo_url: null,                           sort_order: 32 },
  { slug: 'financier',           name: 'Financier',              category: 'patisserie',   price_cents:  220, emoji: '🟫', photo_url: U('1603532648955-039310d9ed75'), sort_order: 33 },
  { slug: 'canele',              name: 'Canelé de Bordeaux',     category: 'patisserie',   price_cents:  250, emoji: '🟤', photo_url: null,                           sort_order: 34 },
  { slug: 'sable_breton',        name: 'Sablé breton',           category: 'patisserie',   price_cents:  200, emoji: '⭐', photo_url: null,                           sort_order: 35 },
  { slug: 'cake',                name: 'Cake maison',            category: 'patisserie',   price_cents:  350, emoji: '🍰', photo_url: null,                           sort_order: 36 },
  { slug: 'cookie',              name: 'Cookie pépites choco',   category: 'patisserie',   price_cents:  180, emoji: '🍪', photo_url: null,                           sort_order: 37 },

  // ── SNACKS & SALÉ ──────────────────────────────────────────────────────────
  { slug: 'jambon_beurre',       name: 'Jambon-beurre',          category: 'snack',        price_cents:  450, emoji: '🥪', photo_url: U('1528735602780-2552fd46c7af'), sort_order: 38 },
  { slug: 'quiche_lorraine',     name: 'Quiche lorraine',        category: 'snack',        price_cents:  450, emoji: '🥧', photo_url: null,                           sort_order: 39 },
  { slug: 'croque_monsieur',     name: 'Croque-monsieur',        category: 'snack',        price_cents:  550, emoji: '🧀', photo_url: null,                           sort_order: 40 },
  { slug: 'feuillete_sale',      name: 'Feuilleté jambon-fromage', category: 'snack',      price_cents:  400, emoji: '🥐', photo_url: null,                           sort_order: 41 },
  { slug: 'pissaladiere',        name: 'Pissaladière',           category: 'snack',        price_cents:  350, emoji: '🍕', photo_url: null,                           sort_order: 42 },
  { slug: 'club_sandwich',       name: 'Club sandwich',          category: 'snack',        price_cents:  650, emoji: '🥪', photo_url: null,                           sort_order: 43 },
  { slug: 'pizza',               name: 'Part de pizza',          category: 'snack',        price_cents:  400, emoji: '🍕', photo_url: null,                           sort_order: 44 },
  { slug: 'quiche_saumon',       name: 'Quiche saumon-épinards', category: 'snack',        price_cents:  500, emoji: '🐟', photo_url: null,                           sort_order: 45 },

  // ── BOISSONS ───────────────────────────────────────────────────────────────
  { slug: 'cafe',                name: 'Café',                   category: 'boisson',      price_cents:  180, emoji: '☕', photo_url: null,                           sort_order: 46 },
  { slug: 'chocolat_chaud',      name: 'Chocolat chaud',         category: 'boisson',      price_cents:  250, emoji: '🍫', photo_url: null,                           sort_order: 47 },
  { slug: 'jus_orange',          name: 'Jus d\'orange pressé',   category: 'boisson',      price_cents:  300, emoji: '🍊', photo_url: null,                           sort_order: 48 },
  { slug: 'the_infusion',        name: 'Thé / Infusion',         category: 'boisson',      price_cents:  220, emoji: '🍵', photo_url: null,                           sort_order: 49 },
]
