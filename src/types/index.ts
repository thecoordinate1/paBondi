
export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  storeId: string;
  storeName?: string; // Denormalized for convenience
  category?: string;
  featured?: boolean;
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
