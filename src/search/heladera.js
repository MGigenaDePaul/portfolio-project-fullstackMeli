import { tokenize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

// -------------------- keywords --------------------
const heladeraWords = new Set([
  'heladera',
  'heladeras',
  'refrigerador',
  'refrigeradora',
  'frigorifico',
  'frigorífico',
  'freezer',
])

// marcas (normalizadas)
const brandAliases = new Map([
  ['electrolux', 'electrolux'],
  ['whirlpool', 'whirlpool'],
  ['lg', 'lg'],
  ['samsung', 'samsung'],
  ['philco', 'philco'],
  ['patrick', 'patrick'],
  ['gafa', 'gafa'],
  ['kohinoor', 'kohinoor'],
  ['bosch', 'bosch'],
  ['siemens', 'siemens'],
  ['mabe', 'mabe'],
  ['drean', 'drean'],
  ['bgh', 'bgh'],
  ['hisense', 'hisense'],
])

// -------------------- helpers --------------------
const hasNoFrost = (text = '') => /\bno[\s\-]?frost\b/.test(text)

const hasFrost = (text = '') => {
  if (hasNoFrost(text)) return false
  return /\bfrost\b/.test(text)
}

// litros: "360l", "360 l", "360lt", "360 litros"
const extractLiters = (rawText = '') => {
  const t = String(rawText)

  const m =
    t.match(/\b(\d{2,4})\s*(l|lt|lts|litros)\b/i) ||
    t.match(/\b(\d{2,4})\s*(?:litro|litros)\b/i)

  if (m) {
    const n = parseInt(m[1], 10)
    if (Number.isFinite(n) && n >= 80 && n <= 9999) return n
  }

  const m2 = t.match(/\b(\d{2,4})l\b/i)
  if (m2) {
    const n = parseInt(m2[1], 10)
    if (Number.isFinite(n) && n >= 80 && n <= 9999) return n
  }

  return null
}

// -------------------- intent detection --------------------
export const isHeladeraQuery = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')
  const raw = String(q || '').toLowerCase()

  const hasWord = tokens.some((t) => heladeraWords.has(t))
  const hasBrand = tokens.some((t) => brandAliases.has(t))

  const liters = extractLiters(raw) ?? extractLiters(joined)
  const noFrost = hasNoFrost(joined) || hasNoFrost(raw)
  const frost = hasFrost(joined) || hasFrost(raw)

  // regla: marca sola NO alcanza
  if (hasWord) return true
  if (noFrost || frost) return true
  if (liters) return true
  if (hasBrand && (noFrost || frost || liters)) return true

  return false
}

// -------------------- product detection --------------------
export const isHeladeraProduct = (product) => {
  if (matchesPathPrefix(product, ['hogar', 'electrodomesticos', 'heladeras']))
    return true
  if (matchesPathPrefix(product, ['hogar', 'heladeras'])) return true

  const text = buildSearchText(product)

  const looksLikeHeladera =
    text.includes('heladera') ||
    text.includes('refrigerador') ||
    text.includes('freezer') ||
    hasNoFrost(text) ||
    hasFrost(text)

  if (!looksLikeHeladera) return false

  const isAccessory =
    text.includes('filtro') ||
    text.includes('repuesto') ||
    text.includes('burlete') ||
    text.includes('estante') ||
    text.includes('bandeja') ||
    text.includes('lampara') ||
    text.includes('luz') ||
    text.includes('manija') ||
    text.includes('termostato')

  return !isAccessory
}

// -------------------- parser --------------------
export const parseHeladeraQuery = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')
  const raw = String(q || '').toLowerCase()

  let brand = null
  for (const t of tokens) {
    if (brandAliases.has(t)) {
      brand = brandAliases.get(t)
      break
    }
  }

  let frost = null
  if (hasNoFrost(joined) || hasNoFrost(raw)) frost = 'nofrost'
  else if (hasFrost(joined) || hasFrost(raw)) frost = 'frost'

  const liters = extractLiters(raw) ?? extractLiters(joined)

  return { brand, liters, frost }
}

// -------------------- matcher --------------------
export const matchesHeladeraSpecs = (product, specs = {}) => {
  const text = buildSearchText(product)

  if (specs.brand && !text.includes(specs.brand)) return false

  if (specs.frost === 'nofrost' && !hasNoFrost(text)) return false
  if (specs.frost === 'frost' && !hasFrost(text)) return false

  if (specs.liters) {
    const L = String(specs.liters)
    const ok =
      text.includes(`${L}l`) ||
      text.includes(`${L} l`) ||
      text.includes(`${L}lt`) ||
      text.includes(`${L} litros`)
    if (!ok) return false
  }

  return true
}

// -------------------- drop tokens --------------------
export const heladeraDropTokens = new Set([
  ...heladeraWords,
  'no',
  'frost',
  'nofrost',
  'inverter',
  'litro',
  'litros',
  'l',
  'lt',
  'lts',
])
