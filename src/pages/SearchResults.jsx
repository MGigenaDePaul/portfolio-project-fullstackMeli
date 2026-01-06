import productsData from '../data/products.json'
import SearchBar from '../components/searchBar/SearchBar'
import freeShipping from '../assets/thumbnails/shipping-back-removed.png'
import './SearchResults.css'
import BreadCrumb from '../components/Breadcrumb'
import { useNavigate, useSearchParams } from 'react-router-dom'

const normalize = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // saca tildes

const SearchResults = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('search') || ''
  const q = normalize(query.trim())

  const filteredProducts = productsData.results
    .filter((product) => {
      if (!q) return true
      const titleMatch = normalize(product.title).includes(q)
      const categoryMatch =
        product.category_path_from_root?.some((cat) =>
          normalize(cat.name).includes(q),
        ) ?? false

      return titleMatch || categoryMatch
    })
    .slice(0, 4)

  const categories =
    filteredProducts.length > 0
      ? filteredProducts[0]?.category_path_from_root?.map((cat) => cat.name)
      : null

  console.log('categories', categories)
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
                  {product.shipping.free_shipping === true && (
                    <img
                      className="shipping"
                      src={freeShipping}
                      alt="free_shipping"
                    />
                  )}
                </div>
                <p className="title">{product.title}</p>
              </div>
              <p className="state">{product.address.state_name}</p>
            </button>
          </div>
        ))
      )}
    </div>
  )
}

export default SearchResults
