import productsData from '../data/products.json'
import SearchBar from '../components/searchBar/SearchBar'
import freeShipping from '../assets/thumbnails/shipping-back-removed.png'
import './SearchResults.css'
import BreadCrumb from '../components/Breadcrumb'
import { useNavigate, useSearchParams } from 'react-router-dom'

const normalize = (str = '') =>
  String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca tildes

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

const isVehicleIntent = (q) => {
  // split simple por espacios
  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.some((t) => vehicleKeywords.has(t))
}

// Detecta autos reales por categoria exacta (la que vos pediste)
const isVehicleCategory = (product) => {
  const cats = product.category_path_from_root?.map((c) => normalize(c.name)) ?? []
  return (
    cats.length >= 3 &&
    cats[0] === 'autos' &&
    cats[1] === 'motos y otros' &&
    cats[2] === 'autos y camionetas'
  )
}

const buildSearchText = (product) => {
  const title = product.title ?? ''
  const state = product.address?.state_name ?? ''
  const cats = product.category_path_from_root?.map((c) => c.name).join(' ') ?? ''
  return normalize(`${title} ${state} ${cats}`)
}

const SearchResults = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('search') || ''
  const q = normalize(query.trim())

  const all = productsData.results

  // 1) Búsqueda general (lo que ya tenías, pero mejor: con buildSearchText)
  const generalMatches = all.filter((p) => {
    if (!q) return true
    return buildSearchText(p).includes(q)
  })

  // 2) Si la intención es "vehiculo", priorizamos autos reales
  let filteredProducts = generalMatches
  if (q && isVehicleIntent(q)) {
    const vehicleMatches = generalMatches.filter((p) => isVehicleCategory(p))

    // Si encuentro autos reales, uso SOLO esos
    // Si no encuentro, vuelvo a generalMatches (para no dejar vacío)
    if (vehicleMatches.length > 0) {
      filteredProducts = vehicleMatches
    }
  }

  filteredProducts = filteredProducts.slice(0, 4)

  const categories =
    filteredProducts.length > 0
      ? filteredProducts[0]?.category_path_from_root?.map((cat) => cat.name)
      : null

  return (
    <div>
      <SearchBar />
      {categories && <BreadCrumb categories={categories} />}
      {filteredProducts.length === 0 ? (
        <div className="no-results">
          No se encontraron productos relacionados a <b>"{query}"</b>
        </div>
      ) : (
        filteredProducts.map((product) => (
          <div key={product.id} className="containerProducts">
            <button
              onClick={() => navigate(`/items/${product.id}`)}
              className="buttons"
            >
              <img className="thumbnail" src={product.thumbnail} alt="thumbnail" />
              <div className="container-price-shipping-title">
                <div className="price-shipping">
                  <p className="price">$ {product.price.toLocaleString('es-AR')}</p>
                  {product.shipping?.free_shipping === true && (
                    <img className="shipping" src={freeShipping} alt="free_shipping" />
                  )}
                </div>
                <p className="title">{product.title}</p>
              </div>
              <p className="state">{product.address?.state_name}</p>
            </button>
          </div>
        ))
      )}
    </div>
  )
}

export default SearchResults
