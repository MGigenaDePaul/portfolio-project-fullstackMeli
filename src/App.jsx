import {Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ProductDetail from './pages/ProductDetail';

import './App.css'

const App = () => {
    
    return (
        <div style={{backgroundColor: '#f3f3f3ff'}}>
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/items' element={<SearchResults />} />
            <Route path='/items/:id' element={<ProductDetail />} />
        </Routes>
        </div>
    )
}

export default App;