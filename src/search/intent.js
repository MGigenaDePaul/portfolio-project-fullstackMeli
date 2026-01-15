import { tokenize } from './normalize'
import { KEYWORDS_TO_CATEGORY } from './categoryRegistry'
import { isPhoneQuery, parsePhoneQuery } from './phone'
import { parseVehicleQuery } from './vehicle'
import { parseHomeQuery } from './home'

const securityKeywords = new Set([
  'seguridad',
  'security',
  'cctv',
  'vigilancia',
])
const cameraKeywords = new Set(['camara', 'camaras', 'camera', 'cameras'])

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

const extractBrand = (tokens, brandSet, { vwAlias = false } = {}) => {
  if (vwAlias && tokens.includes('vw')) return 'volkswagen'
  if (tokens.includes('harley') && tokens.includes('davidson')) return 'harley'
  if (tokens.includes('royal') && tokens.includes('enfield')) return 'royal'
  return tokens.find((t) => brandSet.has(t)) || null
}

const truckModels = new Set([
  'hilux',
  'ranger',
  'amarok',
  'frontier',
  's10',
  'toro',
  'dmax',
  'ram',
])


export const detectIntent = (q) => {
  const tokens = tokenize(q)

  // 1) phones (fuerte, con specs)
  if (isPhoneQuery(q)) {
    return {
      type: 'phone',
      categoryHint: ['tecnologia', 'celulares'],
      phoneSpecs: parsePhoneQuery(q),
      brand: null,
    }
  }

  // 2) cameras (seguridad vs normal)
  const isCameraWord = tokens.some((t) => cameraKeywords.has(t))
  const wantsSecurity = tokens.some((t) => securityKeywords.has(t))

  if (isCameraWord || wantsSecurity) {
    return {
      type: 'camera',
      categoryHint: wantsSecurity
        ? ['tecnologia', 'camaras de seguridad']
        : ['tecnologia', 'camaras'],
      cameraSecurity: wantsSecurity,
    }
  }

  // 3) VEHICULOS (autos / motos / camionetas)
  const isMotoWord = tokens.includes('moto') || tokens.includes('motos')
  const isAutoWord = tokens.includes('auto') || tokens.includes('autos')
  const isTruckWord =
  tokens.includes('camioneta') ||
  tokens.includes('camionetas') ||
  tokens.includes('pickup') ||
  tokens.includes('pickups') ||
  tokens.some((t) => truckModels.has(t))


  const motoBrand = extractBrand(tokens, motoBrands)
  const carBrand = extractBrand(tokens, carBrands, { vwAlias: true })

  const vehicleFilters = parseVehicleQuery(q)

  if (isMotoWord) {
    return {
      type: 'moto',
      categoryHint: ['vehiculos', 'motos'],
      brand: motoBrand,
      vehicleFilters
    }
  }

  if (isTruckWord) {
    return {
      type: 'truck',
      categoryHint: ['vehiculos', 'camionetas'],
      brand: carBrand, // sirve para Hilux, Ranger, Amarok, etc.
      vehicleFilters
    }
  }

  if (isAutoWord || carBrand) {
    return {
      type: 'car',
      categoryHint: ['vehiculos', 'autos'],
      brand: carBrand,
      vehicleFilters
    }
  }

  // 4) bolsa + boxeo (AND) --> bolsas de boxeo
  const hasBolsa = tokens.includes('bolsa') || tokens.includes('bolsas')
  const hasBoxeo = tokens.includes('boxeo') || tokens.includes('box')

  if (hasBolsa && hasBoxeo) {
    return {
      type: 'category',
      categoryHint: ['deportes y fitness','boxeo y artes marciales','bolsas de boxeo'],
    }
  }

  // HOGAR
  const homeIntent = parseHomeQuery(q)
  if (homeIntent) return homeIntent

  
  // 5) registry (ropa, carnes, herramientas, etc.)
  for (const rule of KEYWORDS_TO_CATEGORY) {
    if (tokens.some((t) => rule.keywords.includes(t))) {
      return { type: 'category', categoryHint: rule.path }
    }
  }

  return { type: 'generic', categoryHint: null }
}
