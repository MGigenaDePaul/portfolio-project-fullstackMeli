export const normalize = (str = '') =>
  String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca tildes

const tokenize = (q = '') => normalize(q).split(/\s+/).filter(Boolean)

const carKeywords = new Set([
  'auto',
  'autos',
  'vehiculo',
  'vehiculos',
  'camioneta',
  'camionetas',
  'pickup',
  'pickups',
  'camion',
  'camiones',
])

export const isCarIntent = (q) => {
  const tokens = tokenize(q)
  return tokens.some((t) => carKeywords.has(t))
}

export const isCarCategory = (product) => {
  const cats =
    product.category_path_from_root?.map((c) => normalize(c.name)) ?? []
  return (
    cats.length >= 3 &&
    cats[0] === 'autos' &&
    cats[1] === 'motos y otros' &&
    cats[2] === 'autos y camionetas'
  )
}

// Construye un texto "buscable" a partir de un producto
// combinando título, provincia y categorías, y lo normaliza
// para usarlo en el buscador
export const buildSearchText = (product) => {
  const title = product.title ?? ''
  const state = product.address?.state_name ?? ''
  const cats =
    product.category_path_from_root?.map((c) => c.name).join(' ') ?? ''

  return normalize(`${title} ${state} ${cats}`)
}

// ----------------------- MOTOS ----------------------------------------
const motoKeywords = new Set(['moto', 'motos'])

export const isMotoIntent = (q) => {
  const tokens = tokenize(q)
  return tokens.some((t) => motoKeywords.has(t))
}

export const isMotoCategory = (product) => {
  const cats =
    product.category_path_from_root?.map((c) => normalize(c.name)) ?? []

  return cats.length >= 2 && cats[0] === 'vehiculos' && cats[1] === 'motos'
}

// --- MOTOS / MARCAS ---
const motoBrands = new Set([
  'honda',
  'yamaha',
  'kawasaki',
  'suzuki',
  'ducati',
  'bmw',
  'ktm',
  'triumph',
  'harley',
  'harley-davidson',
  'bajaj',
  'rouser',
  'benelli',
  'zanella',
  'gilera',
  'motomel',
  'corven',
  'hero',
  'royal',
  'royal-enfield',
])

export const extractMotoBrand = (q) => {
  const tokens = tokenize(q)

  // normalizaciones típicas
  if (tokens.includes('harley') && tokens.includes('davidson')) return 'harley'
  if (tokens.includes('royal') && tokens.includes('enfield')) return 'royal'

  return tokens.find((t) => motoBrands.has(t)) || null
}

/*------------------------------ */

// ------------------------ CAMERAS ------------------------------------
const cameraKeywords = new Set(['camara', 'camaras', 'camera', 'cameras'])
const securityKeywords = new Set([
  'seguridad',
  'security',
  'cctv',
  'vigilancia',
])

export const isCameraIntent = (q) => {
  const tokens = tokenize(q)
  return tokens.some((t) => cameraKeywords.has(t))
}

export const isSecurityModifier = (q) => {
  const tokens = tokenize(q)
  return tokens.some((t) => securityKeywords.has(t))
}

// Detecta si un producto es “cámara de seguridad” por texto (título/categorías/etc.)
export const isSecurityCameraProduct = (product) => {
  const text = buildSearchText(product) // ya incluye title+state+cats normalizado
  return (
    text.includes('seguridad') ||
    text.includes('security') ||
    text.includes('cctv') ||
    text.includes('vigilancia')
  )
}

// productos que SON cámaras (no accesorios random)
export const isCameraProduct = (product) => {
  const text = buildSearchText(product)

  const hasCameraWord =
    text.includes('camara') ||
    text.includes('camaras') ||
    text.includes('camera') ||
    text.includes('cameras')

  if (!hasCameraWord) return false

  // Opcional: excluir celulares explícitamente
  const looksLikePhone =
    text.includes('celular') ||
    text.includes('telefono') ||
    text.includes('smartphone') ||
    text.includes('iphone') ||
    text.includes('samsung') ||
    text.includes('xiaomi') ||
    text.includes('motorola')

  if (looksLikePhone) return false

  return true
}

