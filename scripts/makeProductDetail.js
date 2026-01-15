// scripts/makeProductDetail.js
import fs from 'fs'
import process from 'process'

const inputProducts = process.argv[2]
const outputDetail = process.argv[3] || 'src/data/productDetail.json'

// Flags opcionales
const REFRESH_DESCRIPTION = process.argv.includes('--refresh-description') // si querés regenerar description cuando cambia title
const REFRESH_CONDITION = process.argv.includes('--refresh-condition') // si querés forzar condition='new' siempre

if (!inputProducts) {
  console.error(
    'Usage: node scripts/makeProductDetail.js <products.json> <productDetail.json> [--refresh-description] [--refresh-condition]',
  )
  process.exit(1)
}

// ---------- helpers ----------
const idNum = (id) => {
  const m = String(id).match(/\d+/)
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY
}

const normalize = (s = '') =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const soldQty = (p) => {
  const cats = (p.category_path_from_root || []).map((c) => normalize(c.name))
  const t = normalize(p.title)

  if (cats.includes('vehiculos')) {
    if (
      t.includes('bugatti') ||
      t.includes('pagani') ||
      t.includes('koenigsegg')
    )
      return rand(0, 3)
    return rand(1, 40)
  }

  if (t.includes('neumatic')) return rand(150, 3000)
  if (t.includes('llanta') || t.includes('rueda')) return rand(80, 1200)
  if (t.includes('luz') || t.includes('faro')) return rand(120, 2000)

  if (cats.includes('alimentos')) return rand(300, 15000)
  if (cats.includes('ciclismo')) return rand(200, 6000)

  return rand(50, 4000)
}

const descriptionFor = (p) =>
  `${p.title}. Producto nuevo, ideal para su categoría. Publicación orientativa con características generales.`

// ---------- leer products.json ----------
const rawProducts = JSON.parse(fs.readFileSync(inputProducts, 'utf-8'))
const products = Array.isArray(rawProducts) ? rawProducts : rawProducts.results

// IDs válidos (los que EXISTEN en products.json)
const validIds = new Set(products.map((p) => p.id))

// ---------- leer productDetail.json EXISTENTE ----------
let existingRaw = { details: [] }
if (fs.existsSync(outputDetail)) {
  existingRaw = JSON.parse(fs.readFileSync(outputDetail, 'utf-8'))
}
const existing = Array.isArray(existingRaw?.details) ? existingRaw.details : []

// indexar por id
const map = new Map(existing.map((p) => [p.id, p]))

let added = 0
let removed = 0
let updated = 0
let updatedImages = 0
let updatedPrice = 0
let updatedTitle = 0
let updatedCategory = 0
let updatedDescription = 0

// ---------- 1) eliminar IDs que ya no existen ----------
for (const d of existing) {
  if (!validIds.has(d.id)) {
    map.delete(d.id)
    removed++
  }
}

// ---------- 2) merge por ID (no importa el orden del array) ----------
for (const p of products) {
  const prev = map.get(p.id)

  if (prev) {
    let changed = false

    // ✅ sincronizar campos "base" desde products.json
    if (p.title != null && p.title !== prev.title) {
      prev.title = p.title
      updatedTitle++
      changed = true

      // opcional: refrescar description si title cambia
      if (REFRESH_DESCRIPTION) {
        prev.description = descriptionFor(p)
        updatedDescription++
      }
    }

    if (typeof p.price === 'number' && p.price !== prev.price) {
      prev.price = p.price
      updatedPrice++
      changed = true
    }

    if (Array.isArray(p.category_path_from_root)) {
      const nextCat = JSON.stringify(p.category_path_from_root)
      const prevCat = JSON.stringify(prev.category_path_from_root ?? [])
      if (nextCat !== prevCat) {
        prev.category_path_from_root = p.category_path_from_root
        updatedCategory++
        changed = true
      }
    }

    // ✅ imágenes: thumbnail -> fullImage
    if (p.thumbnail != null && p.thumbnail !== prev.fullImage) {
      prev.fullImage = p.thumbnail
      updatedImages++
      changed = true
    }

    // opcional: forzar condition='new'
    if (REFRESH_CONDITION && prev.condition !== 'new') {
      prev.condition = 'new'
      changed = true
    }

    if (changed) updated++
    map.set(p.id, prev)
  } else {
    // ✅ crear nuevo
    map.set(p.id, {
      id: p.id,
      title: p.title,
      price: p.price,
      condition: 'new',
      sold_quantity: soldQty(p),
      fullImage: p.thumbnail,
      description: descriptionFor(p),
      category_path_from_root: p.category_path_from_root,
    })
    added++
  }
}

// ---------- guardar ----------
const merged = Array.from(map.values()).sort(
  (a, b) => idNum(a.id) - idNum(b.id),
)

fs.writeFileSync(
  outputDetail,
  JSON.stringify({ details: merged }, null, 2),
  'utf-8',
)

console.log(
  `OK: productDetail.json actualizado | total=${merged.length} | added=${added} | removed=${removed} | updated=${updated} | img=${updatedImages} | title=${updatedTitle} | price=${updatedPrice} | category=${updatedCategory} | desc=${updatedDescription}`,
)
