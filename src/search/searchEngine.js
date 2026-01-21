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
import { isSpeakerProduct, matchesSpeakerSpecs } from './parlante'
import { isBeautyProduct, matchesBeautySpecs } from './beauty'
import { isHeladeraProduct, matchesHeladeraSpecs } from './heladera'
import { isLavarropaProduct, matchesLavarropaSpecs } from './lavarropa'
import {
  isRemeraProduct,
  matchesRemeraSpecs,
  remeraDropTokens,
  extractGender,
} from './remera'
import {
  isCarteraProduct,
  matchesCarteraSpecs,
  carteraDropTokens,
} from './cartera'

export function searchProducts(all, rawQuery, { limit = 4 } = {}) {
  const q = normalize(rawQuery || '')
  const intent = detectIntent(q)

  let pool = all

  // 1) pool por categoría (fuerte, pero si deja 0 no rompemos)
  if (intent.categoryHint?.length) {
    const byCat = pool.filter((p) => matchesPathPrefix(p, intent.categoryHint))
    if (byCat.length > 0) pool = byCat
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

  if (intent.type === 'speaker') {
    pool = pool.filter((p) => isSpeakerProduct(p))
    pool = pool.filter((p) => matchesSpeakerSpecs(p, intent.speakerSpecs))
  }

  if (intent.type === 'beauty') {
    pool = pool.filter((p) => isBeautyProduct(p))
    pool = pool.filter((p) => matchesBeautySpecs(p, intent.beautySpecs))
  }

  if (intent.type === 'heladera') {
    pool = pool.filter((p) => isHeladeraProduct(p))
    pool = pool.filter((p) => matchesHeladeraSpecs(p, intent.heladeraSpecs))
  }

  if (intent.type === 'lavarropa') {
    pool = pool.filter((p) => isLavarropaProduct(p))
    pool = pool.filter((p) => matchesLavarropaSpecs(p, intent.lavarropaSpecs))
  }

  if (intent.type === 'remera') {
    console.log('REMERAS start', pool.length)

    const a = pool.filter((p) => isRemeraProduct(p))
    console.log('REMERAS after isRemeraProduct', a.length)

    // 🔍 DEBUG: mostrar qué género tiene cada producto
    a.slice(0, 10).forEach((p) => {
      const text = buildSearchText(p)
      const g = extractGender(text)
      console.log(`📦 ${p.title} → gender: ${g}`)
    })

    const b = a.filter((p) => matchesRemeraSpecs(p, intent.remeraSpecs))
    console.log(
      'REMERAS after matchesRemeraSpecs',
      b.length,
      intent.remeraSpecs,
    )

    pool = b
  }

  if (intent.type === 'cartera') {
    pool = pool.filter((p) => isCarteraProduct(p))
    pool = pool.filter((p) => matchesCarteraSpecs(p, intent.carteraSpecs))
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

  if (intent.type === 'heladera') {
    drop.push(
      'heladera',
      'heladeras',
      'refrigerador',
      'refrigeradora',
      'freezer',
      'no',
      'frost',
      'nofrost',
      'inverter',
      'litro',
      'litros',
      'l',
      'lt',
      'lts',
    )
  }

  if (intent.type === 'remera') {
    drop.push(...remeraDropTokens)
  }

  if (intent.type === 'cartera') {
    drop.push(...carteraDropTokens)
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
