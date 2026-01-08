export const normalize = (str = '') =>
  String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca tildes

export const isVehicleIntent = (q) => {
  // split simple por espacios
  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.some((t) => vehicleKeywords.has(t))
}

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
