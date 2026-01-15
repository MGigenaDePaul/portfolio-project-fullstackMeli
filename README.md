# Mercado Libre - Frontend Challenge

# React + Vite

Web application built with React that simulates the main functionalities of Mercado Libre: product search, results display, and product details.

## Features

- 🔍 Product search
- 📋 Results listing (maximum 4 products)
- 📦 Individual product detail
- 🧭 Navigation breadcrumb
- 📱 Responsive design

## Technologies

- React
- React Router
- CSS/Sass
- Vite
- Prettier (code formatting)

## Installation and Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/meli-frontend-test.git
cd meli-frontend-test
```

2. Install dependencies:

```bash
npm install
```

3. Run the application:

```bash
npm run dev
```

4. Open in browser:

```
http://localhost:5173
```

### Keep productDetail.json in sync with products.json

Use this command whenever you add, remove, or update products in products.json and want to keep
productDetail.json perfectly synchronized — NO MANUAL WORK.

Execute this command when you are positioned in the root folder meli-frontend-test

```bash
node scripts/makeProductDetail.js src/data/products.json src/data/productDetail.json
```

What this command does

📦 Reads all products from products.json

📖 Reads existing product details from productDetail.json

➕ Adds new products when their ID exists in products.json but not in productDetail.json

🖼️ Updates images (thumbnail → fullImage) and categories for existing products
(keeps description, sold_quantity, condition, etc. untouched)

❌ Removes products from productDetail.json if their ID no longer exists in products.json

🆔 Uses IDs as unique identifiers (product order does not matter)

🔢 Sorts products by numeric ID (MLA2 → MLA10 → MLA620)

💾 Writes a clean, merged result back to productDetail.json

🔁 Safe to run multiple times (idempotent)

### Sort products by full category
Execute these commands when you are positioned in the root folder meli-frontend-test
```bash
node scripts/sortByCategory.js src/data/products.json
node scripts/sortByCategory.js src/data/productDetail.json
```

What it does

🧩 Groups products by the full category_path_from_root

📚 Keeps all identical categories together

🔢 Sorts products by numeric ID inside each category

📄 Works with both products.json (results) and productDetail.json (details)

🔁 Safe to run multiple times (idempotent)

### ARCHIVO helpers.js esta organizado de la siguiente manera

filtra por autos + marca
filtra por camaras (normales y de seguridad)
filtra por ropa
filtra por carnes
filtra por bicicletas
filtra por celulares

Developed as a technical challenge for Mercado Libre.
