// search/televisores.js
import { tokenize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

const tvWords = new Set([
  'tv',
  'tele',
  'teles',
  'televisor',
  'televisores',
  'smart',
  'smarttv',
  'smart-tv',
  'pantalla',
])

const resolutionWords = new Set(['8k', '4k', 'uhd', 'fullhd', 'full', 'hd'])
const panelWords = new Set(['oled', 'qled', 'led'])

export const isTvQuery = (q) => {
  const tokens = tokenize(q)
  return tokens.some((t) => tvWords.has(t))
}

export const extractTvSpecs = (q) => {
  const text = q

  // pulgadas: 43, 50, 55, 65, etc. con o sin "pulgadas"/"
  const inchMatch = text.match(
    /(?:^|\s)(\d{2,3})\s*(pulgadas|\"|inch|in)?(?:\s|$)/,
  )
  const inches = inchMatch ? Number(inchMatch[1]) : null

  // resolución
  let resolution = null
  if (text.includes('8k')) resolution = '8k'
  else if (text.includes('4k') || text.includes('uhd')) resolution = '4k'
  else if (text.includes('full hd') || text.includes('fullhd'))
    resolution = 'fullhd'
  else if (text.includes('hd')) resolution = 'hd'

  // panel
  let panel = null
  if (text.includes('oled')) panel = 'oled'
  else if (text.includes('qled')) panel = 'qled'
  else if (text.includes('led')) panel = 'led'

  return { inches, resolution, panel }
}

export const isTvProduct = (product) => {
  // fuerte por categoría
  if (matchesPathPrefix(product, ['tecnologia', 'televisores'])) return true

  // fallback por texto (por si algún producto quedó mal categorizado)
  const text = buildSearchText(product)
  return (
    text.includes('televisor') ||
    text.includes('smart tv') ||
    text.includes(' tv ')
  )
}

export const extractProductInches = (product) => {
  const title = String(product?.title || '').toLowerCase()
  const m = title.match(/(\d{2,3})\s*(\"|pulgadas|inch|in)/)
  return m ? Number(m[1]) : null
}

export const matchesTvSpecs = (product, tvSpecs) => {
  const title = String(product?.title || '').toLowerCase()
  const text = buildSearchText(product) // ya normalizado

  // pulgadas exactas (simple y efectivo)
  if (tvSpecs?.inches) {
    const pInches = extractProductInches(product)
    if (!pInches || pInches !== tvSpecs.inches) return false
  }

  // resolución
  if (tvSpecs?.resolution) {
    // contemplar "uhd" como 4k, etc
    if (tvSpecs.resolution === '4k') {
      if (
        !(
          title.includes('4k') ||
          title.includes('uhd') ||
          text.includes('4k') ||
          text.includes('uhd')
        )
      )
        return false
    } else if (tvSpecs.resolution === 'fullhd') {
      if (!(text.includes('full hd') || text.includes('fullhd'))) return false
    } else {
      if (!text.includes(tvSpecs.resolution)) return false
    }
  }

  // panel
  if (tvSpecs?.panel) {
    if (!text.includes(tvSpecs.panel)) return false
  }

  return true
}
