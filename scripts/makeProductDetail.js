import fs from 'fs'
import process from 'process'

const inputProducts = process.argv[2]
const outputDetail = process.argv[3] || 'src/data/productDetail.json'

if (!inputProducts) {
  console.error(
    'Usage: node scripts/makeProductDetail.js <products.json> <productDetail.json>',
  )
  process.exit(1)
}

// ---------- helpers ----------
const idNum = (id) => Number(String(id).replace('MLA', ''))
const inRange = (p) => {
  const n = idNum(p.id)
  return n >= 1001 && n <= 1060 // aca pongo el rango de productos nuevos por id que voy a copiar
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

// ---------- leer productDetail.json EXISTENTE ----------
let existingRaw = { details: [] }

if (fs.existsSync(outputDetail)) {
  existingRaw = JSON.parse(fs.readFileSync(outputDetail, 'utf-8'))
}

const existing = Array.isArray(existingRaw?.details) ? existingRaw.details : []

// indexar por id
const map = new Map(existing.map((p) => [p.id, p]))

// ---------- generar SOLO 421–620 ----------
products.filter(inRange).forEach((p) => {
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
})

// ---------- guardar MERGE ----------
const merged = Array.from(map.values()).sort(
  (a, b) => idNum(a.id) - idNum(b.id),
)

fs.writeFileSync(
  outputDetail,
  JSON.stringify({ details: merged }, null, 2),
  'utf-8',
)

console.log(
  `OK: productDetail.json actualizado (total ${merged.length} productos)`,
)
