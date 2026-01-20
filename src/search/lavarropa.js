import { tokenize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

// -------------------- keywords --------------------
const lavarropaWords = new Set([
  'lavarropa',
  'lavarropas',
  'lavadora',
  'lavadoras',
  'washer',
  'washers',
])

// marcas (normalizadas)
const brandAliases = new Map([
  ['samsung', 'samsung'],
  ['lg', 'lg'],
  ['whirlpool', 'whirlpool'],
  ['electrolux', 'electrolux'],
  ['drean', 'drean'],
  ['patrick', 'patrick'],
  ['philco', 'philco'],
  ['gafa', 'gafa'],
  ['kohinoor', 'kohinoor'],
  ['midea', 'midea'],
  ['bgh', 'bgh'],
  ['hisense', 'hisense'],
  ['bosch', 'bosch'],
  ['siemens', 'siemens'],
  ['ariston', 'ariston'],
  ['indesit', 'indesit'],
])

// -------------------- helpers --------------------
const hasInverter = (text = '') => /\binverter\b/.test(text)

const hasAutomatic = (text = '') => {
  // automatico / automática / automatic
  return /\bautomatic[oa]?\b/.test(text) || /\bautomatic\b/.test(text)
}

const hasSemiAuto = (text = '') =>
  /\bsemi[\s\-]?automatic[oa]?\b/.test(text) || /\bsemi[\s\-]?auto\b/.test(text)

const hasFrontLoad = (text = '') =>
  /\bfrontal\b/.test(text) || /\bfront[\s\-]?load\b/.test(text)

const hasTopLoad = (text = '') =>
  /\bsuperior\b/.test(text) ||
  /\btop[\s\-]?load\b/.test(text) ||
  /\bvertical\b/.test(text)

const extractKg = (rawText = '') => {
  const t = String(rawText)

  // 1) "7kg", "7 kg", "7kgs", "7 kilos"
  const m =
    t.match(/\b(\d{1,2}(?:[.,]\d)?)\s*(kg|kgs|kilos?)\b/i) ||
    t.match(/\b(\d{1,2}(?:[.,]\d)?)\s*(?:kilo|kilos)\b/i)

  if (m) {
    const n = parseFloat(String(m[1]).replace(',', '.'))
    // rango razonable lavarropas
    if (Number.isFinite(n) && n >= 3 && n <= 30) return n
  }

  return null
}

const extractRpm = (rawText = '') => {
  const t = String(rawText)

  // "1200rpm", "1200 rpm", "1400 rpm"
  const m = t.match(/\b(\d{3,4})\s*rpm\b/i)
  if (m) {
    const n = parseInt(m[1], 10)
    if (Number.isFinite(n) && n >= 400 && n <= 2000) return n
  }
  return null
}

const hasDryer = (text = '') => {
  // lava y seca / lavasecarropas / secarropas / dryer
  return (
    /\blava[\s\-]?y[\s\-]?seca\b/.test(text) ||
    /\blavasecarropas\b/.test(text) ||
    /\bsec(ar|ado)ropas\b/.test(text) ||
    /\bdryer\b/.test(text)
  )
}

// señales típicas de lavarropas aunque no digan "lavarropas"
const hasWasherSignals = (text = '') => {
  const kg = extractKg(text)
  const rpm = extractRpm(text)
  return (
    Boolean(kg) ||
    Boolean(rpm) ||
    hasFrontLoad(text) ||
    hasTopLoad(text) ||
    hasAutomatic(text) ||
    hasSemiAuto(text) ||
    hasInverter(text) ||
    hasDryer(text)
  )
}

// -------------------- intent detection --------------------
export const isLavarropaQuery = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')
  const raw = String(q || '').toLowerCase()

  const hasWord = tokens.some((t) => lavarropaWords.has(t))
  const hasBrand = tokens.some((t) => brandAliases.has(t))

  const signals = hasWasherSignals(joined) || hasWasherSignals(raw)

  // regla: marca sola NO alcanza
  if (hasWord) return true
  if (signals) return true
  if (hasBrand && signals) return true

  return false
}

