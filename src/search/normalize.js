// normalize → limpia texto
export const normalize = (str = '') =>
  String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

// tokenize → convierte un texto en palabras limpias
export const tokenize = (q = '') => normalize(q).split(/\s+/).filter(Boolean)

// stem → reduce palabras a su raíz (stemming simple para español)
export const stem = (word) => {
  word = normalize(word)

  // Mapeo explícito de palabras irregulares
  const stemMap = {
    'hombres': 'hombre',
    'mujeres': 'mujer',
    'ninos': 'nino',
    'ninas': 'nina',
  }
  
  if (stemMap[word]) {
    return stemMap[word]
  }

  // Plurales en -es
  if (word.endsWith('es') && word.length > 4) {
    return word.slice(0, -2)
  }
  
  // Plurales simples en -s
  if (word.endsWith('s') && word.length > 3) {
    return word.slice(0, -1)
  }

  return word
}

// stemTokens → tokeniza y aplica stem a cada palabra
export const stemTokens = (q = '') => tokenize(q).map(stem)
