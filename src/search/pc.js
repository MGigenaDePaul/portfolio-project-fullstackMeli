// search/pc.js
import { tokenize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

// -------------------- señales de query --------------------
const pcWords = new Set([
  'pc',
  'pcs',
  'computadora',
  'computador',
  'desktop',
  'escritorio',
  'torre',
  'gabinete',
  'cpu',
])

// performance / gamer
const gamerWords = new Set([
  'gamer',
  'gaming',
  'rtx',
  'gtx',
  'rx',
  'radeon',
  'geforce',
  'nvidia',
  'ryzen',
  'fps',
  '144hz',
  '240hz',
])

// marcas típicas (OEM / prearmadas)
const pcBrands = new Set([
  'hp',
  'dell',
  'lenovo',
  'asus',
  'acer',
  'msi',
  'gigabyte',
  'aorus',
  'corsair',
  'alienware',
])

// para evitar choques con notebook/tablet/phone
const notebookSignals = new Set(['notebook', 'laptop', 'ultrabook'])
const tabletSignals = new Set(['tablet', 'ipad', 'galaxy', 'tab'])
const phoneSignals = new Set([
  'celu',
  'celular',
  'celulares',
  'telefono',
  'telefonos',
  'smartphone',
])

// -------------------- helpers --------------------
const isGBToken = (t) => /^\d{1,4}gb$/.test(t)
const isTBToken = (t) => /^\d{1,2}tb$/.test(t)

// cpu: i5-12400 / i7 10700 / ryzen 5 5600 / r5 5600
const extractCpu = (joined) => {
  const intel = joined.match(/\b(i[3579])\s*[-]?\s*(\d{4,5})?\b/)
  if (intel) return { brand: 'intel', tier: intel[1], model: intel[2] || null }

  const ryzen = joined.match(/\b(ryzen|r)\s*([3579])\s*([0-9]{4,5}[a-z]?)?\b/)
  if (ryzen) return { brand: 'amd', tier: `r${ryzen[2]}`, model: ryzen[3] || null }

  return { brand: null, tier: null, model: null }
}

// gpu: rtx 3060 / gtx 1660 / rx 6600
const extractGpu = (joined) => {
  const rtx = joined.match(/\brtx\s*(\d{3,4})\b/)
  if (rtx) return { brand: 'nvidia', series: 'rtx', model: rtx[1] }

  const gtx = joined.match(/\bgtx\s*(\d{3,4})\b/)
  if (gtx) return { brand: 'nvidia', series: 'gtx', model: gtx[1] }

  const rx = joined.match(/\brx\s*(\d{3,4})\b/)
  if (rx) return { brand: 'amd', series: 'rx', model: rx[1] }

  if (joined.includes('integrada') || joined.includes('uhd') || joined.includes('vega')) {
    return { brand: 'integrada', series: null, model: null }
  }

  return { brand: null, series: null, model: null }
}

// -------------------- API --------------------
export const isPcQuery = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')

  const hasOtherSignal =
    tokens.some((t) => notebookSignals.has(t)) ||
    tokens.some((t) => tabletSignals.has(t)) ||
    tokens.some((t) => phoneSignals.has(t))

  if (hasOtherSignal) return false

  const hasPcWord = tokens.some((t) => pcWords.has(t))

  const hasSpecSignal =
    /\b(i[3579])\b/.test(joined) ||
    /\bryzen\b|\br[3579]\b/.test(joined) ||
    /\brtx\b|\bgtx\b|\brx\b/.test(joined) ||
    tokens.some((t) => t === 'ram' || t === 'ssd' || t === 'hdd')

  const hasBrand = tokens.some((t) => pcBrands.has(t))
  const hasGamerSignal = tokens.some((t) => gamerWords.has(t)) || joined.includes('pc gamer')

  if (hasPcWord) return true
  if (hasGamerSignal) return true
  return hasBrand && hasSpecSignal
}

