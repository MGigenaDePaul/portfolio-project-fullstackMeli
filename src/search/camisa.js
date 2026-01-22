// search/camisa.js
import { tokenize, stem, stemTokens, normalize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

// Crear el Set con versiones stemmed
const createStemmedSet = (words) => {
  const stemmedSet = new Set()
  words.forEach((word) => {
    stemmedSet.add(word) // original
    stemmedSet.add(stem(word)) // stemmed
  })
  return stemmedSet
}

// ==================== palabras clave ====================
const camisaWords = createStemmedSet([
  'camisa',
  'camisas',
  'shirt',
  'shirts',
  'camisola',
  'camisolas',
  'blusa',
  'blusas',
])

// Palabras negativas (para evitar confundir con remeras / buzos / etc.)
const negativeWords = createStemmedSet([
  'remera',
  'remeras',
  'camiseta',
  'camisetas',
  'tshirt',
  'tshirts',
  't-shirt',
  't-shirts',
  'tee',
  'tees',
  'buzo',
  'hoodie',
  'campera',
  'abrigo',
  'sweater',
  'sueter',
  'pantalon',
  'jean',
  'jogger',
  'short',
  'bermuda',
  'zapatilla',
  'calzado',
  'botin',
  'botines',
])

const brandAliases = new Map([
  ['nike', 'nike'],
  ['adidas', 'adidas'],
  ['puma', 'puma'],
  ['reebok', 'reebok'],
  ['fila', 'fila'],
  ['vans', 'vans'],
  ['levis', 'levis'],
  ['levi', 'levis'],
  ['tommy', 'tommy'],
  ['tommyhilfiger', 'tommy'],
  ['underarmour', 'under armour'],
  ['under', 'under armour'],
  ['armour', 'under armour'],
  ['newbalance', 'new balance'],
  ['nb', 'new balance'],
  ['zara', 'zara'],
  ['hm', 'hm'],
  ['hym', 'hm'],
])

const colorAliases = new Map([
  ['negro', 'negro'],
  ['black', 'negro'],
  ['blanco', 'blanco'],
  ['white', 'blanco'],
  ['gris', 'gris'],
  ['gray', 'gris'],
  ['grey', 'gris'],
  ['rojo', 'rojo'],
  ['red', 'rojo'],
  ['azul', 'azul'],
  ['blue', 'azul'],
  ['verde', 'verde'],
  ['green', 'verde'],
  ['celeste', 'celeste'],
  ['amarillo', 'amarillo'],
  ['yellow', 'amarillo'],
  ['rosa', 'rosa'],
  ['pink', 'rosa'],
  ['beige', 'beige'],
  ['arena', 'beige'],
  ['marron', 'marron'],
  ['marrón', 'marron'],
  ['brown', 'marron'],
  ['bordo', 'bordo'],
  ['bordó', 'bordo'],
])

const materialAliases = new Map([
  ['algodon', 'algodon'],
  ['algodón', 'algodon'],
  ['cotton', 'algodon'],
  ['poliester', 'poliester'],
  ['polyester', 'poliester'],
  ['lino', 'lino'],
  ['linen', 'lino'],
  ['modal', 'modal'],
  ['viscosa', 'viscosa'],
  ['rayon', 'viscosa'],
  ['lycra', 'lycra'],
  ['elastano', 'elastano'],
  ['spandex', 'elastano'],
])

// helpers
const hasLongSleeve = (text = '') =>
  /\bmanga\s*larga\b/.test(text) || /\blong\s*sleeve\b/.test(text)

const hasShortSleeve = (text = '') =>
  /\bmanga\s*corta\b/.test(text) || /\bshort\s*sleeve\b/.test(text)

// (opcional) señales típicas de camisa
const hasFormalSignal = (text = '') =>
  /\b(vestir|formal|oficina|sastrer|elegante)\b/.test(text)

export const extractGender = (text = '') => {
  const normalizedText = normalize(text)
  const stemmedTokens = stemTokens(text)
  const stemmedJoined = stemmedTokens.join(' ')

  if (/\bunisex\b/.test(normalizedText)) return 'unisex'

  // Nota: usamos stemmedJoined para que "hombres" -> "hombre"
  if (/\b(para\s+)?(hombre|varon|masculin|men)\b/i.test(stemmedJoined))
    return 'male'

  if (/\b(para\s+)?(mujer|dama|femenin|women|ladies)\b/i.test(stemmedJoined))
    return 'female'

  return null
}

const extractColors = (tokens, joined) => {
  const colors = []
  for (const t of tokens) {
    if (colorAliases.has(t)) {
      const c = colorAliases.get(t)
      if (!colors.includes(c)) colors.push(c)
    }
  }
  if (/\bazul\s*marino\b/.test(joined) && !colors.includes('azul'))
    colors.push('azul')
  if (/\bgris\s*oscuro\b/.test(joined) && !colors.includes('gris'))
    colors.push('gris')
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

const extractBrand = (tokens, joined) => {
  for (const t of tokens) if (brandAliases.has(t)) return brandAliases.get(t)

  // fallback por texto completo por si vino raro (ej "zara," "zara.")
  for (const [k, v] of brandAliases.entries()) {
    if (new RegExp(`\\b${k}\\b`).test(joined)) return v
  }
  return null
}

// ==================== intent detection ====================
export const isCamisaQuery = (q) => {
  const tokens = stemTokens(q)
  const joined = tokens.join(' ')

  const hasWord = tokens.some((t) => camisaWords.has(t))
  const hasNegative = tokens.some((t) => negativeWords.has(t))
  if (hasNegative && !hasWord) return false

  const hasSignals =
    hasWord ||
    hasShortSleeve(joined) ||
    hasLongSleeve(joined) ||
    hasFormalSignal(joined) ||
    Boolean(extractGender(joined))

  return hasSignals
}

// ==================== product detection ====================
export const isCamisaProduct = (product) => {
  if (matchesPathPrefix(product, ['ropa', 'camisas'])) return true

  const text = buildSearchText(product)

  const looks =
    text.includes('camisa') ||
    text.includes('camisola') ||
    text.includes('blusa') ||
    text.includes('shirt')

  if (!looks) return false
  for (const w of negativeWords) if (text.includes(w)) return false
  return true
}

// ==================== parser ====================
export const parseCamisaQuery = (q) => {
  const normalizedText = normalize(q)
  const tokens = tokenize(q)
  const stemmedTokens = stemTokens(q)
  const joined = stemmedTokens.join(' ')

  const brand = extractBrand(tokens, joined)

  let sleeve = null
  if (hasShortSleeve(normalizedText)) sleeve = 'short'
  else if (hasLongSleeve(normalizedText)) sleeve = 'long'

  // gender usa stem internamente
  const gender = extractGender(normalizedText) ?? 'unisex'

  const colors = extractColors(stemmedTokens, joined)
  const materials = extractMaterials(stemmedTokens)

  return { brand, sleeve, gender, colors, materials }
}

// ==================== matcher ====================
// DURO: camisa + marca (si la pidio)
// ESTRICTO: si pidió sleeve o gender => el producto debe declararlo y matchear exacto
// ====================
export const matchesCamisaSpecs = (product, specs = {}) => {
  if (!isCamisaProduct(product)) return false
  const text = buildSearchText(product)

  if (specs.brand && !text.includes(specs.brand)) return false

  // ✅ MANGA: estricto si se pide
  if (specs.sleeve) {
    const hasShort = hasShortSleeve(text)
    const hasLong = hasLongSleeve(text)

    if (!hasShort && !hasLong) return false

    if (specs.sleeve === 'short' && !hasShort) return false
    if (specs.sleeve === 'long' && !hasLong) return false
  }

  // ✅ GÉNERO: match exacto (unisex NO sirve para male/female)
  if (specs.gender) {
    const g = extractGender(text)
    if (!g) return false
    if (g !== specs.gender) return false
  }

  // ✅ COLOR: estricto (debe contener todos los colores pedidos)
  if (specs.colors?.length) {
    for (const c of specs.colors) {
      if (!text.includes(c)) return false
    }
  }

  // ✅ MATERIAL: estricto (debe contener todos los materiales pedidos)
  if (specs.materials?.length) {
    for (const m of specs.materials) {
      if (!text.includes(m)) return false
    }
  }

  return true
}

export const camisaDropTokens = new Set([
  ...camisaWords,
  'para',
  'hombre',
  'mujer',
  'dama',
  'unisex',
  'manga',
  'corta',
  'larga',
  'formal',
  'oficina',
  'vestir',
  'elegante',
  ...Array.from(colorAliases.keys()),
  ...Array.from(materialAliases.keys()),
])
