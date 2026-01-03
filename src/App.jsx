import {Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import './App.css'

const App = () => {
    
    return (
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/items' element={<SearchResults />} />
        </Routes>
    )
}

export default App;