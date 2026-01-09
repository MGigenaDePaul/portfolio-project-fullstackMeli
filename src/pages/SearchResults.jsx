import productsData from '../data/products.json'
import SearchBar from '../components/searchBar/SearchBar'
import freeShipping from '../assets/thumbnails/shipping-back-removed.png'
import './SearchResults.css'
import BreadCrumb from '../components/Breadcrumb'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  normalize,
  isVehicleIntent,
  isVehicleCategory,
  buildSearchText,
  isCameraIntent,
  isSecurityModifier,
  isSecurityCameraProduct,
  extractCarBrand,
  matchesQuery,
  isCameraProduct,
} from '../helpers/helpers.js'

const SearchResults = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('search') || ''
  const q = normalize(query.trim())

  const all = productsData.results

  // 1) Búsqueda general (lo que ya tenías, pero mejor: con buildSearchText)
  const generalMatches = all.filter((p) => {
    if (!q) return true
    return matchesQuery(p, q)
  })

  let filteredProducts = generalMatches

  if (q) {
    // A) INTENCIÓN: VEHÍCULOS (autos por marca)
    if (isVehicleIntent(q)) {
      let vehicleMatches = generalMatches.filter((p) => isVehicleCategory(p))

      // Si hay marca en la query, filtramos dentro de autos
      const brand = extractCarBrand(q)
      if (brand) {
        vehicleMatches = vehicleMatches.filter((p) =>
          buildSearchText(p).includes(brand),
        )
      }

      if (vehicleMatches.length > 0) {
        filteredProducts = vehicleMatches
      }
    }

    // B) INTENCIÓN: CÁMARAS
    if (isCameraIntent(q)) {
      const wantsSecurity = isSecurityModifier(q)

      const onlyCameras = all.filter((p) => isCameraProduct(p))

      // 2) distinguimos si es camara de seguridad o no.
      const cameraMatches = onlyCameras.filter((p) => {
        const isSecurity = isSecurityCameraProduct(p)
        if (!wantsSecurity) return !isSecurity
        return isSecurity
      })

      if (cameraMatches.length > 0) {
        filteredProducts = cameraMatches
      }
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
              <img
                className="thumbnail"
                src={product.thumbnail}
                alt="thumbnail"
              />
              <div className="container-price-shipping-title">
                <div className="price-shipping">
                  <p className="price">
                    $ {product.price.toLocaleString('es-AR')}
                  </p>
                  {product.shipping?.free_shipping === true && (
                    <img
                      className="shipping"
                      src={freeShipping}
                      alt="free_shipping"
                    />
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
