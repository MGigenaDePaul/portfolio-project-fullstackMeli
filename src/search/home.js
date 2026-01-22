import { tokenize } from './normalize'

const PET_WORDS = new Set([
  'perro',
  'perros',
  'gato',
  'gatos',
  'mascota',
  'mascotas',
  'cucha',
  'cuchita',
])

const BED_WORDS = new Set([
  'cama',
  'camas',
  'colchon',
  'colchones',
  'sommier',
  'somier',
])

const LIVING_WORDS = new Set([
  'sillon',
  'sillones',
  'sofa',
  'sofá',
  'couch',
  'living',
])

const INSUMOS_WORDS = new Set([
  'consorcio',
  'basura',
  'residuo',
  'residuos',
  'consorciales',
  'consorcial',
])

const CLEAN_WORDS = new Set([
  'lavandina',
  'detergente',
  'desinfectante',
  'limpieza',
  'escoba',
  'trapo',
])

const PARRILLA_WORDS = new Set(['parrilla', 'parrillas', 'asador', 'brasero'])

const BOXEO_WORDS = new Set(['boxeo', 'box'])

export const parseHomeQuery = (q) => {
  const tokens = tokenize(q)

  const hasBoxeo = tokens.some((t) => BOXEO_WORDS.has(t))
  if (hasBoxeo) return null // 👈 clave: no robar “bolsa de boxeo”

  const hasPet = tokens.some((t) => PET_WORDS.has(t))
  const hasBed = tokens.some((t) => BED_WORDS.has(t))
  const hasLiving = tokens.some((t) => LIVING_WORDS.has(t))
  const hasInsumos = tokens.some((t) => INSUMOS_WORDS.has(t))
  const hasClean = tokens.some((t) => CLEAN_WORDS.has(t))
  const hasParrilla = tokens.some((t) => PARRILLA_WORDS.has(t))

  // PRIORIDAD: mascotas gana sobre cama/colchón
  if (hasPet) {
    return { type: 'home', categoryHint: ['hogar', 'mascotas'] }
  }

  if (hasBed) {
    return {
      type: 'home',
      categoryHint: ['hogar', 'dormitorio', 'camas y colchones'],
    }
  }

  if (hasParrilla) {
    return { type: 'home', categoryHint: ['hogar', 'parrillas'] }
  }

  if (hasLiving) {
    return { type: 'home', categoryHint: ['hogar', 'living'] }
  }

  if (hasClean) {
    return { type: 'home', categoryHint: ['hogar', 'limpieza'] }
  }

  if (hasInsumos) {
    return { type: 'home', categoryHint: ['hogar', 'insumos'] }
  }

  return null
}
