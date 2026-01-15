import { tokenize, normalize } from './normalize'
import { buildSearchText } from './text'

// --- helpers ---
const isYear = (t) => /^(19[8-9]\d|20[0-3]\d)$/.test(t) // 1980-2039 aprox
const isCC = (t) => /^(\d{2,4})cc$/.test(t)

const toNumber = (s) => {
  const n = parseInt(String(s), 10)
  return Number.isFinite(n) ? n : null
}

export const parseVehicleQuery = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')

  // año: detecta 2010, 2018, etc.
  let year = null
  for (const t of tokens) {
    if (isYear(t)) {
      year = toNumber(t)
      break
    }
  }

  // estado
  const condition =
    tokens.includes('0km') || tokens.includes('cero') || joined.includes('0 km')
      ? 'new'
      : tokens.includes('usado') || tokens.includes('usados')
        ? 'used'
        : null

  // tracción
  const traction =
    tokens.includes('4x4') || tokens.includes('4wd') || tokens.includes('awd')
      ? '4x4'
      : tokens.includes('4x2') || tokens.includes('2wd')
        ? '4x2'
        : null

  // combustible
  const fuel =
    tokens.includes('diesel') || tokens.includes('gasoil')
      ? 'diesel'
      : tokens.includes('nafta') || tokens.includes('gasolina')
        ? 'nafta'
        : null

  // transmisión
  const transmission =
    tokens.includes('automatico') || tokens.includes('automatica') || tokens.includes('at')
      ? 'auto'
      : tokens.includes('manual')
        ? 'manual'
        : null

  // “full” / “base”
  const trim =
    tokens.includes('full') || tokens.includes('premium')
      ? 'full'
      : tokens.includes('base')
        ? 'base'
        : null

  // cilindrada para motos: "150cc" o "150 cc"
  let cc = null
  for (const t of tokens) {
    if (isCC(t)) {
      cc = toNumber(t.replace('cc', ''))
      break
    }
  }
  if (!cc) {
    const m = joined.match(/\b(\d{2,4})\s*cc\b/)
    if (m) cc = toNumber(m[1])
  }

  return { year, condition, traction, fuel, transmission, trim, cc }
}

// Decide si un producto matchea estos filtros mirando texto.
// OJO: es "suave" (no bloquea todo si el filtro no aplica).
export const matchesVehicleFilters = (product, filters) => {
  const t = buildSearchText(product)

  if (filters.year) {
    if (!t.includes(String(filters.year))) return false
  }

  if (filters.condition === 'new') {
    // buscá señales típicas
    if (!(t.includes('0km') || t.includes('0 km') || t.includes('cero km') || t.includes('nuevo'))) return false
  }
  if (filters.condition === 'used') {
    if (!(t.includes('usado') || t.includes('usados'))) return false
  }

  if (filters.traction === '4x4') {
    if (!(t.includes('4x4') || t.includes('4wd') || t.includes('awd'))) return false
  }
  if (filters.traction === '4x2') {
    if (!(t.includes('4x2') || t.includes('2wd'))) return false
  }

  if (filters.fuel === 'diesel') {
    if (!(t.includes('diesel') || t.includes('gasoil'))) return false
  }
  if (filters.fuel === 'nafta') {
    if (!(t.includes('nafta') || t.includes('gasolina'))) return false
  }

  if (filters.transmission === 'auto') {
    if (!(t.includes('automatico') || t.includes('automatica') || t.includes('at'))) return false
  }
  if (filters.transmission === 'manual') {
    if (!t.includes('manual')) return false
  }

  if (filters.trim === 'full') {
    if (!(t.includes('full') || t.includes('premium'))) return false
  }
  if (filters.trim === 'base') {
    if (!t.includes('base')) return false
  }

  if (filters.cc) {
    // motos: 150cc, 200cc, 250cc
    if (!t.includes(`${filters.cc}cc`)) return false
  }

  return true
}

// tokens a ignorar para el match de texto (para que no mate resultados)
export const vehicleDropTokens = (q) => {
  const tokens = tokenize(q)
  const drop = new Set()

  for (const t of tokens) {
    if (isYear(t)) drop.add(t)
    if (t === '0km') drop.add(t)
    if (t === 'usado' || t === 'usados') drop.add(t)
    if (t === '4x4' || t === '4x2' || t === '4wd' || t === 'awd' || t === '2wd') drop.add(t)
    if (t === 'diesel' || t === 'gasoil' || t === 'nafta' || t === 'gasolina') drop.add(t)
    if (t === 'manual' || t === 'automatico' || t === 'automatica' || t === 'at') drop.add(t)
    if (t === 'full' || t === 'premium' || t === 'base') drop.add(t)
    if (isCC(t)) drop.add(t)
  }

  // también ignorá "cc" si vino separado ("150 cc")
  if (normalize(q).includes(' cc')) drop.add('cc')

  return Array.from(drop)
}
