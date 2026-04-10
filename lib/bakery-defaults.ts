/**
 * lib/bakery-defaults.ts
 *
 * Default product catalogue seeded for every new bakery site.
 * Photos are hosted on Supabase storage (sites bucket, product-photos/).
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

// ── Supabase storage base URL ─────────────────────────────────────────────────
const P = (filename: string) =>
  `https://upscqpqrhhzcganmksrm.supabase.co/storage/v1/object/public/sites/product-photos/${filename}`

export const DEFAULT_BAKERY_PRODUCTS: DefaultProduct[] = [

  // ── PAINS ──────────────────────────────────────────────────────────────────
  { slug: 'baguette_tradition',  name: 'Baguette tradition',     category: 'pain',        price_cents:  120, emoji: '🥖', photo_url: P('baguette_tradition.webp'),  sort_order:  1 },
  // { slug: 'baguette_ordinaire',  name: 'Baguette ordinaire',     category: 'pain',        price_cents:   95, emoji: '🥖', photo_url: null,                          sort_order:  2 },
  { slug: 'pain_campagne',       name: 'Pain de campagne',       category: 'pain',        price_cents:  450, emoji: '🍞', photo_url: P('pain_campagne.jpg'),         sort_order:  3 },
  { slug: 'pain_cereales',       name: 'Pain aux céréales',      category: 'pain',        price_cents:  520, emoji: '🌿', photo_url: P('pain_cereales.jpg'),         sort_order:  4 },
  { slug: 'pain_complet',        name: 'Pain complet bio',       category: 'pain',        price_cents:  480, emoji: '🌾', photo_url: P('pain_complet.jpg'),          sort_order:  5 },
  // { slug: 'pain_seigle',         name: 'Pain de seigle',         category: 'pain',        price_cents:  550, emoji: '🌑', photo_url: null,                          sort_order:  6 },
  // { slug: 'fougasse',            name: 'Fougasse',               category: 'pain',        price_cents:  380, emoji: '🫓', photo_url: null,                          sort_order:  7 },
  { slug: 'pain_levain',         name: 'Pain au levain',         category: 'pain',        price_cents:  450, emoji: '🍞', photo_url: P('pain_levain.jpg'),           sort_order:  8 },
  // { slug: 'pain_mie',            name: 'Pain de mie',            category: 'pain',        price_cents:  280, emoji: '🍞', photo_url: null,                          sort_order:  9 },
  // { slug: 'epi_ble',             name: 'Épi de blé',             category: 'pain',        price_cents:  180, emoji: '🌾', photo_url: null,                          sort_order: 10 },

  // ── VIENNOISERIES ──────────────────────────────────────────────────────────
  { slug: 'croissant',           name: 'Croissant au beurre',    category: 'viennoiserie', price_cents:  140, emoji: '🥐', photo_url: P('croissant.jpg'),            sort_order: 11 },
  { slug: 'pain_chocolat',       name: 'Pain au chocolat',       category: 'viennoiserie', price_cents:  150, emoji: '🍫', photo_url: P('pain_chocolat.jpg'),        sort_order: 12 },
  { slug: 'brioche',             name: 'Brioche maison',         category: 'viennoiserie', price_cents:  320, emoji: '🧁', photo_url: P('brioche.avif'),             sort_order: 13 },
  // { slug: 'pain_raisins',        name: 'Pain aux raisins',       category: 'viennoiserie', price_cents:  160, emoji: '🍇', photo_url: null,                          sort_order: 14 },
  { slug: 'chausson_pommes',     name: 'Chausson aux pommes',    category: 'viennoiserie', price_cents:  180, emoji: '🥧', photo_url: P('chausson_pommes.jpg'),      sort_order: 15 },
  // { slug: 'palmier',             name: 'Palmier',                category: 'viennoiserie', price_cents:  120, emoji: '✨', photo_url: null,                          sort_order: 16 },
  // { slug: 'kouign_amann',        name: 'Kouign-amann',           category: 'viennoiserie', price_cents:  350, emoji: '🧈', photo_url: null,                          sort_order: 17 },
  // { slug: 'pain_suisse',         name: 'Pain suisse',            category: 'viennoiserie', price_cents:  180, emoji: '🍫', photo_url: null,                          sort_order: 18 },
  // { slug: 'brioche_feuilletee',  name: 'Brioche feuilletée',     category: 'viennoiserie', price_cents:  280, emoji: '🥐', photo_url: null,                          sort_order: 19 },

  // ── PÂTISSERIES ────────────────────────────────────────────────────────────
  { slug: 'eclair',              name: 'Éclair au chocolat',     category: 'patisserie',   price_cents:  350, emoji: '🍫', photo_url: P('eclair.jpg'),               sort_order: 20 },
  // { slug: 'millefeuille',        name: 'Millefeuille',           category: 'patisserie',   price_cents:  480, emoji: '🎂', photo_url: null,                          sort_order: 21 },
  // { slug: 'macaron',             name: 'Macaron',                category: 'patisserie',   price_cents:  180, emoji: '🍬', photo_url: null,                          sort_order: 22 },
  { slug: 'tarte_fraises',        name: 'Tartelette aux fraises',       category: 'patisserie',   price_cents:  450, emoji: '🍓', photo_url: P('tarte_fruits.jpg'),         sort_order: 23 },
  // { slug: 'religieuse',          name: 'Religieuse',             category: 'patisserie',   price_cents:  420, emoji: '🎂', photo_url: null,                          sort_order: 24 },
  { slug: 'paris_brest',         name: 'Paris-Brest',            category: 'patisserie',   price_cents:  550, emoji: '🎂', photo_url: P('paris_brest.JPG'),          sort_order: 25 },
  // { slug: 'flan_patissier',      name: 'Flan pâtissier',         category: 'patisserie',   price_cents:  380, emoji: '🥧', photo_url: null,                          sort_order: 26 },
  { slug: 'opera',               name: 'Opéra',                  category: 'patisserie',   price_cents:  550, emoji: '🎂', photo_url: P('opera.jpg'),                sort_order: 27 },
  // { slug: 'saint_honore',        name: 'Saint-Honoré',           category: 'patisserie',   price_cents:  650, emoji: '🎂', photo_url: null,                          sort_order: 28 },
  // { slug: 'tarte_tatin',         name: 'Tarte Tatin',            category: 'patisserie',   price_cents:  450, emoji: '🥧', photo_url: null,                          sort_order: 29 },
  { slug: 'tarte_citron',        name: 'Tarte citron meringuée', category: 'patisserie',   price_cents:  420, emoji: '🍋', photo_url: P('tarte_citron.jpg'),         sort_order: 30 },
  // { slug: 'tarte_chocolat',      name: 'Tarte au chocolat',      category: 'patisserie',   price_cents:  450, emoji: '🍫', photo_url: null,                          sort_order: 31 },
  // { slug: 'madeleine',           name: 'Madeleine',              category: 'patisserie',   price_cents:  120, emoji: '🧁', photo_url: null,                          sort_order: 32 },
  // { slug: 'financier',           name: 'Financier',              category: 'patisserie',   price_cents:  220, emoji: '🟫', photo_url: null,                          sort_order: 33 },
  // { slug: 'canele',              name: 'Canelé de Bordeaux',     category: 'patisserie',   price_cents:  250, emoji: '🟤', photo_url: null,                          sort_order: 34 },
  // { slug: 'sable_breton',        name: 'Sablé breton',           category: 'patisserie',   price_cents:  200, emoji: '⭐', photo_url: null,                          sort_order: 35 },
  // { slug: 'cake',                name: 'Cake maison',            category: 'patisserie',   price_cents:  350, emoji: '🍰', photo_url: null,                          sort_order: 36 },
  // { slug: 'cookie',              name: 'Cookie pépites choco',   category: 'patisserie',   price_cents:  180, emoji: '🍪', photo_url: null,                          sort_order: 37 },
  { slug: 'chouquettes',         name: 'Chouquettes',            category: 'patisserie',   price_cents:  250, emoji: '🫧', photo_url: P('chouquettes.webp'),         sort_order: 38 },

  // ── SNACKS & SALÉ ──────────────────────────────────────────────────────────
  // { slug: 'jambon_beurre',       name: 'Jambon-beurre',          category: 'snack',        price_cents:  450, emoji: '🥪', photo_url: null,                          sort_order: 39 },
  // { slug: 'quiche_lorraine',     name: 'Quiche lorraine',        category: 'snack',        price_cents:  450, emoji: '🥧', photo_url: null,                          sort_order: 40 },
  // { slug: 'croque_monsieur',     name: 'Croque-monsieur',        category: 'snack',        price_cents:  550, emoji: '🧀', photo_url: null,                          sort_order: 41 },
  // { slug: 'feuillete_sale',      name: 'Feuilleté jambon-fromage', category: 'snack',      price_cents:  400, emoji: '🥐', photo_url: null,                          sort_order: 42 },
  // { slug: 'pissaladiere',        name: 'Pissaladière',           category: 'snack',        price_cents:  350, emoji: '🍕', photo_url: null,                          sort_order: 43 },
  // { slug: 'club_sandwich',       name: 'Club sandwich',          category: 'snack',        price_cents:  650, emoji: '🥪', photo_url: null,                          sort_order: 44 },
  // { slug: 'pizza',               name: 'Part de pizza',          category: 'snack',        price_cents:  400, emoji: '🍕', photo_url: null,                          sort_order: 45 },
  // { slug: 'quiche_saumon',       name: 'Quiche saumon-épinards', category: 'snack',        price_cents:  500, emoji: '🐟', photo_url: null,                          sort_order: 46 },

  // ── BOISSONS ───────────────────────────────────────────────────────────────
  { slug: 'cafe',                name: 'Café',                   category: 'boisson',      price_cents:  180, emoji: '☕', photo_url: P('cafe.jpg'),                 sort_order: 47 },
  { slug: 'chocolat_chaud',      name: 'Chocolat chaud',         category: 'boisson',      price_cents:  250, emoji: '🍫', photo_url: P('chocolat_chaud.webp'),      sort_order: 48 },
  { slug: 'jus_orange',          name: "Jus d'orange pressé",    category: 'boisson',      price_cents:  300, emoji: '🍊', photo_url: P('jus_orange.webp'),          sort_order: 49 },
  { slug: 'coca',                name: 'Coca-Cola',              category: 'boisson',      price_cents:  250, emoji: '🥤', photo_url: P('coca.jpg'),                 sort_order: 50 },
  // { slug: 'the_infusion',        name: 'Thé / Infusion',         category: 'boisson',      price_cents:  220, emoji: '🍵', photo_url: null,                          sort_order: 51 },
]
