import { normalize, tokenize } from './normalize'

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

export const getCategoryPath = (product) =>
  product.category_path_from_root?.map((c) => normalize(c.name)) ?? []

export const buildSearchText = (product) => {
  const title = product.title ?? ''
  const state = product.address?.state_name ?? ''
  const cats =
    product.category_path_from_root?.map((c) => c.name).join(' ') ?? ''
  return normalize(`${title} ${state} ${cats}`)
}

export const meaningfulTokens = (q, { drop = [] } = {}) => {
  const dropSet = new Set(drop.map(normalize))
  return tokenize(q).filter((t) => !stopwords.has(t) && !dropSet.has(t))
}

export const matchesQueryText = (product, q, { drop = [] } = {}) => {
  const tokens = meaningfulTokens(q, { drop })
  if (tokens.length === 0) return true
  const text = buildSearchText(product)
  return tokens.every((t) => text.includes(t))
}
