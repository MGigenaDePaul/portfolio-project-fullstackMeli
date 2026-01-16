import { tokenize } from './normalize'
import { matchesPathPrefix } from './categoryMatch'
import { buildSearchText } from './text'

const notebookWords = new Set([
  'notebook',
  'notebooks',
  'laptop',
  'laptops',
  'macbook',
  'ultrabook',
])

const notebookBrands = new Set([
  'lenovo',
  'hp',
  'dell',
  'asus',
  'acer',
  'apple',
  'msi',
  'gigabyte',
  'samsung',
  'huawei',
])

const tabletSignals = new Set(['tablet', 'tablets', 'tab', 'ipad', 'matepad'])
const phoneSignals = new Set(['celu', 'celular', 'telefono', 'smartphone'])
const tvSignals = new Set(['tv', 'tele', 'televisor', 'pulgadas'])

export const isNotebookQuery = (q) => {
  const tokens = tokenize(q)

  // cortes anti-choque
  if (
    tokens.some((t) => tabletSignals.has(t)) ||
    tokens.some((t) => phoneSignals.has(t)) ||
    tokens.some((t) => tvSignals.has(t))
  ) {
    return false
  }

  const hasNotebookWord = tokens.some((t) => notebookWords.has(t))
  const hasBrand = tokens.some((t) => notebookBrands.has(t))

  // notebook si:
  // - palabra directa
  // - o marca + contexto notebook
  if (hasNotebookWord) return true

  const hasContext =
    tokens.some((t) => /^\d{1,3}gb$/.test(t)) || // ram / storage
    tokens.some((t) => ['i3', 'i5', 'i7', 'i9', 'ryzen'].includes(t)) ||
    tokens.some((t) => ['ssd', 'hdd', 'nvme'].includes(t))

  return hasBrand && hasContext
}

export const extractNotebookSpecs = (q) => {
  const raw = q || ''
  const tokens = tokenize(raw)
  const joined = tokens.join(' ')

  // brand
  let brand = null
  for (const t of tokens) {
    if (notebookBrands.has(t)) {
      brand = t === 'macbook' ? 'apple' : t
      break
    }
  }

  // ram
  let ramGB = null
  const ramMatch = joined.match(/\b(\d{1,3})\s?gb\b/)
  if (ramMatch) ramGB = Number(ramMatch[1])

  // storage
  let storage = null
  const stMatch = joined.match(/\b(\d{1,4})\s?(gb|tb)\b/)
  if (stMatch)
    storage = { value: Number(stMatch[1]), unit: stMatch[2].toLowerCase() }

  // cpu
  let cpu = null
  const intel = joined.match(/\b(i[3579])\b/)
  const ryzen = joined.match(/\bryzen\s?([3579])\b/)
  if (intel) cpu = { brand: 'intel', tier: intel[1] }
  else if (ryzen) cpu = { brand: 'amd', tier: `ryzen${ryzen[1]}` }

  return { brand, ramGB, storage, cpu }
}

export const isNotebookProduct = (product) => {
  // fuerte por categoría
  if (matchesPathPrefix(product, ['tecnologia', 'notebooks'])) return true

  // fallback por texto
  const text = buildSearchText(product)
  return (
    text.includes('notebook') ||
    text.includes('laptop') ||
    text.includes('macbook') ||
    text.includes('ultrabook')
  )
}

export const matchesNotebookSpecs = (product, specs) => {
  const text = buildSearchText(product)

  if (specs.brand) {
    if (specs.brand === 'apple') {
      if (!text.includes('macbook') && !text.includes('apple')) return false
    } else if (!text.includes(specs.brand)) {
      return false
    }
  }

  if (specs.cpu) {
    if (!text.includes(specs.cpu.tier)) return false
  }

  if (specs.ramGB && !text.includes(`${specs.ramGB}gb`)) return false

  if (specs.storage) {
    const st = `${specs.storage.value}${specs.storage.unit}`
    if (!text.includes(st)) return false
  }

  return true
}
