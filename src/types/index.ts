
export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrls: string[]; // Changed from imageUrl
  description: string;
  storeId: string;
  storeName?: string; // Denormalized for convenience
  category?: string;
  featured?: boolean;
  stockCount?: number; // Added for stock level
  averageRating?: number; // Added for star ratings
  reviewCount?: number; // Added for star ratings
}

export interface Store {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  featured?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
