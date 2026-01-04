import SearchBar from '../components/searchBar/SearchBar';
import BreadCrumb from '../components/Breadcrumb';
import productDetails from '../data/productDetail.json';
import { useParams } from 'react-router-dom';
import './ProductDetail.css'

const ProductDetail = () => {
    console.log('detailsProduct', productDetails.details);
    const { id } = useParams();

    const product = productDetails.details.find(p => p.id === id);

    if (!product) {
        return <div>No se encontró el producto</div>
    }

    const categories = product.category_path_from_root?.map(cat => cat.name) || ['Electrónica, Audio y Video', 'iPad', 'Reproducciones'];

    return (
        <div>
            <SearchBar />
            <BreadCrumb categories={categories} />
                <div key={product.id} className='containerProductDetails'>
                    <div className='container-img-titleDescription-description'>
                        <img className='image' src={product.fullImage} alt='imageProduct'/>
                        <p className='titleDescription'>Descripcion del producto</p>
                        <p className='description'>{product.description}</p>
                    </div>
                    <div className='container-condition-title-price-buy'>
                        <p className='condition'>{product.condition === 'new' ? 'Nuevo' : 'Usado'} - {product.sold_quantity} vendidos</p>
                        <p className='titleUnique'>{product.title}</p>
                        <p className='priceUnique'>$ {product.price.toLocaleString('es-AR')}<sup>00</sup></p>
                        <button className='buy-button'>Comprar</button>
                    </div>
                </div>
        </div>
    )
}

export default ProductDetail;