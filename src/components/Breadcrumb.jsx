import './BreadCrumb.css'

const BreadCrumb = ({categories}) => {
    return (
        <nav className="breadcrumb">
            {categories.map((category, index) => (
                <span key={index}>
                {category}
                {index < categories.length - 1 && ' > '}
                </span>
            ))}
        </nav>
    )
}

export default BreadCrumb;