
export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  description: string;
  storeId: string;
  storeName?: string;
  category?: string;
  featured?: boolean;
  stockCount?: number;
  averageRating?: number;
  reviewCount?: number;
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

export interface OrderFormData {
  name: string;
  email: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
  latitude?: string;
  longitude?: string;
}

export interface CreateOrderInput {
  store_id: string;
  customer_name: string;
  customer_email: string;
  order_date: string; // ISO string
  total_amount: number;
  status: string;
  shipping_address: string;
  billing_address: string;
  shipping_latitude?: number | null;
  shipping_longitude?: number | null;
  // Optional fields from schema
  customer_id?: string | null;
  shipping_method?: string | null;
  payment_method?: string | null;
  tracking_number?: string | null;
}

export interface CreateOrderItemInput {
  order_id: string;
  product_id: string | null; // Can be null if product deleted but snapshot exists
  product_name_snapshot: string;
  quantity: number;
  price_per_unit_snapshot: number;
  product_image_url_snapshot?: string | null;
}

// For displaying fetched order items
export interface AppOrderItem {
  id: string; // Order item ID
  productId?: string | null;
  name: string;
  quantity: number;
  pricePerUnit: number;
  imageUrl?: string | null;
  totalPrice: number;
}

// For displaying a fetched order
export interface AppOrder {
  id: string;
  storeId: string;
  // customerId?: string | null; // Add if needed later
  customerName: string;
  customerEmail: string;
  orderDate: string; // ISO string
  totalAmount: number;
  status: string;
  shippingAddress: string;
  billingAddress: string;
  shippingMethod?: string | null;
  paymentMethod?: string | null;
  trackingNumber?: string | null;
  shippingLatitude?: number | null;
  shippingLongitude?: number | null;
  createdAt: string;
  updatedAt: string;
  items: AppOrderItem[];
}
