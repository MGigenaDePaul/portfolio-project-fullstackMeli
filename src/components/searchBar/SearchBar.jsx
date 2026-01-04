import './SearchBar.css'
import LogoMeli from '../../assets/LogoMeli.png';
import { AiOutlineSearch } from "react-icons/ai";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleChange = (event) => {
        event.preventDefault()
        navigate(`/items?search=${searchQuery}`)
    }

    return (
        <form onSubmit={handleChange} className='searchBar'>
            <div className='logoWrap'>
                <img className='logoMeli' src={LogoMeli} alt='logoMercadoLibre'/>
            </div>
            <div className='input-searchIcon-container'>
                <input className='input' placeholder='Nunca dejes de buscar' value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
                <button type='onSubmit' className='searchButton'><AiOutlineSearch className='searchIcon'/></button>
            </div>
        </form>
    )
}

export default SearchBar;