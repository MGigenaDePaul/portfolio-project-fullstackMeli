import { tokenize } from './normalize'
import { buildSearchText } from './text'
import { matchesPathPrefix } from './categoryMatch'

const speakerWords = new Set([
  'parlante',
  'parlantes',
  'altavoz',
  'altavoces',
  'speaker',
  'speakers',
  'bafle',
  'bafles',
  'bocina',
  'bocinas',
  'subwoofer',
  'woofer',
  'soundbar',
  'barra',
  'barra de sonido',
])

const speakerPhrases = [
  'barra de sonido',
  'home theater',
  'torre de sonido',
  'partybox',
  'sound bar',
]

const speakerBrands = new Set([
  'jbl',
  'sony',
  'bose',
  'samsung',
  'lg',
  'philips',
  'panasonic',
  'xiaomi',
  'anker',
  'soundcore',
  'harman',
  'harman kardon',
  'marshall',
  'skullcandy',
  'edifier',
  'logitech',
  'genius',
  'thonet',
  'noga',
  'gadnic',
  'noblex',
])

const connectivityWords = new Set([
  'bluetooth',
  'bt',
  'wifi',
  'wi-fi',
  'aux',
  'jack',
  '3.5mm',
  'usb',
  'usbc',
  'usb-c',
  'typec',
  'type-c',
  'rca',
  'optico',
  'óptico',
  'toslink',
  'hdmi',
  'arc',
  'earc',
  'nfc',
  'micro sd',
  'microsd',
  'sd',
  'fm',
])

const useCaseWords = new Set([
  'portatil',
  'portátil',
  'portable',
  'inalambrico',
  'inalámbrico',
  'gamer',
  'gaming',
  'karaoke',
  'karaok',
  'microfono',
  'micrófono',
  'luces',
  'rgb',
  'waterproof',
  'impermeable',
  'resistente',
])

// accesorios / cosas que NO queremos mezclar como producto “parlante”
const accessoryWords = new Set([
  'cable',
  'cables',
  'adaptador',
  'adapter',
  'soporte',
  'soportes',
  'pie',
  'trípode',
  'tripode',
  'montaje',
  'control remoto',
  'control',
  'remote',
  'repuesto',
  'bateria',
  'batería',
  'funda',
  'case',
  'bolso',
  'estuche',
])

// para evitar choques con otras categorías (tv/pc/celular, etc.)
const phoneSignals = new Set([
  'celular',
  'celu',
  'telefono',
  'teléfono',
  'smartphone',
])
const notebookSignals = new Set([
  'notebook',
  'laptop',
  'ultrabook',
  'ram',
  'ssd',
  'hdd',
  'ryzen',
  'intel',
  'i3',
  'i5',
  'i7',
  'i9',
])
const tvSignals = new Set([
  'tv',
  'tele',
  'televisor',
  'televisores',
  'pulgadas',
  '4k',
  'uhd',
  'oled',
  'qled',
  'led',
  'hdr',
])
const vehicleSignals = new Set([
  'auto',
  'autos',
  'moto',
  'motos',
  'camioneta',
  'camionetas',
])

export const isSpeakerQuery = (q) => {
  const tokens = tokenize(q)
  const text = tokens.join(' ')

  // si hay señales claras de otra categoría, no es parlante
  const hasOtherSignal =
    tokens.some((t) => phoneSignals.has(t)) ||
    tokens.some((t) => notebookSignals.has(t)) ||
    tokens.some((t) => tvSignals.has(t)) ||
    tokens.some((t) => vehicleSignals.has(t))

  // OJO: "soundbar" suele venir con TV, pero acá la tratamos como parlante
  // así que no la bloqueamos por tvSignals si aparece "soundbar/barra de sonido"
  const hasSoundbarSignal =
    tokens.includes('soundbar') ||
    text.includes('barra de sonido') ||
    text.includes('sound bar')

  if (hasOtherSignal && !hasSoundbarSignal) return false

  // señales fuertes: palabra o frase
  const hasWord = tokens.some((t) => speakerWords.has(t))
  const hasPhrase = speakerPhrases.some((p) => text.includes(p))

  // señales de contexto: marca o conectividad típica
  const hasBrand = tokens.some((t) => speakerBrands.has(t))
  const hasConnectivity = tokens.some((t) => connectivityWords.has(t))
  const hasUseCase = tokens.some((t) => useCaseWords.has(t))

  if (hasWord || hasPhrase) return true
  // si no dijo “parlante”, pero dijo marca + bluetooth/wifi/etc, lo contamos
  return hasBrand && (hasConnectivity || hasUseCase)
}

