
export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  description: string;
  storeId: string;
  storeName?: string; // Denormalized for convenience, now optional
  category?: string;
  featured?: boolean; // Now optional
  stockCount?: number; // Already optional, will map from Supabase 'stock'
  averageRating?: number; // Now optional
  reviewCount?: number; // Now optional
}

export interface Store {
  id: string;
  name: string;
  logoUrl: string; // Will map from Supabase 'logo_url'
  description: string;
  featured?: boolean; // Now optional
}

export interface CartItem extends Product {
  quantity: number;
}
