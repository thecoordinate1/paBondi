export interface SocialLinkItem {
  platform: string;
  url: string;
}

export type DeliveryMethod = 'pickup' | 'economy' | 'normal' | 'express';
export type DiscountType = 'percentage' | 'fixed_amount';

export interface Coupon {
  id: string;
  code: string;
  storeId: string;
  discountType: DiscountType;
  discountValue: number;
  minSpend?: number;
  description?: string | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrls: string[]; // App types usually handle images as array of strings
  description: string;
  storeId: string;
  storeName?: string;
  category?: string;
  stockCount?: number;
  averageRating?: number;
  reviewCount?: number;
  specifications?: any;
  attributes?: Record<string, any>;
  // New fields
  sku?: string | null;
  fullDescription?: string | null;
  weightKg?: number | null;
  dimensionsCm?: any;
  isDropshippable?: boolean | null;
  supplierProductId?: string | null;
  supplierPrice?: number | null;
  orderPrice?: number | null;
  tags?: string[] | null;
}


export interface Store {
  id: string;
  name: string;
  slug?: string;
  logoUrl: string;
  description: string;
  categories: string[];
  location?: string | null;
  contact_phone?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  socialLinks?: SocialLinkItem[];
  // New fields from SQL schema
  banner_url?: string | null;
  is_verified?: boolean;
  average_rating?: number;
  review_count?: number;
  contact_email?: string | null;
  contact_website?: string | null;
  data_ai_hint?: string | null;
  status?: string; // e.g. 'Active', 'Inactive'
  commission_rate?: number | null;
  settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderFormData {
  name: string;
  email: string;
  contactNumber: string;
  location: string; // Will hold coordinates like "lat, lng"
  mobileMoneyNumber: string;
  customer_specification?: string;
  deliveryMethod: DeliveryMethod;
}

export interface CreateOrderInput {
  store_id: string;
  customer_name: string;
  customer_email: string;
  order_date: string; // ISO string
  total_amount: number;
  delivery_cost: number;
  status: string;
  shipping_address: string;
  billing_address: string;
  shipping_latitude?: number | null;
  shipping_longitude?: number | null;
  customer_id?: string | null; // FK to customers table
  delivery_tier?: string | null;
  payment_method?: string | null;
  delivery_code?: string | null;
  customer_specification?: string | null;
  service_fees: number;
  escrow_transaction_id?: string | null;
  delivery_type?: 'courier' | 'self_delivery';
  pickup_address?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  driver_id?: string | null;
  notes?: any;
}

export interface CreateOrderItemInput {
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  quantity: number;
  price_per_unit_snapshot: number;
  product_image_url_snapshot?: string | null;
  data_ai_hint_snapshot?: string | null;
  cost_per_unit_snapshot?: number | null;
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
  storeName: string;
  storeContactPhone: string | null;
  customerName: string;
  customerEmail: string;
  orderDate: string; // ISO string
  totalAmount: number;
  deliveryCost: number | null;
  status: string;
  shippingAddress: string;
  billingAddress: string;
  shipping_method?: string | null; // Keep for now if needed, but we essentially mean delivery_tier
  delivery_tier?: string | null;
  paymentMethod?: string | null;
  delivery_code?: string | null;
  escrow_transaction_id?: string | null; // Added
  shippingLatitude?: number | null;
  shippingLongitude?: number | null;
  deliveryType?: string; // 'courier' or 'self_delivery'
  pickupAddress?: string | null;
  driverId?: string | null;
  customer_specification?: string | null;
  notes?: any;
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
  status?: string; // e.g., "Active"
  tags?: string[] | null;
  avatar_url?: string | null;
  street_address?: string | null;
  city?: string | null;
  state_province?: string | null;
  zip_postal_code?: string | null;
  country?: string | null;
  joined_date?: string | null; // ISO string
  total_spent?: number;
  total_orders?: number;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string | null;
  status?: string;
  tags?: string[] | null;
  avatar_url?: string | null;
  street_address?: string | null;
  city?: string | null;
  state_province?: string | null;
  zip_postal_code?: string | null;
  country?: string | null;
  last_order_date?: string | null; // ISO string
  total_spent?: number;
  total_orders?: number;
}

// For Server Action return type
export interface FetchOrdersResult {
  success: boolean;
  orders?: AppOrder[] | null;
  error?: string;
}

export interface PlaceOrderResult {
  success: boolean;
  orderIds?: string[];
  message?: string;
  error?: string; // General error if all fail before processing stores or critical customer error
  detailedErrors?: { storeId?: string; storeName?: string; message: string }[];
}

export interface DeliveryCostResult {
  success: boolean;
  costsByMethod?: { [key in DeliveryMethod]?: number }; // Cost for each tier
  costsByStore?: Record<string, number>; // Legacy or for specific store-cost breakdown
  error?: string;
  totalDeliveryCost?: number; // This can be deprecated or be the cost of the default method
}


export interface GeocodeResult {
  success: boolean;
  address?: string;
  error?: string;
}