// ===== helpers tokens =====
const isWattToken = (t) => /^(\d{1,4})w$/.test(t) // 20w, 200w, 1000w
const isMahToken = (t) => /^(\d{3,6})mah$/.test(t) // 5000mah
const isInchToken = (t) => /^(\d{1,2}(?:[.,]\d)?)\"$/.test(t) // 6.5"
const isChannelToken = (t) => /^\d(\.\d)?$/.test(t) // 2.0 / 2.1 / 5.1 etc

// ===== extracción de specs =====
export const extractSpeakerSpecs = (q) => {
  const tokens = tokenize(q)
  const joined = tokens.join(' ')

  // brand
  let brand = null
  for (const t of tokens) {
    if (speakerBrands.has(t)) {
      // normalizar alias comunes
      if (t === 'soundcore') brand = 'anker'
      else brand = t
      break
    }
  }

  // conectividad (prioridad: bluetooth > wifi > aux > hdmi/arc > optico)
  let connectivity = null
  const priority = [
    'bluetooth',
    'wifi',
    'aux',
    'hdmi',
    'arc',
    'earc',
    'optico',
    'toslink',
    'rca',
    'usb',
  ]
  for (const p of priority) {
    if (tokens.includes(p)) {
      connectivity = p === 'wi-fi' ? 'wifi' : p
      break
    }
    // algunos vienen como "bt"
    if (p === 'bluetooth' && tokens.includes('bt')) {
      connectivity = 'bluetooth'
      break
    }
  }

  // potencia en W (20w, 200w, "200 w")
  let watts = null
  const wMatch = joined.match(/\b(\d{1,4})\s*w\b/)
  if (wMatch) watts = Number(wMatch[1])
  else {
    for (const t of tokens) {
      if (isWattToken(t)) {
        watts = Number(t.replace('w', ''))
        break
      }
    }
  }

  // canales (2.0 / 2.1 / 5.1 / 7.1)
  let channels = null
  const chMatch = joined.match(/\b(2\.0|2\.1|3\.1|5\.1|7\.1)\b/)
  if (chMatch) channels = chMatch[1]
  else {
    for (const t of tokens) {
      if (
        isChannelToken(t) &&
        ['2', '2.0', '2.1', '3.1', '5.1', '7.1'].includes(t)
      ) {
        channels = t === '2' ? '2.0' : t
        break
      }
    }
  }

  // tamaño del driver en pulgadas (ej: 6.5", 8", 10")
  let driverInches = null
  const inchMatch = joined.match(
    /\b(\d{1,2}(?:[.,]\d)?)\s*(\"|pulgadas|inch|in)\b/,
  )
  if (inchMatch) driverInches = Number(String(inchMatch[1]).replace(',', '.'))
  else {
    for (const t of tokens) {
      if (isInchToken(t)) {
        driverInches = Number(t.replace('"', '').replace(',', '.'))
        break
      }
    }
  }

  // batería (mAh)
  let batteryMah = null
  const mahMatch = joined.match(/\b(\d{3,6})\s*mah\b/)
  if (mahMatch) batteryMah = Number(mahMatch[1])
  else {
    for (const t of tokens) {
      if (isMahToken(t)) {
        batteryMah = Number(t.replace('mah', ''))
        break
      }
    }
  }

  // tipo (soundbar / subwoofer / home theater / torre / portatil)
  let type = null
  if (
    joined.includes('barra de sonido') ||
    tokens.includes('soundbar') ||
    joined.includes('sound bar')
  ) {
    type = 'soundbar'
  } else if (tokens.includes('subwoofer')) {
    type = 'subwoofer'
  } else if (joined.includes('home theater')) {
    type = 'home-theater'
  } else if (joined.includes('torre de sonido') || tokens.includes('torre')) {
    type = 'torre'
  } else if (
    tokens.includes('portatil') ||
    tokens.includes('portátil') ||
    tokens.includes('portable')
  ) {
    type = 'portatil'
  }

  const wantsMic = tokens.some(
    (t) =>
      t === 'microfono' ||
      t === 'micrófono' ||
      t === 'karaoke' ||
      t === 'karaok',
  )
  const wantsRgb = tokens.some((t) => t === 'rgb' || t === 'luces')
  const wantsWaterproof = tokens.some(
    (t) => t === 'waterproof' || t === 'impermeable',
  )

  return {
    brand,
    connectivity,
    watts,
    channels,
    driverInches,
    batteryMah,
    type,
    wantsMic,
    wantsRgb,
    wantsWaterproof,
  }
}

// ===== producto =====
export const isSpeakerProduct = (product) => {
  // fuerte por categoría
  if (matchesPathPrefix(product, ['tecnologia', 'parlantes'])) return true

  // fallback por texto
  const text = buildSearchText(product)
  const looksLikeSpeaker =
    text.includes('parlante') ||
    text.includes('altavoz') ||
    text.includes('speaker') ||
    text.includes('bafle') ||
    text.includes('subwoofer') ||
    text.includes('soundbar') ||
    text.includes('barra de sonido')

  if (!looksLikeSpeaker) return false

  // evitar accesorios
  const isAccessory = Array.from(accessoryWords).some((w) => text.includes(w))
  return !isAccessory
}

// extraer watts del producto (si están en title)
export const extractProductWatts = (product) => {
  const title = String(product?.title || '').toLowerCase()
  const m = title.match(/\b(\d{1,4})\s*w\b/)
  return m ? Number(m[1]) : null
}

// extraer pulgadas (driver) del producto (si están en title)
export const extractProductDriverInches = (product) => {
  const title = String(product?.title || '').toLowerCase()
  const m = title.match(/\b(\d{1,2}(?:[.,]\d)?)\s*(\"|pulgadas|inch|in)\b/)
  return m ? Number(String(m[1]).replace(',', '.')) : null
}

export const matchesSpeakerSpecs = (product, specs) => {
  const text = buildSearchText(product)

  // brand
  if (specs.brand) {
    if (specs.brand === 'anker') {
      // anker puede aparecer como "soundcore"
      if (!text.includes('anker') && !text.includes('soundcore')) return false
    } else if (!text.includes(specs.brand)) {
      return false
    }
  }

  // type
  if (specs.type) {
    if (specs.type === 'soundbar') {
      if (!text.includes('soundbar') && !text.includes('barra de sonido'))
        return false
    } else if (specs.type === 'subwoofer') {
      if (!text.includes('subwoofer')) return false
    } else if (specs.type === 'home-theater') {
      if (!text.includes('home theater')) return false
    } else if (specs.type === 'torre') {
      if (!text.includes('torre')) return false
    } else if (specs.type === 'portatil') {
      if (
        !text.includes('portatil') &&
        !text.includes('portátil') &&
        !text.includes('portable')
      )
        return false
    }
  }

  // conectividad
  if (specs.connectivity) {
    const c = specs.connectivity
    if (c === 'bluetooth') {
      if (!text.includes('bluetooth') && !text.includes('bt')) return false
    } else if (!text.includes(c)) {
      // wifi/aux/hdmi/arc/optico/rca/usb
      return false
    }
  }

  // watts (filtro suave si el producto no tiene watts en el title)
  if (specs.watts) {
    const pW = extractProductWatts(product)
    // si no hay watts en el producto, no matamos el resultado
    if (pW && pW !== specs.watts) return false
  }

  // channels (2.1, 5.1, etc)
  if (specs.channels) {
    if (!text.includes(specs.channels)) return false
  }

  // driver inches (filtro suave si el producto no lo trae)
  if (specs.driverInches) {
    const pI = extractProductDriverInches(product)
    if (pI && Math.abs(pI - specs.driverInches) > 0.15) return false
  }

  // batería (solo si aparece)
  if (specs.batteryMah) {
    if (text.includes('mah')) {
      if (!text.includes(String(specs.batteryMah))) return false
    }
  }

  // preferencias (suaves)
  if (specs.wantsMic) {
    // no lo descartamos, pero si querés estricto: return false
    // if (!text.includes('microfono') && !text.includes('micrófono') && !text.includes('karaoke')) return false
  }
  if (specs.wantsRgb) {
    // idem
  }
  if (specs.wantsWaterproof) {
    // idem
  }

  // evitar accesorios siempre
  const isAccessory = Array.from(accessoryWords).some((w) => text.includes(w))
  if (isAccessory) return false

  return true
}
