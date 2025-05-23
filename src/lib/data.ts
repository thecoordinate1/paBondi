import type { Store, Product } from '@/types';

export const stores: Store[] = [
  {
    id: 'store-1',
    name: 'Blue Sapphire Corner',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'Exquisite gems and jewelry.',
    featured: true,
  },
  {
    id: 'store-2',
    name: 'Modern Threads',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'Latest fashion trends for all.',
    featured: true,
  },
  {
    id: 'store-3',
    name: 'Tech Gadget Hub',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'Cutting-edge electronics and accessories.',
  },
  {
    id: 'store-4',
    name: 'Gourmet Pantry',
    logoUrl: 'https://placehold.co/100x100.png',
    description: 'Artisanal foods and delicacies.',
    featured: true,
  },
];

export const products: Product[] = [
  {
    id: 'prod-1',
    name: 'Sapphire Ring',
    price: 299.99,
    imageUrls: ['https://placehold.co/600x600.png', 'https://placehold.co/600x600.png?text=Angle+2', 'https://placehold.co/600x600.png?text=Detail'],
    description: 'A beautiful ring featuring a deep blue sapphire, perfect for special occasions. Crafted with precision and care, this ring showcases a stunning central sapphire surrounded by delicate detailing. It comes in a premium velvet box.',
    storeId: 'store-1',
    storeName: 'Blue Sapphire Corner',
    category: 'Jewelry',
    featured: true,
    stockCount: 5,
    averageRating: 4.8,
    reviewCount: 22,
  },
  {
    id: 'prod-2',
    name: 'Silk Scarf',
    price: 49.99,
    imageUrls: ['https://placehold.co/600x600.png', 'https://placehold.co/600x600.png?text=Folded', 'https://placehold.co/600x600.png?text=Close-up'],
    description: 'Luxurious 100% silk scarf with a modern, elegant design. Soft to the touch and versatile for any outfit, it measures 90x90cm and features hand-rolled edges.',
    storeId: 'store-2',
    storeName: 'Modern Threads',
    category: 'Accessories',
    featured: true,
    stockCount: 15,
    averageRating: 4.5,
    reviewCount: 15,
  },
  {
    id: 'prod-3',
    name: 'Wireless Headphones',
    price: 129.50,
    imageUrls: ['https://placehold.co/600x600.png', 'https://placehold.co/600x600.png?text=Side+View', 'https://placehold.co/600x600.png?text=In+Case'],
    description: 'High-fidelity wireless headphones with active noise cancellation and up to 20 hours of battery life. Features comfortable earcups and intuitive touch controls.',
    storeId: 'store-3',
    storeName: 'Tech Gadget Hub',
    category: 'Electronics',
    stockCount: 8,
    averageRating: 4.2,
    reviewCount: 30,
  },
  {
    id: 'prod-4',
    name: 'Organic Olive Oil',
    price: 25.00,
    imageUrls: ['https://placehold.co/600x600.png', 'https://placehold.co/600x600.png?text=Bottle+Detail'],
    description: 'Extra virgin organic olive oil, cold-pressed from the finest olives. Rich in antioxidants and flavor, perfect for salads, cooking, or dipping. 500ml bottle.',
    storeId: 'store-4',
    storeName: 'Gourmet Pantry',
    category: 'Food',
    featured: true,
    averageRating: 4.9,
    reviewCount: 45,
  },
  {
    id: 'prod-5',
    name: 'Leather Wallet',
    price: 75.00,
    imageUrls: ['https://placehold.co/600x600.png', 'https://placehold.co/600x600.png?text=Open+View', 'https://placehold.co/600x600.png?text=Slots'],
    description: 'Handcrafted genuine leather wallet with multiple card slots and a bill compartment. Slim design for comfortable everyday carry. Available in black and brown.',
    storeId: 'store-2',
    storeName: 'Modern Threads',
    category: 'Accessories',
    stockCount: 3, // Low stock example
    averageRating: 4.6,
    reviewCount: 18,
  },
  {
    id: 'prod-6',
    name: 'Smartwatch Series X',
    price: 249.99,
    imageUrls: ['https://placehold.co/600x600.png', 'https://placehold.co/600x600.png?text=Screen+Detail', 'https://placehold.co/600x600.png?text=Side+Buttons'],
    description: 'Feature-rich smartwatch with health tracking (heart rate, SpO2), GPS, and a vibrant AMOLED display. Water-resistant and compatible with iOS and Android.',
    storeId: 'store-3',
    storeName: 'Tech Gadget Hub',
    category: 'Electronics',
    featured: true,
    stockCount: 25,
    averageRating: 4.3,
    reviewCount: 28,
  },
];

export const getFeaturedStores = (): Store[] => stores.filter(store => store.featured).slice(0, 3);
export const getFeaturedProducts = (): Product[] => products.filter(product => product.featured).slice(0, 4);

export const getAllStores = (): Store[] => stores;
export const getStoreById = (id: string): Store | undefined => stores.find(store => store.id === id);
export const getProductsByStoreId = (storeId: string): Product[] => products.filter(product => product.storeId === storeId);

export const getAllProducts = (): Product[] => products;
export const getProductById = (id: string): Product | undefined => products.find(product => product.id === id);
