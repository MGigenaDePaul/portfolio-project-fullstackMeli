import { getCategoryPath } from './text'
import { normalize } from './normalize'

export const matchesPathPrefix = (product, prefix = []) => {
  const cats = getCategoryPath(product)
  const p = prefix.map(normalize)

  if (!p.length) return true 
  if (cats.length < p.length) return false // si el producto tiene menos niveles no puede coincidir

  for (let i = 0; i < p.length; i++) {
    if (cats[i] !== p[i]) return false
  }
  return true
}

/*
🧠 Idea clave

No busca palabras

No adivina

Solo responde:

“¿La categoría del producto empieza exactamente como lo que pedí?”

Es lo que permite:

breadcrumbs correctos

filtros por categoría

separar autos, motos, camionetas, etc.

*/