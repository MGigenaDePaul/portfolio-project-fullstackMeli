import { buildSearchText, getCategoryPath } from './text'
import { normalize } from './normalize'

export const rankResults = (items, { q, intent }) => {
  const nq = normalize(q)

  const score = (p) => {
    const text = buildSearchText(p)
    const cats = getCategoryPath(p)
    let s = 0

    // Coincidencia exacta del texto (+50)
    if (nq && text.includes(nq)) s += 50 

    // Coincide con la categoría del intent (+40)
    if (intent?.categoryHint?.length) {
      const prefix = intent.categoryHint.map(normalize)
      let ok = true
      for (let i = 0; i < prefix.length; i++)
        if (cats[i] !== prefix[i]) ok = false
      if (ok) s += 40
    }

    // Coincidencia de marca (+15)
    if (intent?.brand && text.includes(intent.brand)) s += 15

    return s
  }

  // Productos con más puntos primero
  return [...items].sort((a, b) => score(b) - score(a))
}


/*
🎯 Para que sirve rank.js?

👉 Ordena los productos para que los más relevantes aparezcan primero.
*/