// --- AUTOS / MARCAS ---
const carBrands = new Set([
  'toyota',
  'ford',
  'chevrolet',
  'fiat',
  'renault',
  'volkswagen',
  'vw',
  'peugeot',
  'citroen',
  'honda',
  'nissan',
  'bmw',
  'audi',
  'mercedes',
  'jeep',
  'kia',
  'hyundai',
])

export const extractCarBrand = (q) => {
  const tokens = tokenize(q)
  // si el usuario pone "vw" lo normalizamos a "volkswagen" opcionalmente
  if (tokens.includes('vw')) return 'volkswagen'
  return tokens.find((t) => carBrands.has(t)) || null
}

// --- MATCHING POR TOKENS (para "auto toyota", "camara de seguridad", etc.) ---
const stopwords = new Set([
  'de',
  'del',
  'la',
  'las',
  'el',
  'los',
  'un',
  'una',
  'unos',
  'unas',
  'y',
  'o',
  'para',
  'con',
  'sin',
  'en',
  'por',
  'a',
])

const genericWords = new Set([
  'tecnologia',
  'tecnologico',
  'tecnologica',
  'tech',
  'electronica',
  'electronico',
  'electronicos',
])

// Palabras que indican "intención" (no aportan a filtrar por producto concreto)
const intentWords = new Set([...carKeywords, ...cameraKeywords])

const meaningfulTokens = (q) =>
  tokenize(q).filter(
    (t) => !stopwords.has(t) && !intentWords.has(t) && !genericWords.has(t),
  )

export const matchesQuery = (product, q) => {
  const tokens = meaningfulTokens(q)

  // si el user solo puso "autos" o "camaras" => tokens vacío
  // devolvemos true y que manden las reglas por intención en SearchResults.jsx
  if (tokens.length === 0) return true

  const text = buildSearchText(product)
  return tokens.every((t) => text.includes(t))
}

// --- ROPA (por categoría) ---
const clothingKeywords = new Set([
  'ropa',
  'remera',
  'remeras',
  'camisa',
  'camisas',
  'pantalon',
  'pantalones',
  'zapatilla',
  'zapatillas',
  'buzo',
  'buzos',
  'campera',
  'camperas',
  'vestido',
  'vestidos',
])

export const isClothingIntent = (q) => {
  const tokens = tokenize(q)
  return tokens.some((t) => clothingKeywords.has(t))
}

export const isClothingCategory = (product) => {
  const cats =
    product.category_path_from_root?.map((c) => normalize(c.name)) ?? []

  // Con tu ejemplo: ["ropa y accesorios", "ropa", "camisas", ...]
  return (
    cats.length >= 2 && cats[0] === 'ropa y accesorios' && cats[1] === 'ropa'
  )
}

// (Opcional) si querés excluir accesorios dentro de "Ropa y Accesorios" en el futuro,
// mantené esto con cats[1] === 'ropa' como arriba.

export const getClothingSubcategory = (q) => {
  const tokens = tokenize(q)

  // map “intención del usuario” -> nombre real de categoría (normalizado)
  const map = new Map([
    ['camisa', 'camisas'],
    ['camisas', 'camisas'],

    ['pantalon', 'pantalones'],
    ['pantalones', 'pantalones'],

    ['campera', 'camperas'],
    ['camperas', 'camperas'],

    ['remera', 'remeras'],
    ['remeras', 'remeras'],

    ['buzo', 'buzos'],
    ['buzos', 'buzos'],

    ['zapatilla', 'zapatillas'],
    ['zapatillas', 'zapatillas'],

    ['vestido', 'vestidos'],
    ['vestidos', 'vestidos'],
  ])

  for (const t of tokens) {
    if (map.has(t)) return map.get(t)
  }
  return null
}

export const isClothingSubcategory = (product, subcatNormalized) => {
  if (!subcatNormalized) return true
  const cats =
    product.category_path_from_root?.map((c) => normalize(c.name)) ?? []
  // cats[2] = "camisas" / "pantalones" / "camperas"...
  return cats.length >= 3 && cats[2] === subcatNormalized
}

