import { normalize } from './normalize'
import { detectIntent } from './intent'
import { matchesPathPrefix } from './categoryMatch'
import { matchesQueryText, buildSearchText } from './text'
import { isPhoneProduct, matchesPhoneSpecs } from './phone'
import { rankResults } from './rank'
import { matchesVehicleFilters, vehicleDropTokens } from './vehicle'
import { isNotebookProduct, matchesNotebookSpecs } from './notebook'
import { isPcProduct, matchesPcSpecs } from './pc'
import { isHeadphoneProduct } from './auriculares'
import { isTvProduct, matchesTvSpecs } from './televisores'
import { isTabletProduct, matchesTabletSpecs } from './tablet'

export function searchProducts(all, rawQuery, { limit = 4 } = {}) {
  const q = normalize(rawQuery || '')
  const intent = detectIntent(q)

  let pool = all

  // 1) pool por categoría (fuerte)
  if (intent.categoryHint?.length) {
    pool = pool.filter((p) => matchesPathPrefix(p, intent.categoryHint))
  }

  // 2) filtros especiales
  if (intent.type === 'phone') {
    pool = pool.filter((p) => isPhoneProduct(p))
    pool = pool.filter((p) => matchesPhoneSpecs(p, intent.phoneSpecs))
  }

  if (intent.type === 'notebook') {
    pool = pool.filter((p) => isNotebookProduct(p))
    pool = pool.filter((p) => matchesNotebookSpecs(p, intent.notebookSpecs))
  }

  if (intent.type === 'pc') {
    pool = pool.filter((p) => isPcProduct(p))
    pool = pool.filter((p) => matchesPcSpecs(p, intent.pcSpecs))
  }
  
  if (intent.type === 'tablet') {
    pool = pool.filter((p) => isTabletProduct(p))
    pool = pool.filter((p) => matchesTabletSpecs(p, intent.tabletSpecs))
  }

  if (intent.type === 'headphone') {
    pool = pool.filter((p) => isHeadphoneProduct(p))
  }

  if (intent.type === 'tv') {
    pool = pool.filter((p) => isTvProduct(p))
    pool = pool.filter((p) => matchesTvSpecs(p, intent.tvSpecs))
  }

  if (intent.type === 'camera') {
    // fallback por texto para evitar colados raros (por si hay alguno mal categorizado)
    pool = pool.filter((p) => {
      const t = buildSearchText(p)
      return (
        t.includes('camara') ||
        t.includes('camera') ||
        t.includes('camaras') ||
        t.includes('cameras')
      )
    })
  }

  // 3) brand (incluye truck también)
  if (
    (intent.type === 'car' ||
      intent.type === 'moto' ||
      intent.type === 'truck') &&
    intent.brand
  ) {
    pool = pool.filter((p) => buildSearchText(p).includes(intent.brand))
  }

  // 3.5) vehicle filters (suave): si filtrar deja 0, no rompemos
  if (
    (intent.type === 'car' ||
      intent.type === 'moto' ||
      intent.type === 'truck') &&
    intent.vehicleFilters
  ) {
    const filtered = pool.filter((p) =>
      matchesVehicleFilters(p, intent.vehicleFilters),
    )
    if (filtered.length > 0) pool = filtered
  }

  // 4) tokens a ignorar para el match de texto (palabras de intención)
  const drop = []

  if (intent.type === 'car') drop.push('auto', 'autos')
  if (intent.type === 'moto') drop.push('moto', 'motos')

  if (intent.type === 'truck') {
    // vos dijiste que camion/camiones no los vas a usar por ahora
    drop.push('camioneta', 'camionetas', 'pickup', 'pickups')
  }

  if (
    intent.type === 'car' ||
    intent.type === 'moto' ||
    intent.type === 'truck'
  ) {
    drop.push(...vehicleDropTokens(q))
  }

  if (intent.type === 'camera') {
    drop.push(
      'camara',
      'camaras',
      'camera',
      'cameras',
      'seguridad',
      'security',
      'cctv',
      'vigilancia',
    )
  }

  if (intent.type === 'headphone') {
    drop.push(
      'auricular',
      'auriculares',
      'headphone',
      'headphones',
      'inear',
      'in',
      'ear',
      'over',
    )
  }

  // 4.9) query para match de texto (sinónimos)
  let qForText = q

  if (intent.type === 'notebook') {
    qForText = `${q} notebook laptop macbook ultrabook`
  }

  // 5) match texto general
  let items = qForText
    ? pool.filter((p) => matchesQueryText(p, qForText, { drop }))
    : pool

  // 6) fallback importante: si intent es fuerte y el filtro de texto dejó 0, devolvemos el pool
  // (ej: "auto toyota 2015" y tus títulos no tienen 2015 todavía)
  if (q && items.length === 0 && intent.categoryHint?.length) {
    items = pool
  }

  // 7) rank
  items = rankResults(items, { q, intent })

  // 8) breadcrumb
  const breadcrumb =
    items[0]?.category_path_from_root?.map((c) => c.name) ?? null

  return { items: items.slice(0, limit), breadcrumb, intent }
}

/*
Este es el archivo central: agarra todos los productos + lo que escribió el usuario y devuelve:

items (los productos finales)

breadcrumb (categorías para mostrar arriba)

intent (lo que “entendió” la búsqueda)
*/
