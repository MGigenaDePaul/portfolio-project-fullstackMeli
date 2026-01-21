// src/search/cartera.js
import { tokenize, stem, stemTokens, normalize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

// Crear el Set con versiones stemmed
const createStemmedSet = (words) => {
  const stemmedSet = new Set()
  words.forEach((word) => {
    stemmedSet.add(word)
    stemmedSet.add(stem(word))
  })
  return stemmedSet
}

// Palabras clave de carteras
const carteraWords = createStemmedSet([
  'cartera',
  'carteras',
  'billetera',
  'billeteras',
  'monedero',
  'monederos',
  'wallet',
  'wallets',
  'bolso',
  'bolsos',
  'handbag',
  'handbags',
  'clutch',
])

// Palabras negativas (cosas que NO son carteras)
const negativeWords = createStemmedSet([
  'mochila',
  'backpack',
  'maleta',
  'valija',
  'neceser',
  'riñonera',
])

// Tipos de carteras
const carteraTypes = new Map([
  ['clutch', 'clutch'],
  ['bandolera', 'bandolera'],
  ['sobre', 'sobre'],
  ['tote', 'tote'],
  ['crossbody', 'crossbody'],
  ['shoulder', 'shoulder'],
  ['hombro', 'shoulder'],
])

// Marcas de carteras
const carteraBrands = new Map([
  ['gucci', 'gucci'],
  ['prada', 'prada'],
  ['chanel', 'chanel'],
  ['louis', 'louis vuitton'],
  ['vuitton', 'louis vuitton'],
  ['lv', 'louis vuitton'],
  ['michael', 'michael kors'],
  ['kors', 'michael kors'],
  ['mk', 'michael kors'],
  ['coach', 'coach'],
  ['hermes', 'hermes'],
  ['hermès', 'hermes'],
  ['dior', 'dior'],
  ['versace', 'versace'],
  ['fendi', 'fendi'],
  ['valentino', 'valentino'],
  ['balenciaga', 'balenciaga'],
  ['kate', 'kate spade'],
  ['spade', 'kate spade'],
  ['furla', 'furla'],
  ['longchamp', 'longchamp'],
  ['zara', 'zara'],
  ['hm', 'hm'],
  ['prune', 'prune'],
  ['save', 'save my bag'],
])

// Colores
const colorAliases = new Map([
  ['negro', 'negro'],
  ['black', 'negro'],
  ['blanco', 'blanco'],
  ['white', 'blanco'],
  ['marron', 'marron'],
  ['marrón', 'marron'],
  ['brown', 'marron'],
  ['camel', 'camel'],
  ['beige', 'beige'],
  ['nude', 'nude'],
  ['rojo', 'rojo'],
  ['red', 'rojo'],
  ['azul', 'azul'],
  ['blue', 'azul'],
  ['verde', 'verde'],
  ['green', 'verde'],
  ['rosa', 'rosa'],
  ['pink', 'rosa'],
  ['gris', 'gris'],
  ['gray', 'gris'],
  ['grey', 'gris'],
])

// Materiales
const materialAliases = new Map([
  ['cuero', 'cuero'],
  ['leather', 'cuero'],
  ['piel', 'cuero'],
  ['eco', 'eco cuero'],
  ['ecocuero', 'eco cuero'],
  ['sintetico', 'sintetico'],
  ['sintético', 'sintetico'],
  ['pu', 'sintetico'],
  ['lona', 'lona'],
  ['canvas', 'lona'],
  ['gamuza', 'gamuza'],
  ['suede', 'gamuza'],
])

// Tamaños
const sizeKeywords = new Set([
  'chica',
  'pequeña',
  'mini',
  'small',
  'mediana',
  'medium',
  'grande',
  'large',
  'xl',
])

// -------------------- helpers --------------------
const extractGender = (text = '') => {
  const normalizedText = normalize(text)
  const stemmedTokens = stemTokens(text)
  const stemmedJoined = stemmedTokens.join(' ')

  if (/\bunisex\b/.test(normalizedText)) return 'unisex'
  if (/\b(para\s+)?(mujer|dama|femenin|women|ladies)\b/i.test(stemmedJoined))
    return 'female'
  if (/\b(para\s+)?(hombre|varon|masculin|men)\b/i.test(stemmedJoined))
    return 'male'

  return null
}

const extractType = (tokens) => {
  for (const t of tokens) {
    if (carteraTypes.has(t)) return carteraTypes.get(t)
  }
  return null
}

const extractBrand = (tokens, joined) => {
  // Casos especiales primero
  if (tokens.includes('louis') && tokens.includes('vuitton'))
    return 'louis vuitton'
  if (tokens.includes('michael') && tokens.includes('kors'))
    return 'michael kors'
  if (tokens.includes('kate') && tokens.includes('spade')) return 'kate spade'
  if (
    tokens.includes('save') &&
    tokens.includes('my') &&
    tokens.includes('bag')
  )
    return 'save my bag'

  // Buscar marca individual
  for (const t of tokens) {
    if (carteraBrands.has(t)) return carteraBrands.get(t)
  }

  return null
}

const extractColors = (tokens) => {
  const colors = []
  for (const t of tokens) {
    if (colorAliases.has(t)) {
      const c = colorAliases.get(t)
      if (!colors.includes(c)) colors.push(c)
    }
  }
  return colors
}

const extractMaterials = (tokens) => {
  const mats = []
  for (const t of tokens) {
    if (materialAliases.has(t)) {
      const m = materialAliases.get(t)
      if (!mats.includes(m)) mats.push(m)
    }
  }
  return mats
}

const extractSize = (tokens) => {
  for (const t of tokens) {
    if (sizeKeywords.has(t)) {
      if (['chica', 'pequeña', 'mini', 'small'].includes(t)) return 'small'
      if (['mediana', 'medium'].includes(t)) return 'medium'
      if (['grande', 'large', 'xl'].includes(t)) return 'large'
    }
  }
  return null
}

// -------------------- intent detection --------------------
export const isCarteraQuery = (q) => {
  const tokens = stemTokens(q)
  const hasWord = tokens.some((t) => carteraWords.has(t))
  const hasNegative = tokens.some((t) => negativeWords.has(t))

  if (hasNegative && !hasWord) return false

  return hasWord
}

// -------------------- product detection --------------------
export const isCarteraProduct = (product) => {
  // ✅ CORRECCIÓN: la categoría correcta
  if (matchesPathPrefix(product, ['ropa', 'carteras'])) return true
  
  const text = buildSearchText(product)

  const looks =
    text.includes('cartera') ||
    text.includes('billetera') ||
    text.includes('monedero') ||
    text.includes('bolso') ||
    text.includes('wallet') ||
    text.includes('handbag')

  if (!looks) return false
  
  // Rechazar si tiene palabras negativas
  for (const w of negativeWords) {
    if (text.includes(w)) return false
  }
  
  return true
}
// -------------------- parser --------------------
export const parseCarteraQuery = (q) => {
  const normalizedText = normalize(q)
  const tokens = tokenize(q)
  const stemmedTokens = stemTokens(q)
  const joined = stemmedTokens.join(' ')

  const brand = extractBrand(tokens, joined)
  const type = extractType(tokens)
  const gender = extractGender(normalizedText)
  const colors = extractColors(stemmedTokens)
  const materials = extractMaterials(stemmedTokens)
  const size = extractSize(tokens)

  return { brand, type, gender, colors, materials, size }
}

// -------------------- matcher --------------------
export const matchesCarteraSpecs = (product, specs = {}) => {
  if (!isCarteraProduct(product)) return false
  const text = buildSearchText(product)

  // Marca: filtro duro
  if (specs.brand && !text.includes(specs.brand)) return false

  // Tipo: filtro duro si está especificado
  if (specs.type && !text.includes(specs.type)) return false

  // Género: filtro estricto
  if (specs.gender) {
    const g = extractGender(text)
    if (!g) return false
    if (g !== specs.gender) return false
  }

  // Tamaño: filtro suave (solo si el producto lo declara)
  if (specs.size) {
    const s = extractSize(tokenize(text))
    if (s && s !== specs.size) return false
  }

  // Colores: filtro estricto
  if (specs.colors?.length) {
    for (const c of specs.colors) {
      if (!text.includes(c)) return false
    }
  }

  // Materiales: filtro estricto
  if (specs.materials?.length) {
    for (const m of specs.materials) {
      if (!text.includes(m)) return false
    }
  }

  return true
}

export const carteraDropTokens = new Set([
  ...carteraWords,
  'para',
  ...Array.from(colorAliases.keys()),
  ...Array.from(materialAliases.keys()),
  ...sizeKeywords,
])
