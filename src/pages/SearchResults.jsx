import productsData from '../data/products.json'
import SearchBar from '../components/searchBar/SearchBar'
import freeShipping from '../assets/thumbnails/shipping-back-removed.png'
import './SearchResults.css'
import BreadCrumb from '../components/Breadcrumb'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { searchProducts } from '../search/searchEngine.js'

const SearchResults = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const query = searchParams.get('search') || ''
  const all = productsData.results
  console.log('products.length', all.length)
  const { items, breadcrumb } = searchProducts(all, query, { limit: 4 })

  return (
    <div>
      <SearchBar />
      {breadcrumb?.length ? <BreadCrumb categories={breadcrumb} /> : null}

      {items.length === 0 ? (
        <div className="no-results">
          No se encontraron productos relacionados a <b>"{query}"</b>
        </div>
      ) : (
        items.map((product) => (
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
