import SearchBar from '../components/searchBar/SearchBar'
import productsData from '../data/products.json'
import freeShipping from '../assets/thumbnails/shipping-back-removed.png'
import './SearchResults.css'
import { useNavigate } from 'react-router-dom'
const Home = () => {
  const navigate = useNavigate()
  return (
    <div>
      <SearchBar />
      {productsData.results.slice(0, 4).map((product) => (
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
      ))}
    </div>
  )
}

export default Home