// --- CARNES (por categoría real) ---
const meatKeywords = new Set([
  'carne',
  'carnes',
  'asado',
  'cordero',
  'vacuno',
  'res',
  'pollo',
  'cerdo',
  'bondiola',
  'milanesa',
  'hamburguesa',
  'hamburguesas',
  'chorizo',
  'salchicha',
])

export const isMeatIntent = (q) => {
  const tokens = tokenize(q)
  return tokens.some((t) => meatKeywords.has(t))
}

export const isMeatCategory = (product) => {
  const cats =
    product.category_path_from_root?.map((c) => normalize(c.name)) ?? []
  // ["alimentos y bebidas", "carnes", "cordero"]
  return (
    cats.length >= 2 &&
    cats[0] === 'alimentos y bebidas' &&
    cats[1] === 'carnes'
  )
}

// Subcategorías (3er nivel) - opcional
export const getMeatSubcategory = (q) => {
  const tokens = tokenize(q)

  const map = new Map([
    ['cordero', 'cordero'],
    ['vacuno', 'vacuno'],
    ['res', 'vacuno'],
    ['pollo', 'pollo'],
    ['cerdo', 'cerdo'],
    // si después tenés "pescados y mariscos" sería otra intención
  ])

  for (const t of tokens) {
    if (map.has(t)) return map.get(t)
  }
  return null
}

export const isMeatSubcategory = (product, subcatNormalized) => {
  if (!subcatNormalized) return true
  const cats =
    product.category_path_from_root?.map((c) => normalize(c.name)) ?? []
  return cats.length >= 3 && cats[2] === subcatNormalized
}

// --- BICICLETAS (por categoría real) ---
const bikeKeywords = new Set([
  'bici',
  'bicis',
  'bicicleta',
  'bicicletas',
  'mtb',
  'mountain',
  'ruta',
  'road',
  'bmx',
  'fixie',
  'plegable',
])

export const isBikeIntent = (q) => {
  const tokens = tokenize(q)
  return tokens.some((t) => bikeKeywords.has(t))
}

// Categoría exacta:
// ["deportes y fitness", "ciclismo", "bicicletas"]
export const isBikeCategory = (product) => {
  const cats =
    product.category_path_from_root?.map((c) => normalize(c.name)) ?? []

  return (
    cats.length >= 3 &&
    cats[0] === 'deportes y fitness' &&
    cats[1] === 'ciclismo' &&
    cats[2] === 'bicicletas'
  )
}

// Subcategoría opcional (si algún día agregás 4to nivel)
export const getBikeSubcategory = (q) => {
  const tokens = tokenize(q)

  const map = new Map([
    ['mtb', 'mountain'],
    ['mountain', 'mountain'],
    ['ruta', 'ruta'],
    ['road', 'ruta'],
    ['bmx', 'bmx'],
    ['fixie', 'fixie'],
    ['plegable', 'plegable'],
  ])

  for (const t of tokens) {
    if (map.has(t)) return map.get(t)
  }
  return null
}

export const isBikeSubcategory = (product, subcatNormalized) => {
  if (!subcatNormalized) return true

  const text = buildSearchText(product)
  return text.includes(subcatNormalized)
}

// --- CELULARES / PHONES ---
const phoneKeywords = new Set([
  'celular',
  'celulares',
  'telefono',
  'telefonos',
  'smartphone',
  'smartphones',
  'iphone',
  'android',
])

const phoneBrands = new Set([
  'iphone',
  'apple',
  'samsung',
  'xiaomi',
  'motorola',
  'huawei',
  'nokia',
  'oneplus',
  'realme',
  'oppo',
  'poco',
  'redmi',
])

export const isPhoneIntent = (q) => {
  const tokens = tokenize(q)
  return tokens.some((t) => phoneKeywords.has(t) || phoneBrands.has(t))
}

export const extractPhoneBrand = (q) => {
  const tokens = tokenize(q)

  if (tokens.includes('iphone') || tokens.includes('apple')) return 'iphone'
  if (tokens.includes('redmi') || tokens.includes('poco')) return 'xiaomi'

  return tokens.find((t) => phoneBrands.has(t)) || null
}

