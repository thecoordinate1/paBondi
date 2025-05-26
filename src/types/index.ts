
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

export interface OrderFormData {
  name: string;
  email: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
  latitude?: string; // Optional latitude
  longitude?: string; // Optional longitude
}

// Represents the structure for creating an order in the database
export interface CreateOrderInput {
  store_id: string; // From the first item in the cart for simplicity
  customer_name: string;
  customer_email: string;
  order_date: string; // ISO string
  total_amount: number;
  status: string; // e.g., "Pending", "Processing"
  shipping_address: string;
  billing_address: string; // Can be same as shipping for now
  shipping_latitude?: number | null; // Optional latitude
  shipping_longitude?: number | null; // Optional longitude
  // Optional fields like shipping_method, payment_method, tracking_number can be added later
}

// Represents the structure for creating order items in the database
export interface CreateOrderItemInput {
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  quantity: number;
  price_per_unit_snapshot: number;
  product_image_url_snapshot?: string | null;
}

// Represents an order as fetched or used in the app context (can be expanded)
export interface AppOrder extends CreateOrderInput {
  id: string;
  items: CartItem[]; // Or a more specific AppOrderItem type if needed
}