// -------------------- product detection --------------------
export const isLavarropaProduct = (product) => {
  // categoría fuerte (ajustá a tu dataset real)
  if (matchesPathPrefix(product, ['hogar', 'electrodomesticos', 'lavarropas']))
    return true
  if (matchesPathPrefix(product, ['hogar', 'lavarropas'])) return true

  const text = buildSearchText(product)

  const looksLikeWasher =
    text.includes('lavarropa') ||
    text.includes('lavarropas') ||
    text.includes('lavadora') ||
    hasWasherSignals(text)

  if (!looksLikeWasher) return false

  // evitar accesorios / repuestos
  const isAccessory =
    text.includes('manguera') ||
    text.includes('bomba') ||
    text.includes('ruleman') ||
    text.includes('rodamiento') ||
    text.includes('correa') ||
    text.includes('filtro') ||
    text.includes('repuesto') ||
    text.includes('placa') ||
    text.includes('programador') ||
    text.includes('perilla') ||
    text.includes('boton') ||
    text.includes('tapa') ||
    text.includes('cuba') ||
    text.includes('tambor') ||
    text.includes('amortiguador')

  return !isAccessory
}

// -------------------- parser --------------------
export const parseLavarropaQuery = (q) => {
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

  const kg = extractKg(raw) ?? extractKg(joined)
  const rpm = extractRpm(raw) ?? extractRpm(joined)

  let loadType = null // 'front' | 'top' | null
  if (hasFrontLoad(joined) || hasFrontLoad(raw)) loadType = 'front'
  else if (hasTopLoad(joined) || hasTopLoad(raw)) loadType = 'top'

  const inverter = hasInverter(joined) || hasInverter(raw)

  // automatic vs semi
  const semiAuto = hasSemiAuto(joined) || hasSemiAuto(raw)
  const automatic = semiAuto ? false : hasAutomatic(joined) || hasAutomatic(raw)

  const drying = hasDryer(joined) || hasDryer(raw)

  return { brand, kg, rpm, loadType, inverter, automatic, semiAuto, drying }
}

// -------------------- matcher --------------------
export const matchesLavarropaSpecs = (product, specs = {}) => {
  const text = buildSearchText(product)

  if (specs.brand && !text.includes(specs.brand)) return false

  if (specs.loadType === 'front') {
    if (!hasFrontLoad(text)) return false
  }
  if (specs.loadType === 'top') {
    if (!hasTopLoad(text)) return false
  }

  if (specs.inverter === true && !hasInverter(text)) return false

  if (specs.semiAuto === true) {
    if (!hasSemiAuto(text)) return false
  }
  if (specs.automatic === true) {
    // si pide automático, no aceptes semi-auto
    if (hasSemiAuto(text)) return false
    if (!hasAutomatic(text)) return false
  }

  if (specs.drying === true && !hasDryer(text)) return false

  if (specs.kg != null) {
    // match “exacto” (por ahora): 7kg debe aparecer como 7kg o 7 kg
    // si querés tolerancia (±0.5kg) lo cambiamos
    const kgStr = String(specs.kg).replace('.', '[.,]')
    const re = new RegExp(`\\b${kgStr}\\s*(kg|kgs|kilos?)\\b`)
    if (!re.test(text)) return false
  }

  if (specs.rpm != null) {
    if (!new RegExp(`\\b${specs.rpm}\\s*rpm\\b`).test(text)) return false
  }

  return true
}

// -------------------- drop tokens --------------------
export const lavarropaDropTokens = new Set([
  ...lavarropaWords,
  'kg',
  'kgs',
  'kilo',
  'kilos',
  'rpm',
  'frontal',
  'superior',
  'vertical',
  'front',
  'load',
  'top',
  'inverter',
  'automatico',
  'automatica',
  'automatic',
  'semi',
  'auto',
  'lavasecarropas',
  'seca',
  'secado',
  'sec(ar)ropas',
])
