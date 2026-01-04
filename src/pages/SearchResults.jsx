import productsData from '../data/products.json';
import SearchBar from '../components/searchBar/SearchBar';
import freeShipping from '../assets/thumbnails/shipping-back-removed.png'
import './SearchResults.css';
import BreadCrumb from '../components/Breadcrumb';
import { useNavigate } from 'react-router-dom';

const SearchResults = () => {
    console.log('products', productsData.results);
    const navigate = useNavigate();
    const categories = productsData.results[0]?.category_path_from_root?.map(cat => cat.name) || ['Electrónica, Audio y Video', 'iPad', 'Reproducciones'];


    return (
        <div>
            <SearchBar />
            <BreadCrumb categories={categories} />
            {productsData.results.map((product) => (
                <div key={product.id} className='containerProducts'>
                    <button onClick={() => navigate(`/items/${product.id}`)} className='buttons'>
                        <img className='thumbnail' src={product.thumbnail} alt='thumbnail'/>
                        <div className='container-price-shipping-title'>
                            <div className='price-shipping'>
                                <p className='price'>$ {product.price.toLocaleString('es-AR')}</p>
                                {product.shipping.free_shipping === true && (
                                    <img className='shipping' src={freeShipping} alt='free_shipping'/>
                                )}
                            </div>
                            <p className='title'>{product.title}</p>
                        </div>
                        <p className='state'>{product.address.state_name}</p>
                    </button>
                </div>
            ))}
        </div>
    )
}

export default SearchResults;