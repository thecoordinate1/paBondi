
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
  customer_id?: string | null; // FK to customers table
  shipping_method?: string | null;
  payment_method?: string | null;
  tracking_number?: string | null;
}

export interface CreateOrderItemInput {
  order_id: string;
  product_id: string | null;
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
  customerId?: string | null;
}

// Customer related types for data operations
export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  status: string; // e.g., "active"
  street_address?: string | null;
  city?: string | null;
  state_province?: string | null;
  zip_postal_code?: string | null;
  country?: string | null;
  joined_date: string; // ISO string
  last_order_date: string; // ISO string
  total_spent: number;
  total_orders: number;
  tags?: string[] | null;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string | null;
  avatar_url?: string | null;
  status?: string;
  street_address?: string | null;
  city?: string | null;
  state_province?: string | null;
  zip_postal_code?: string | null;
  country?: string | null;
  last_order_date?: string; // ISO string
  total_spent?: number;
  total_orders?: number;
  tags?: string[] | null;
  // updated_at will be handled by trigger
}
