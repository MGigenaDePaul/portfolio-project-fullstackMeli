// normalize → limpia texto
export const normalize = (str = '') =>
  String(str)
    .toLowerCase()
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '')

// tokenize → convierte un texto en palabras limpias
export const tokenize = (q = '') => normalize(q).split(/\s+/).filter(Boolean)