export const extractPcSpecs = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')

  // brand
  let brand = null
  for (const t of tokens) {
    if (pcBrands.has(t)) {
      brand = t === 'alienware' ? 'dell' : t
      break
    }
  }

  // gamer
  const wantsGamer =
    joined.includes('pc gamer') ||
    joined.includes('gaming') ||
    tokens.some((t) => gamerWords.has(t))

  // ram / storage
  let ram = null
  let storage = null // en GB (si viene 1TB => 1024)
  let storageType = null // ssd/hdd/nvme

  // "16gb/512gb"
  const combo = joined.match(/\b(\d{1,2})gb\s*[/\-]\s*(\d{2,4})gb\b/)
  if (combo) {
    ram = combo[1]
    storage = combo[2]
  } else {
    // "16/512"
    const combo2 = joined.match(/\b(\d{1,2})\s*[/\-]\s*(\d{2,4})\b/)
    if (combo2) {
      const a = parseInt(combo2[1], 10)
      const b = parseInt(combo2[2], 10)
      if (a >= 4 && a <= 128) ram = String(a)
      if (b >= 64) storage = String(b)
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]

    // ram explícita
    if (t === 'ram' && tokens[i + 1] && isGBToken(tokens[i + 1])) {
      ram = String(parseInt(tokens[i + 1].replace('gb', ''), 10))
    }
    if (isGBToken(t) && tokens[i + 1] === 'ram') {
      ram = String(parseInt(t.replace('gb', ''), 10))
    }

    // storage type
    if (t === 'ssd' || t === 'hdd' || t === 'nvme' || t === 'm2' || t === 'm.2') {
      storageType = t === 'm2' || t === 'm.2' ? 'nvme' : t
      if (tokens[i + 1] && (isGBToken(tokens[i + 1]) || isTBToken(tokens[i + 1]))) {
        if (isTBToken(tokens[i + 1])) storage = String(parseInt(tokens[i + 1], 10) * 1024)
        else storage = String(parseInt(tokens[i + 1].replace('gb', ''), 10))
      }
    }

    // storage por tamaño (heurística)
    if (!storage && isGBToken(t)) {
      const n = parseInt(t.replace('gb', ''), 10)
      if (n >= 128) storage = String(n)
      else if (!ram && n >= 4 && n <= 128) ram = String(n)
    }
    if (!storage && isTBToken(t)) {
      const n = parseInt(t.replace('tb', ''), 10)
      storage = String(n * 1024)
    }
  }

  const cpu = extractCpu(joined)
  const gpu = extractGpu(joined)

  const buildType =
    joined.includes('armada') || joined.includes('armado')
      ? 'armada'
      : joined.includes('prearmada') || joined.includes('pre armado')
        ? 'prearmada'
        : null

  return {
    brand,
    wantsGamer,
    ram,
    storage,
    storageType,
    cpu,
    gpu,
    buildType,
  }
}

export const isPcProduct = (product) => {
  // ✅ fuerte por categoría real
  if (matchesPathPrefix(product, ['tecnologia', 'pcs'])) return true

  // fallback por texto (por si tenés productos mal categorizados)
  const text = buildSearchText(product)
  const looksLikePc =
    text.includes('pc ') ||
    text.includes('pc gamer') ||
    text.includes('computadora') ||
    text.includes('desktop') ||
    text.includes('escritorio') ||
    text.includes('gabinete') ||
    text.includes('torre')

  if (!looksLikePc) return false

  // evitar periféricos / componentes (simple)
  const accessorySignals = [
    'monitor',
    'teclado',
    'mouse',
    'mause',
    'auricular',
    'headset',
    'parlante',
    'impresora',
    'tinta',
    'cartucho',
    'cable',
    'adaptador',
    'mother',
    'motherboard',
    'placa madre',
    'ram ddr',
    'ssd ',
    'hdd ',
  ]
  return !accessorySignals.some((w) => text.includes(w))
}

export const matchesPcSpecs = (product, specs = {}) => {
  const text = buildSearchText(product)

  // brand
  if (specs.brand) {
    if (specs.brand === 'dell') {
      if (!text.includes('dell') && !text.includes('alienware')) return false
    } else if (!text.includes(specs.brand)) {
      return false
    }
  }

  // gamer (estricto)
  if (specs.wantsGamer) {
    const hasGamer =
      text.includes('gamer') ||
      text.includes('gaming') ||
      text.includes('rtx') ||
      text.includes('gtx') ||
      text.includes('rx') ||
      text.includes('geforce') ||
      text.includes('radeon')
    if (!hasGamer) return false
  }

  // ram / storage
  if (specs.ram && !text.includes(`${specs.ram}gb`)) return false

  if (specs.storage) {
    const ok =
      text.includes(`${specs.storage}gb`) ||
      (specs.storage === '1024' && text.includes('1tb'))
    if (!ok) return false
  }

  // cpu
  if (specs.cpu?.tier && !text.includes(specs.cpu.tier)) return false
  if (specs.cpu?.model && !text.includes(String(specs.cpu.model))) return false

  // gpu
  if (specs.gpu?.series && !text.includes(specs.gpu.series)) return false
  if (specs.gpu?.model && !text.includes(String(specs.gpu.model))) return false

  // storageType (suave)
  if (specs.storageType) {
    const st = specs.storageType === 'nvme' ? ['nvme', 'm.2', 'm2'] : [specs.storageType]
    if (!st.some((w) => text.includes(w))) {
      // no lo descartamos para no perder resultados
    }
  }

  return true
}
