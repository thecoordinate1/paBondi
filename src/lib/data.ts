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
    imageUrl: 'https://placehold.co/300x300.png',
    description: 'A beautiful ring featuring a deep blue sapphire.',
    storeId: 'store-1',
    storeName: 'Blue Sapphire Corner',
    category: 'Jewelry',
    featured: true,
  },
  {
    id: 'prod-2',
    name: 'Silk Scarf',
    price: 49.99,
    imageUrl: 'https://placehold.co/300x300.png',
    description: 'Luxurious silk scarf with modern design.',
    storeId: 'store-2',
    storeName: 'Modern Threads',
    category: 'Accessories',
    featured: true,
  },
  {
    id: 'prod-3',
    name: 'Wireless Headphones',
    price: 129.50,
    imageUrl: 'https://placehold.co/300x300.png',
    description: 'High-fidelity wireless headphones with noise cancellation.',
    storeId: 'store-3',
    storeName: 'Tech Gadget Hub',
    category: 'Electronics',
  },
  {
    id: 'prod-4',
    name: 'Organic Olive Oil',
    price: 25.00,
    imageUrl: 'https://placehold.co/300x300.png',
    description: 'Extra virgin organic olive oil, cold-pressed.',
    storeId: 'store-4',
    storeName: 'Gourmet Pantry',
    category: 'Food',
    featured: true,
  },
  {
    id: 'prod-5',
    name: 'Leather Wallet',
    price: 75.00,
    imageUrl: 'https://placehold.co/300x300.png',
    description: 'Handcrafted genuine leather wallet.',
    storeId: 'store-2',
    storeName: 'Modern Threads',
    category: 'Accessories',
  },
  {
    id: 'prod-6',
    name: 'Smartwatch Series X',
    price: 249.99,
    imageUrl: 'https://placehold.co/300x300.png',
    description: 'Feature-rich smartwatch with health tracking.',
    storeId: 'store-3',
    storeName: 'Tech Gadget Hub',
    category: 'Electronics',
    featured: true,
  },
];

export const getFeaturedStores = (): Store[] => stores.filter(store => store.featured).slice(0, 3);
export const getFeaturedProducts = (): Product[] => products.filter(product => product.featured).slice(0, 4);

export const getAllStores = (): Store[] => stores;
export const getStoreById = (id: string): Store | undefined => stores.find(store => store.id === id);
export const getProductsByStoreId = (storeId: string): Product[] => products.filter(product => product.storeId === storeId);

export const getAllProducts = (): Product[] => products;
export const getProductById = (id: string): Product | undefined => products.find(product => product.id === id);
