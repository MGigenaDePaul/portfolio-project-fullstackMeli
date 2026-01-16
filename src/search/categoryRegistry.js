export const CATEGORY = {
  TECH: ['tecnologia'],
  HOME: ['hogar'],
  VEHICLES: ['vehiculos'],
  SUPERMARKET: ['supermercado'],
  BEAUTY: ['belleza'],
  CLOTHING: ['ropa'],
  SPORTS: ['deportes'],
  SPORTS_FITNESS: ['deportes y fitness'],
  TOOLS: ['herramientas'],
}

// Reglas: keywords -> categoryHint (prefijo exacto)
export const KEYWORDS_TO_CATEGORY = [
  // === VEHICULOS ===
  // autos
  {
    keywords: ['auto', 'autos', 'pickup'],
    path: ['vehiculos', 'autos'],
  },
  // motos
  { keywords: ['moto', 'motos'], path: ['vehiculos', 'motos'] },
  // camionetas
  {
    keywords: ['camioneta', 'camionetas', 'pickup', 'pickups'],
    path: ['vehiculos', 'camionetas'],
  },

  //aceites y demas
  { keywords: ['aceite', 'aceites'], path: ['vehiculos', 'aceites'] },
  { keywords: ['escobilla', 'escobillas'], path: ['vehiculos', 'escobillas'] },

  // === SUPERMERCADO ===
  {
    keywords: [
      'carne',
      'carnes',
      'asado',
      'vacuna',
      'res',
      'pollo',
      'cerdo',
      'cordero',
    ],
    path: ['supermercado', 'carnes'],
  },
  {
    keywords: ['pescado', 'pescados'],
    path: ['supermercado', 'pescados', 'pescado'],
  },
  { keywords: ['fiambre', 'fiambres'], path: ['supermercado', 'fiambres'] },
  {
    keywords: ['embutido', 'embutidos'],
    path: ['supermercado', 'fiambres', 'embutidos'],
  },
  {
    keywords: ['queso', 'quesos'],
    path: ['supermercado', 'fiambres', 'quesos'],
  },
  {
    keywords: ['salame', 'salames'],
    path: ['supermercado', 'fiambres', 'salames'],
  },

  // === TECNOLOGIA (subcategorías reales) ===
  {
    keywords: [
      'celular',
      'celulares',
      'telefono',
      'telefonos',
      'smartphone',
      'smartphones',
      'iphone',
      'android',
    ],
    path: ['tecnologia', 'celulares'],
  },
  {
    keywords: ['auricular', 'auriculares', 'headphones', 'buds', 'auris'],
    path: ['tecnologia', 'auriculares'],
  },
  {
    keywords: [
      'teles',
      'televisores',
      'tvs',
      'smartTv',
      'smartv',
      'smarttv',
      'tele',
    ],
    path: ['tecnologia', 'televisores'],
  },
  {
    keywords: ['parlante', 'parlantes', 'speaker', 'speakers'],
    path: ['tecnologia', 'parlantes'],
  },
  {
    keywords: ['smartwatch', 'smartwatches', 'reloj', 'relojes'],
    path: ['tecnologia', 'smartwatches'],
  },
  {
    keywords: ['notebook', 'notebooks', 'laptop', 'laptops'],
    path: ['tecnologia', 'notebooks'],
  },
  {
    keywords: ['tablet', 'tablets'],
    path: ['tecnologia', 'tablets'],
  },
  {
    keywords: ['pc', 'pcs', 'computadora de escritorio'],
    path: ['tecnologia', 'pcs'],
  },
  {
    keywords: ['camara', 'camaras', 'camera', 'cameras'],
    path: ['tecnologia', 'camaras'],
  },
  {
    keywords: ['seguridad', 'security', 'cctv', 'vigilancia'],
    path: ['tecnologia', 'camaras de seguridad'],
  },

  // === HOGAR ===
  { keywords: ['limpieza'], path: ['hogar', 'limpieza'] },
  { keywords: ['utensilio', 'utensilios'], path: ['hogar', 'utensilios'] },
  { keywords: ['cocina'], path: ['hogar', 'cocina'] },
  { keywords: ['insumo', 'insumos'], path: ['hogar', 'insumos'] },
  { keywords: ['parrilla', 'parrillas'], path: ['hogar', 'parrillas'] },
  { keywords: ['mascota', 'mascotas'], path: ['hogar', 'mascotas'] },
  {
    keywords: [
      'living',
      'sofas',
      'sillon',
      'sillones',
      'sofa',
      'sofas',
      'sofá',
      'sofás',
      'couch',
      'couches',
      'living',
      'mesa',
      'mesa ratonera',
      'ratona',
    ],
    path: ['hogar', 'living'],
  },
  {
    keywords: ['cama', 'camas', 'colchon', 'colchones'],
    path: ['hogar', 'dormitorio', 'camas y colchones'],
  },

  // === BELLEZA ===
  {
    keywords: [
      'maquillaje',
      'labial',
      'labiales',
      'mascara',
      'pestanas',
      'base',
    ],
    path: ['belleza', 'maquillaje'],
  },
  { keywords: ['accesorio', 'accesorios'], path: ['belleza', 'accesorios'] },
  {
    keywords: ['perfume', 'desodorante', 'shampoo', 'crema'],
    path: ['belleza', 'cuidado personal'],
  },

  // === ROPA ===
  {
    keywords: [
      'ropa',
      'remera',
      'remeras',
      'camisa',
      'camisas',
      'pantalon',
      'pantalones',
      'zapatilla',
      'zapatillas',
      'buzo',
      'buzos',
      'campera',
      'camperas',
      'vestido',
      'vestidos',
    ],
    path: ['ropa'],
  },

  // === DEPORTES Y FITNESS ===
  {
    keywords: ['bicicleta', 'bicicletas', 'fija', 'spinning'],
    path: ['deportes y fitness', 'gimnasio en casa', 'bicicletas fijas'],
  },
  {
    keywords: ['cinta', 'correr', 'trotadora'],
    path: ['deportes y fitness', 'gimnasio en casa', 'cintas de correr'],
  },
  {
    keywords: ['boxeo', 'box'],
    path: ['deportes y fitness', 'boxeo y artes marciales'],
  },
  {
    keywords: ['proteccion', 'protecciones', 'casco', 'canillera'],
    path: ['deportes y fitness', 'boxeo y artes marciales', 'protecciones'],
  },

  // === HERRAMIENTAS ===
  { keywords: ['herramienta', 'herramientas'], path: ['herramientas'] },
  {
    keywords: [
      'taladro',
      'amoladora',
      'atornillador',
      'sierra',
      'caladora',
      'lijadora',
    ],
    path: ['herramientas', 'electricas'],
  },
  {
    keywords: ['podadora', 'bordeadora', 'motosierra', 'cortadora', 'pasto'],
    path: ['herramientas', 'jardineria'],
  },
]
