export type Product = {
  name: string;
  slug: string;
  sku: string;
  category: "Cleaners" | "Solvents" | "Removers" | "Renovators";
  webshopUrl: string;
  price: number; // EUR per litre
  inStock: boolean;
  imageUrl: string | null;
  sizes: { label: string; price: number }[];
  description: string;
};

// TODO: Update webshop URLs for each product
// Contact Mavro webshop team for correct product page URLs
export const PRODUCT_CATALOG: Product[] = [
  {
    name: "FacadeClean HC",
    slug: "facadeclean-hc",
    sku: "MC-FCHC",
    category: "Cleaners",
    webshopUrl: "https://mavro-int.shop/sl/cistilo-za-fasado-koncentrat",
    price: 12.50,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 12.50 },
      { label: "5L", price: 52.00 },
      { label: "10L", price: 95.00 },
    ],
    description: "High-concentration facade cleaner for algae, moss and black mould.",
  },
  {
    name: "Cement Efflorescence Cleaner",
    slug: "cement-efflorescence-cleaner",
    sku: "MC-CEC",
    category: "Cleaners",
    webshopUrl: "https://mavro-int.shop/sl/",
    price: 11.00,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 11.00 },
      { label: "5L", price: 46.00 },
      { label: "10L", price: 84.00 },
    ],
    description: "Removes cement veils and efflorescence from masonry and stone.",
  },
  {
    name: "Alu Clean",
    slug: "alu-clean",
    sku: "MC-ALU",
    category: "Cleaners",
    webshopUrl: "https://mavro-int.shop/sl/",
    price: 13.00,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 13.00 },
      { label: "5L", price: 54.00 },
      { label: "10L", price: 99.00 },
    ],
    description: "Specialist cleaner formulated for aluminium surfaces.",
  },
  {
    name: "Uniclean Low Foaming",
    slug: "uniclean-low-foaming",
    sku: "MC-ULF",
    category: "Cleaners",
    webshopUrl: "https://mavro-int.shop/sl/",
    price: 9.50,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 9.50 },
      { label: "5L", price: 39.00 },
      { label: "10L", price: 71.00 },
    ],
    description: "Low-foaming alkaline cleaner, ideal for pressure-washing equipment.",
  },
  {
    name: "Uniclean High Alkaline",
    slug: "uniclean-high-alkaline",
    sku: "MC-UHA",
    category: "Cleaners",
    webshopUrl: "https://mavro-int.shop/sl/",
    price: 10.00,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 10.00 },
      { label: "5L", price: 41.00 },
      { label: "10L", price: 75.00 },
    ],
    description: "High-alkaline universal cleaner and degreaser for masonry and hard surfaces.",
  },
  {
    name: "Uniclean High Foaming",
    slug: "uniclean-high-foaming",
    sku: "MC-UHF",
    category: "Cleaners",
    webshopUrl: "https://mavro-int.shop/sl/",
    price: 9.50,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 9.50 },
      { label: "5L", price: 39.00 },
      { label: "10L", price: 71.00 },
    ],
    description: "High-foaming cleaner for vertical surfaces — clings for longer dwell time.",
  },
  {
    name: "Wood Renovator",
    slug: "wood-renovator",
    sku: "MC-WR",
    category: "Renovators",
    webshopUrl: "https://mavro-int.shop/sl/",
    price: 14.00,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 14.00 },
      { label: "5L", price: 58.00 },
      { label: "10L", price: 105.00 },
    ],
    description: "Restores and cleans weathered timber, decking and garden furniture.",
  },
  {
    name: "Strip-Off",
    slug: "strip-off",
    sku: "MC-SO",
    category: "Removers",
    webshopUrl: "https://mavro-int.shop/sl/",
    price: 15.00,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 15.00 },
      { label: "5L", price: 62.00 },
      { label: "10L", price: 112.00 },
    ],
    description: "Standard graffiti and paint remover for most porous substrates.",
  },
  {
    name: "Strip-Off Plus",
    slug: "strip-off-plus",
    sku: "MC-SOP",
    category: "Removers",
    webshopUrl: "https://mavro-int.shop/sl/",
    price: 17.50,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 17.50 },
      { label: "5L", price: 72.00 },
      { label: "10L", price: 130.00 },
    ],
    description: "Enhanced graffiti remover effective on a wide range of paint types.",
  },
  {
    name: "Strip-Off HD",
    slug: "strip-off-hd",
    sku: "MC-SOHD",
    category: "Removers",
    webshopUrl: "https://mavro-int.shop/sl/",
    price: 19.00,
    inStock: true,
    imageUrl: null,
    sizes: [
      { label: "1L", price: 19.00 },
      { label: "5L", price: 78.00 },
      { label: "10L", price: 140.00 },
    ],
    description: "Heavy-duty paint and graffiti remover for stubborn multi-layer applications.",
  },
];

export function findProduct(name: string): Product | null {
  return PRODUCT_CATALOG.find((p) => p.name === name) ?? null;
}

export function findAlternatives(product: Product, limit = 2): Product[] {
  return PRODUCT_CATALOG
    .filter((p) => p.category === product.category && p.name !== product.name)
    .slice(0, limit);
}

const SHOP_HOME = "https://mavro-int.shop/sl/";

export function getProductUrl(product: Product, medium = "recommendation"): string {
  const base = product.webshopUrl || SHOP_HOME;
  const utm = `utm_source=mavro-ai&utm_medium=${medium}&utm_campaign=ai-analysis`;
  return `${base}${base.includes("?") ? "&" : "?"}${utm}`;
}
