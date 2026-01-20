import { tokenize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

/* ======================================================
   BASE
====================================================== */

const beautyWords = new Set([
  'belleza',
  'makeup',
  'maquillaje',
  'cosmetica',
  'cosmética',
  'cosmeticos',
  'cosméticos',
])

/* ======================================================
   PRODUCT TYPES (orden IMPORTA)
   👉 labial es una FAMILIA (incluye gloss)
====================================================== */

const typeMap = [
  // LABIOS (familia)
  { type: 'labial', words: ['labial', 'labiales', 'lipstick'] },

  // gloss explícito (solo si no hay "labial")
  { type: 'gloss', words: ['gloss', 'lipgloss', 'brillo', 'brillito'] },

  { type: 'delineador', words: ['delineador', 'liner', 'eyeliner'] },
  {
    type: 'mascara',
    words: ['mascara', 'máscara', 'rimel', 'rimmel', 'pestanas', 'pestañas'],
  },
  { type: 'sombras', words: ['sombras', 'sombra', 'eyeshadow', 'paleta'] },
  { type: 'base', words: ['base', 'foundation'] },
  { type: 'corrector', words: ['corrector', 'concealer'] },
  { type: 'polvo', words: ['polvo', 'compacto', 'setting'] },
  { type: 'rubor', words: ['rubor', 'blush'] },
  { type: 'iluminador', words: ['iluminador', 'highlighter'] },
  { type: 'brochas', words: ['brocha', 'brochas', 'brush', 'brushes'] },

  // cuidado personal
  {
    type: 'perfume',
    words: [
      'perfume',
      'perfumes',
      'fragancia',
      'fragancias',
      'parfum',
      'edt',
      'edp',
    ],
  },
  {
    type: 'crema',
    words: [
      'crema',
      'hidratante',
      'locion',
      'loción',
      'serum',
      'sérum',
      'skincare',
    ],
  },
  { type: 'shampoo', words: ['shampoo', 'champu', 'champú', 'acondicionador'] },
]

/* ======================================================
   BRANDS
====================================================== */

const brands = new Set([
  'maybelline',
  'loreal',
  "l'oreal",
  'revlon',
  'mac',
  'avon',
  'natura',
  'vogue',
  'rimmel',
  'nyx',
  'essence',
  'dior',
  'chanel',
  'givenchy',
  'carolina',
  'herrera',
  'paco',
  'rabanne',
  'versace',
  'calvin',
  'klein',
])

/* ======================================================
   CATEGORY PATHS
====================================================== */

const categoryMakeup = ['belleza', 'maquillaje']
const categoryAccessories = ['belleza', 'accesorios']
const categoryPersonalCare = ['belleza', 'cuidado personal']

/* ======================================================
   CATEGORY SIGNALS
====================================================== */

const makeupSignals = new Set([
  'maquillaje',
  'labial',
  'labiales',
  'gloss',
  'base',
  'corrector',
  'polvo',
  'rubor',
  'iluminador',
  'sombras',
  'delineador',
  'rimel',
  'rimmel',
  'pestanas',
  'pestañas',
])

const accessorySignals = new Set([
  'brocha',
  'brochas',
  'pincel',
  'pinceles',
  'esponja',
  'beautyblender',
  'pinza',
  'arqueador',
])

const personalCareSignals = new Set([
  'perfume',
  'fragancia',
  'skincare',
  'crema',
  'hidratante',
  'serum',
  'sérum',
  'shampoo',
  'acondicionador',
  'desodorante',
])

/* ======================================================
   INTENT
====================================================== */

export const isBeautyQuery = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')

  return (
    tokens.some((t) => beautyWords.has(t)) ||
    typeMap.some((r) => r.words.some((w) => joined.includes(w))) ||
    tokens.some((t) => brands.has(t))
  )
}

export const extractBeautySpecs = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')

  /* ---------- brand ---------- */
  let brand = null
  for (const t of tokens) {
    if (t === 'loreal' || t === "l'oreal") {
      brand = 'loreal'
      break
    }
    if (brands.has(t)) {
      brand = t
      break
    }
  }

  /* ---------- productType (CLAVE) ---------- */
  let productType = null

  // PRIORIDAD: labial/labiales gana SIEMPRE
  if (joined.includes('labial') || joined.includes('labiales')) {
    productType = 'labial'
  } else {
    for (const rule of typeMap) {
      if (rule.words.some((w) => joined.includes(w))) {
        productType = rule.type
        break
      }
    }
  }

  /* ---------- categoryHint ---------- */
  let categoryHint = null
  if (tokens.some((t) => accessorySignals.has(t))) {
    categoryHint = categoryAccessories
  } else if (tokens.some((t) => personalCareSignals.has(t))) {
    categoryHint = categoryPersonalCare
  } else if (tokens.some((t) => makeupSignals.has(t))) {
    categoryHint = categoryMakeup
  }

  return {
    brand,
    productType,
    categoryHint,
    wantsMate: joined.includes('mate') || joined.includes('matte'),
    wantsWaterproof: joined.includes('waterproof'),
  }
}

/* ======================================================
   PRODUCT MATCHERS
====================================================== */

export const isBeautyProduct = (product) => {
  if (matchesPathPrefix(product, ['belleza'])) return true
  const text = buildSearchText(product)
  return (
    text.includes('labial') ||
    text.includes('gloss') ||
    text.includes('maquillaje') ||
    text.includes('perfume') ||
    text.includes('skincare') ||
    text.includes('brocha')
  )
}

export const matchesBeautySpecs = (product, specs = {}) => {
  const text = buildSearchText(product)

  // categoría (fuerte)
  if (specs.categoryHint?.length) {
    if (!matchesPathPrefix(product, specs.categoryHint)) return false
  }

  // marca (fuerte)
  if (specs.brand && !text.includes(specs.brand)) return false

  // PRODUCT TYPE (CLAVE)
  if (specs.productType === 'labial') {
    const lipSignals = [
      'labial',
      'labiales',
      'lipstick',
      'gloss',
      'lipgloss',
      'brillo',
      'tinta',
      'balm',
      'balsamo',
      'bálsamo',
    ]
    if (!lipSignals.some((w) => text.includes(w))) return false
  }

  if (specs.productType === 'gloss') {
    if (!text.includes('gloss') && !text.includes('brillo')) return false
  }

  return true
}
