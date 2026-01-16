import { tokenize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

const tabletWords = new Set([
  'tablet',
  'tablets',
  'tab',
  'ipad',
  'galaxy',
  'lenovo',
  'amazon',
  'fire',
])

const tabletBrands = new Set([
  'apple',
  'ipad',
  'samsung',
  'xiaomi',
  'lenovo',
  'huawei',
  'amazon',
  'fire',
  'alcatel',
  'nokia',
])

const connectivityWords = new Set(['wifi', 'wi-fi', 'lte', '4g', '5g'])
const accessoryWords = new Set([
  'funda',
  'case',
  'cargador',
  'cable',
  'templado',
  'vidrio',
  'glass',
  'pencil',
  'lapiz',
  'teclado',
  'keyboard',
  'stylus',
])

// para evitar choques con celular/notebook/tv
const phoneSignals = new Set(['celular', 'telefono', 'smartphone'])
const notebookSignals = new Set([
  'notebook',
  'laptop',
  'ram',
  'ssd',
  'ryzen',
  'intel',
  'i5',
  'i7',
  'i9',
])
const tvSignals = new Set([
  'tv',
  'tele',
  'televisor',
  'pulgadas',
  '4k',
  'uhd',
  'oled',
  'qled',
  'led',
])

export const isTabletQuery = (q) => {
  const tokens = tokenize(q)

  const tabletWords = new Set(['tablet', 'tablets', 'tab', 'ipad'])
  // “galaxy” solo es re ambiguo, mejor usar “galaxy tab” como señal real
  const tabletPhrases = [
    'galaxy tab',
    'ipad',
    'matepad',
    'lenovo tab',
    'fire hd',
  ]

  const notebookSignals = new Set([
    'notebook',
    'laptop',
    'ultrabook',
    'pc',
    'pcs',
  ])
  const phoneSignals = new Set([
    'celu',
    'celular',
    'celulares',
    'telefono',
    'telefonos',
    'smartphone',
  ])
  const tvSignals = new Set([
    'tv',
    'tele',
    'televisor',
    'televisores',
    'pulgadas',
    '4k',
    'uhd',
    'oled',
    'qled',
    'led',
  ])

  // si hay señales claras de otra categoría, no es tablet
  const hasOtherSignal =
    tokens.some((t) => notebookSignals.has(t)) ||
    tokens.some((t) => phoneSignals.has(t)) ||
    tokens.some((t) => tvSignals.has(t))

  if (hasOtherSignal) return false

  // señales “fuertes” de tablet
  const hasTabletWord = tokens.some((t) => tabletWords.has(t))
  const text = tokens.join(' ')
  const hasTabletPhrase = tabletPhrases.some((p) => text.includes(p))

  // señales “de contexto” (opcional): pulgadas típicas + wifi/4g/5g + gb
  const hasInches = /\b(\d{1,2}(?:[.,]\d)?)\s*(\"|pulgadas|inch|in)\b/.test(q) // ej 10.1"
  const hasConnectivity = tokens.some((t) =>
    ['wifi', 'wi-fi', 'lte', '4g', '5g'].includes(t),
  )
  const hasGB = tokens.some((t) => /^\d{1,4}gb$/.test(t))
  const hasTabletContext = hasInches || hasConnectivity || hasGB

  // ✅ tablet si: palabra/phrase de tablet, o contexto + marca
  const brands = new Set([
    'apple',
    'ipad',
    'samsung',
    'xiaomi',
    'lenovo',
    'huawei',
    'amazon',
    'fire',
    'alcatel',
    'nokia',
  ])
  const hasBrand = tokens.some((t) => brands.has(t))

  if (hasTabletWord || hasTabletPhrase) return true
  return hasBrand && hasTabletContext
}

const isNumberToken = (t) => /^\d{1,3}$/.test(t)
const isGBToken = (t) => /^\d{1,4}gb$/.test(t)

export const extractTabletSpecs = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')

  // brand
  let brand = null
  for (const t of tokens) {
    if (tabletBrands.has(t)) {
      // normalizar
      if (t === 'ipad') brand = 'apple'
      else if (t === 'fire') brand = 'amazon'
      else brand = t
      break
    }
  }

  // pulgadas (10, 10.1, 11, 12.9, etc)
  // soporta: "10.1", "10,1", "11\"", "12.9 pulgadas"
  const inchMatch = joined.match(
    /\b(\d{1,2}(?:[.,]\d)?)\s*(\"|pulgadas|inch|in)?\b/,
  )
  const inches = inchMatch
    ? Number(String(inchMatch[1]).replace(',', '.'))
    : null

  // conectividad
  let connectivity = null
  for (const t of tokens) {
    if (connectivityWords.has(t)) {
      connectivity = t === 'wi-fi' ? 'wifi' : t
      break
    }
  }

  // ram / storage
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

  // modelo simple (ej: "s9", "s8", "a9", "m10", "p11", etc)
  let model = null
  for (const t of tokens) {
    // no agarrar pulgadas sueltas como modelo (ej "10")
    if (isNumberToken(t)) continue
    const m = t.match(/^([a-z]+)(\d{1,3})([a-z])?$/)
    if (m) {
      model = t
      break
    }
  }

  const wantsKeyboard = tokens.some((t) => t === 'teclado' || t === 'keyboard')
  const wantsPencil = tokens.some(
    (t) => t === 'pencil' || t === 'lapiz' || t === 'stylus',
  )

  return {
    brand,
    inches,
    connectivity,
    storage,
    ram,
    model,
    wantsKeyboard,
    wantsPencil,
  }
}

export const isTabletProduct = (product) => {
  if (matchesPathPrefix(product, ['tecnologia', 'tablets'])) return true

  // fallback por texto
  const text = buildSearchText(product)
  const looksLikeTablet =
    text.includes('tablet') ||
    text.includes('ipad') ||
    text.includes('galaxy tab') ||
    text.includes('tab ') ||
    text.includes('fire hd')

  if (!looksLikeTablet) return false

  // evitar accesorios
  const isAccessory = Array.from(accessoryWords).some((w) => text.includes(w))
  return !isAccessory
}

// extraer pulgadas del producto (si están en title)
export const extractProductInches = (product) => {
  const title = String(product?.title || '').toLowerCase()
  const m = title.match(/\b(\d{1,2}(?:[.,]\d)?)\s*(\"|pulgadas|inch|in)\b/)
  return m ? Number(String(m[1]).replace(',', '.')) : null
}

export const matchesTabletSpecs = (product, specs) => {
  const text = buildSearchText(product)

  if (specs.brand) {
    if (specs.brand === 'apple') {
      if (!text.includes('ipad') && !text.includes('apple')) return false
    } else if (!text.includes(specs.brand)) {
      return false
    }
  }

  if (specs.model) {
    // modelo como "s9" "p11" etc
    if (!text.includes(specs.model)) return false
  }

  if (specs.connectivity) {
    // wifi/lte/4g/5g etc
    if (!text.includes(specs.connectivity)) return false
  }

  if (specs.storage && !text.includes(`${specs.storage}gb`)) return false
  if (specs.ram && !text.includes(`${specs.ram}gb`)) return false

  if (specs.inches) {
    const pInches = extractProductInches(product)
    // si el producto no tiene pulgadas en el título, no filtramos por pulgadas (para no matar resultados)
    if (pInches && Math.abs(pInches - specs.inches) > 0.15) return false
  }

  // si pide teclado/pencil, lo tratamos como "preferencia": filtro suave
  // (si querés hacerlo estricto, cambiá a return false)
  if (
    specs.wantsKeyboard &&
    !(text.includes('teclado') || text.includes('keyboard'))
  ) {
    // no lo descartamos, pero en ranking lo podrías premiar
  }
  if (
    specs.wantsPencil &&
    !(
      text.includes('pencil') ||
      text.includes('lapiz') ||
      text.includes('stylus')
    )
  ) {
    // idem
  }

  return true
}
