import { tokenize } from './normalize'
import { KEYWORDS_TO_CATEGORY } from './categoryRegistry'
import { isPhoneQuery, parsePhoneQuery } from './phone'
import { parseHomeQuery } from './home'
import { isNotebookQuery, extractNotebookSpecs } from './notebook'
import { isPcQuery, extractPcSpecs } from './pc'
import { isTvQuery, extractTvSpecs } from './televisores'
import { isTabletQuery, extractTabletSpecs } from './tablet'
import { isSpeakerQuery, extractSpeakerSpecs } from './parlante'
import { isBeautyQuery, extractBeautySpecs } from './beauty'
import { isHeladeraQuery, parseHeladeraQuery } from './heladera'
import { isLavarropaQuery, parseLavarropaQuery } from './lavarropa'
import { isRemeraQuery, parseRemeraQuery } from './remera'
import { isCamisaQuery, parseCamisaQuery } from './camisa'
import { isCarQuery, parseCarQuery } from './car'
import { isMotoQuery, parseMotoQuery } from './moto'
import { isTruckQuery, parseTruckQuery } from './truck'
import { isCameraQuery, parseCameraQuery } from './camera'
import { isHeadphoneQuery, parseHeadphoneQuery } from './auriculares'
import { isCarteraQuery, parseCarteraQuery } from './cartera'

export const detectIntent = (q) => {
  const tokens = tokenize(q)

  if (isTvQuery(q)) {
    return {
      type: 'tv',
      categoryHint: ['tecnologia', 'televisores'],
      tvSpecs: extractTvSpecs(q),
    }
  }

  if (isSpeakerQuery(q)) {
    return {
      type: 'speaker',
      categoryHint: ['tecnologia', 'parlantes'],
      speakerSpecs: extractSpeakerSpecs(q),
    }
  }

  if (isTabletQuery(q)) {
    return {
      type: 'tablet',
      categoryHint: ['tecnologia', 'tablets'],
      tabletSpecs: extractTabletSpecs(q),
    }
  }

  if (isBeautyQuery(q)) {
    const beautySpecs = extractBeautySpecs(q)
    return {
      type: 'beauty',
      categoryHint: beautySpecs.categoryHint || ['belleza'],
      beautySpecs,
    }
  }

  if (isCameraQuery(q)) {
    const cameraSpecs = parseCameraQuery(q)
    return {
      type: 'camera',
      categoryHint: cameraSpecs.categoryHint,
      cameraSecurity: cameraSpecs.isSecurity,
    }
  }

  if (isNotebookQuery(q)) {
    return {
      type: 'notebook',
      categoryHint: ['tecnologia', 'notebooks'],
      notebookSpecs: extractNotebookSpecs(q),
    }
  }

  if (isPcQuery(q)) {
    return {
      type: 'pc',
      categoryHint: ['tecnologia', 'pcs'],
      pcSpecs: extractPcSpecs(q),
    }
  }

  if (isHeladeraQuery(q)) {
    return {
      type: 'heladera',
      categoryHint: ['hogar', 'heladeras'],
      heladeraSpecs: parseHeladeraQuery(q),
    }
  }

  if (isLavarropaQuery(q)) {
    return {
      type: 'lavarropa',
      categoryHint: ['hogar', 'lavarropas'],
      lavarropaSpecs: parseLavarropaQuery(q),
    }
  }

  if (isPhoneQuery(q)) {
    return {
      type: 'phone',
      categoryHint: ['tecnologia', 'celulares'],
      phoneSpecs: parsePhoneQuery(q),
      brand: null,
    }
  }

  if (isHeadphoneQuery(q)) {
    const headphoneSpecs = parseHeadphoneQuery(q)
    return {
      type: 'headphone',
      categoryHint: ['tecnologia', 'auriculares'],
      headphoneSpecs,
    }
  }

  // VEHICULOS
  if (isMotoQuery(q)) {
    const motoSpecs = parseMotoQuery(q)
    return {
      type: 'moto',
      categoryHint: ['vehiculos', 'motos'],
      brand: motoSpecs.brand,
      vehicleFilters: motoSpecs.vehicleFilters,
    }
  }

  if (isTruckQuery(q)) {
    const truckSpecs = parseTruckQuery(q)
    return {
      type: 'truck',
      categoryHint: ['vehiculos', 'camionetas'],
      brand: truckSpecs.brand,
      vehicleFilters: truckSpecs.vehicleFilters,
    }
  }

  if (isCarQuery(q)) {
    const carSpecs = parseCarQuery(q)
    return {
      type: 'car',
      categoryHint: ['vehiculos', 'autos'],
      brand: carSpecs.brand,
      vehicleFilters: carSpecs.vehicleFilters,
    }
  }

  if (isCarteraQuery(q)) {
    return {
      type: 'cartera',
      categoryHint: ['ropa', 'carteras'],
      carteraSpecs: parseCarteraQuery(q),
    }
  }

  // BOLSAS DE BOXEO
  const hasBolsa = tokens.includes('bolsa') || tokens.includes('bolsas')
  const hasBoxeo = tokens.includes('boxeo') || tokens.includes('box')

  if (hasBolsa && hasBoxeo) {
    return {
      type: 'category',
      categoryHint: [
        'deportes y fitness',
        'boxeo y artes marciales',
        'bolsas de boxeo',
      ],
    }
  }

  if (isRemeraQuery(q)) {
    return {
      type: 'remera',
      categoryHint: ['ropa', 'remeras'],
      remeraSpecs: parseRemeraQuery(q),
    }
  }

  if (isCamisaQuery(q)) {
    return {
      type: 'camisa',
      categoryHint: ['ropa', 'camisas'],
      camisaSpecs: parseCamisaQuery(q),
    }
  }

  // HOGAR
  const homeIntent = parseHomeQuery(q)
  if (homeIntent) return homeIntent

  // REGISTRY (categorías genéricas)
  for (const rule of KEYWORDS_TO_CATEGORY) {
    if (tokens.some((t) => rule.keywords.includes(t))) {
      return { type: 'category', categoryHint: rule.path }
    }
  }

  return { type: 'generic', categoryHint: null }
}
