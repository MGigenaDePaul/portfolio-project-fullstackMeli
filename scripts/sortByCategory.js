// scripts/sortByCategory.js
import fs from 'fs'
import process from 'process'

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/sortByCategory.js <path-to-json>')
  process.exit(1)
}

const idNum = (id) => {
  const m = String(id).match(/\d+/)
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY
}

// ✅ categoría completa: "herramientas>electricas>taladros"
const catKey = (item) => {
  const key = (item.category_path_from_root || [])
    .map((c) =>
      String(c?.name || '')
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean)
    .join('>')
  // sin categoría al final
  return key || 'zzzz_sin_categoria'
}

const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

// Detecta wrapper: { results: [...] } o { details: [...] }
const key = Array.isArray(raw?.results)
  ? 'results'
  : Array.isArray(raw?.details)
    ? 'details'
    : null

if (!key) {
  console.error(
    'JSON format not recognized. Expected {results:[...]} or {details:[...]}',
  )
  process.exit(1)
}

raw[key].sort((a, b) => {
  // 1) agrupar por categoría completa
  const ca = catKey(a)
  const cb = catKey(b)
  if (ca < cb) return -1
  if (ca > cb) return 1

  // 2) dentro de la misma categoría, ordenar por ID numérico
  return idNum(a.id) - idNum(b.id)
})

fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n', 'utf-8')
console.log(`OK: sorted ${key} by full category > id in ${filePath}`)
