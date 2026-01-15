import { tokenize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

export const isPhoneQuery = (q) => {
  const tokens = tokenize(q)
  const phoneWords = new Set([
    'celular',
    'celulares',
    'telefono',
    'telefonos',
    'smartphone',
    'smartphones',
    'iphone',
    'android',
  ])
  const brands = new Set([
    'iphone',
    'apple',
    'samsung',
    'xiaomi',
    'motorola',
    'huawei',
    'nokia',
    'oneplus',
    'realme',
    'oppo',
    'poco',
    'redmi',
  ])
  return tokens.some((t) => phoneWords.has(t) || brands.has(t))
}


export const isPhoneProduct = (product) => {
  // primero por categoría (fuerte)
  if (matchesPathPrefix(product, ['tecnologia', 'celulares'])) return true

  // fallback por texto (por si te quedó alguno mal categorizado)
  const text = buildSearchText(product)
  const looksLikePhone =
    text.includes('celular') ||
    text.includes('telefono') ||
    text.includes('smartphone') ||
    text.includes('iphone') ||
    text.includes('android')

  if (!looksLikePhone) return false

  const isAccessory =
    text.includes('funda') ||
    text.includes('cargador') ||
    text.includes('vidrio') ||
    text.includes('templado') ||
    text.includes('case')

  return !isAccessory
}

// ===== parser + matcher (igual que tu versión) =====
const phoneVariantWords = new Set([
  'mini',
  'pro',
  'max',
  'ultra',
  'lite',
  'plus',
  'se',
  'prime',
  'neo',
  't',
  's',
  '5g',
])

const brandAliases = new Map([
  ['apple', 'iphone'],
  ['iphone', 'iphone'],
  ['huawei', 'huawei'],
  ['xiaomi', 'xiaomi'],
  ['redmi', 'xiaomi'],
  ['poco', 'xiaomi'],
  ['samsung', 'samsung'],
  ['motorola', 'motorola'],
  ['nokia', 'nokia'],
  ['oneplus', 'oneplus'],
  ['realme', 'realme'],
  ['oppo', 'oppo'],
])

const xiaomiSeries = new Set(['redmi', 'note', 'mi', 'poco'])
const huaweiSeries = new Set(['mate', 'nova', 'p'])

const isNumberToken = (t) => /^\d{1,3}$/.test(t)
const isGBToken = (t) => /^\d{1,4}gb$/.test(t)

export const parsePhoneQuery = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')

  let brand = null
  for (const t of tokens) {
    if (brandAliases.has(t)) {
      brand = brandAliases.get(t)
      break
    }
  }

  const series = []
  if (brand === 'xiaomi')
    for (const t of tokens) if (xiaomiSeries.has(t)) series.push(t)
  if (brand === 'huawei')
    for (const t of tokens) if (huaweiSeries.has(t)) series.push(t)

  let model = null
  for (const t of tokens)
    if (isNumberToken(t)) {
      model = t
      break
    }

  let alphaNumModel = null
  for (const t of tokens) {
    const m = t.match(/^([a-z]+)?(\d{1,3})([a-z])?$/)
    if (m && !isNumberToken(t)) {
      alphaNumModel = { raw: t, prefix: m[1], number: m[2], suffix: m[3] }
      break
    }
  }

  const variants = []
  for (const t of tokens) if (phoneVariantWords.has(t)) variants.push(t)

  let storage = null
  let ram = null

  const combo = joined.match(/\b(\d{1,2})gb\s*[/\-]\s*(\d{2,4})gb\b/)
  if (combo) {
    ram = combo[1]
    storage = combo[2]
  } else {
    for (const t of tokens) {
      if (isGBToken(t)) {
        const n = parseInt(t.replace('gb', ''), 10)
        if (n >= 32) storage = String(n)
        else ram = String(n)
      }
    }
  }

  return { brand, series, model, alphaNumModel, variants, storage, ram }
}

export const matchesPhoneSpecs = (product, specs) => {
  const text = buildSearchText(product)

  if (specs.brand) {
    if (specs.brand === 'iphone') {
      if (!text.includes('iphone')) return false
    } else if (!text.includes(specs.brand)) return false
  }

  for (const s of specs.series) if (!text.includes(s)) return false
  if (specs.model && !text.includes(specs.model)) return false

  if (specs.alphaNumModel) {
    const { raw, number } = specs.alphaNumModel
    if (!text.includes(raw) && !text.includes(number)) return false
  }

  for (const v of specs.variants) if (!text.includes(v)) return false
  if (specs.storage && !text.includes(`${specs.storage}gb`)) return false
  if (specs.ram && !text.includes(`${specs.ram}gb`)) return false

  return true
}
