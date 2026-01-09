export const normalize = (str = '') =>
  String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca tildes

const vehicleKeywords = new Set([
  'auto',
  'autos',
  'vehiculo',
  'vehiculos',
  'camioneta',
  'camionetas',
  'moto',
  'motos',
  'pickup',
  'pickups',
  'camion',
  'camiones',
])

export const isVehicleIntent = (q) => {
  // split simple por espacios
  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.some((t) => vehicleKeywords.has(t))
}

// Detecta autos reales por categoria exacta (la que vos pediste)
export const isVehicleCategory = (product) => {
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

/*------------------------------ */
const tokenize = (q = '') => normalize(q).split(/\s+/).filter(Boolean)

// --- CAMERAS ---
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

// Palabras que indican "intención" (no aportan a filtrar por producto concreto)
const intentWords = new Set([...vehicleKeywords, ...cameraKeywords])

const meaningfulTokens = (q) =>
  tokenize(q).filter((t) => !stopwords.has(t) && !intentWords.has(t))

export const matchesQuery = (product, q) => {
  const tokens = meaningfulTokens(q)

  // si el user solo puso "autos" o "camaras" => tokens vacío
  // devolvemos true y que manden las reglas por intención en SearchResults.jsx
  if (tokens.length === 0) return true

  const text = buildSearchText(product)
  return tokens.every((t) => text.includes(t))
}
