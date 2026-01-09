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

COMMAND THAT SAVES A LOT OF TIME when you add more products to products.json and want to copy the same products to productDetail.json
```bash node scripts/makeProductDetail.js src/data/products.json src/data/productDetail.json```
What this command does:
Reads all products from products.json
Reads existing product details from productDetail.json (details array)
Adds missing products to productDetail.json
Keeps existing products untouched (descriptions, images, sold_quantity, etc.)
Updates products only if they don’t exist yet
Sorts all products by ID (e.g. MLA1 → MLA620)
Saves the result without deleting any existing data
Safe to run multiple times (idempotent).


Developed as a technical challenge for Mercado Libre.