export const isPhoneProduct = (product) => {
  const text = buildSearchText(product)

  // debe parecer teléfono
  const looksLikePhone =
    text.includes('celular') ||
    text.includes('telefono') ||
    text.includes('smartphone') ||
    text.includes('iphone') ||
    text.includes('android')

  if (!looksLikePhone) return false

  // opcional: excluir fundas / cargadores / templados (si te aparecen)
  const isAccessory =
    text.includes('funda') ||
    text.includes('cargador') ||
    text.includes('vidrio') ||
    text.includes('templado') ||
    text.includes('case')

  if (isAccessory) return false

  return true
}

// --- CELULARES: Parser genérico ---
const phoneVariantWords = new Set([
  'mini',
  'pro',
  'max',
  'ultra',
  'lite',
  'plus',
  'se',
  'prime',
  'neo',
  't',
  's',
  '5g',
])

const brandAliases = new Map([
  ['apple', 'iphone'],
  ['iphone', 'iphone'],
  ['huawei', 'huawei'],
  ['xiaomi', 'xiaomi'],
  ['redmi', 'xiaomi'],
  ['poco', 'xiaomi'],
  ['samsung', 'samsung'],
  ['motorola', 'motorola'],
  ['nokia', 'nokia'],
  ['oneplus', 'oneplus'],
  ['realme', 'realme'],
  ['oppo', 'oppo'],
])

const xiaomiSeries = new Set(['redmi', 'note', 'mi', 'poco'])
const huaweiSeries = new Set(['mate', 'nova', 'p'])

const isNumberToken = (t) => /^\d{1,3}$/.test(t)
const isGBToken = (t) => /^\d{1,4}gb$/.test(t)

export const parsePhoneQuery = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')

  // marca
  let brand = null
  for (const t of tokens) {
    if (brandAliases.has(t)) {
      brand = brandAliases.get(t)
      break
    }
  }

  // series
  const series = []
  if (brand === 'xiaomi') {
    for (const t of tokens) if (xiaomiSeries.has(t)) series.push(t)
  } else if (brand === 'huawei') {
    for (const t of tokens) if (huaweiSeries.has(t)) series.push(t)
  }

  // modelo numérico (14, 15, 13...)
  let model = null
  for (const t of tokens) {
    if (isNumberToken(t)) {
      model = t
      break
    }
  }

  // modelo alfanumérico (x6, p30, 13t...)
  let alphaNumModel = null
  for (const t of tokens) {
    const m = t.match(/^([a-z]+)?(\d{1,3})([a-z])?$/)
    if (m && !isNumberToken(t)) {
      alphaNumModel = { raw: t, prefix: m[1], number: m[2], suffix: m[3] }
      break
    }
  }

  // variantes
  const variants = []
  for (const t of tokens) if (phoneVariantWords.has(t)) variants.push(t)

  // storage/ram (simple)
  let storage = null
  let ram = null

  // soporte "8gb/256gb"
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

  return { brand, series, model, alphaNumModel, variants, storage, ram }
}

export const matchesPhoneSpecs = (product, specs) => {
  const text = buildSearchText(product)

  // marca
  if (specs.brand) {
    if (specs.brand === 'iphone') {
      if (!text.includes('iphone')) return false
    } else if (!text.includes(specs.brand)) {
      return false
    }
  }

  // series
  for (const s of specs.series) {
    if (!text.includes(s)) return false
  }

  // modelo numérico
  if (
    specs.model &&
    !text.includes(` ${specs.model}`) &&
    !text.includes(specs.model)
  )
    return false

  // modelo alfanumérico
  if (specs.alphaNumModel) {
    const { raw, number } = specs.alphaNumModel
    if (!text.includes(raw) && !text.includes(number)) return false
  }

  // variantes (pro, 5g, max, etc.)
  for (const v of specs.variants) {
    if (!text.includes(v)) return false
  }

  // storage / ram
  if (specs.storage && !text.includes(`${specs.storage}gb`)) return false
  if (specs.ram && !text.includes(`${specs.ram}gb`)) return false

  return true
}
