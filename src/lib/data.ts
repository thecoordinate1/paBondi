
import type { Store, Product, CreateOrderInput, CreateOrderItemInput, AppOrder, AppOrderItem } from '@/types';
import type { Product as SupabaseProduct, Store as SupabaseStore, ProductImage as SupabaseProductImage, Order as SupabaseOrder, OrderItem as SupabaseOrderItem } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

const mapSupabaseProductToAppProduct = async (
  supabase: SupabaseClient,
  supabaseProduct: SupabaseProduct,
  allProductImages?: SupabaseProductImage[],
  allStoresMap?: Map<string, { name: string }>
): Promise<Product> => {
  let productImagesData = allProductImages?.filter(img => img.product_id === supabaseProduct.id) || [];
  if (!allProductImages && supabaseProduct.id) {
    const { data, error } = await supabase
      .from('product_images')
      .select('image_url, order, product_id, id')
      .eq('product_id', supabaseProduct.id)
      .order('order');
    if (error) console.error(`[mapSupabaseProductToAppProduct] Error fetching images for product ${supabaseProduct.id}:`, error);
    else productImagesData = data || [];
  }

  const productImages = productImagesData
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    .map(img => img.image_url);

  let storeName = 'Unknown Store';
  if (supabaseProduct.store_id) {
    if (allStoresMap && allStoresMap.has(supabaseProduct.store_id)) {
      storeName = allStoresMap.get(supabaseProduct.store_id)!.name;
    } else {
      // Fetch store name only if store_id exists and not found in map
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('name')
        .eq('id', supabaseProduct.store_id)
        .eq('status', 'Active') // Ensure we get an Active store's name
        .single();
      if (storeError && storeError.code !== 'PGRST116') { // PGRST116 is "No rows found", which is acceptable
        console.error(`[mapSupabaseProductToAppProduct] Error fetching store name for product ${supabaseProduct.id} (Store ID: ${supabaseProduct.store_id}):`, storeError);
      }
      if (storeData) {
        storeName = storeData.name;
      } else {
         console.warn(`[mapSupabaseProductToAppProduct] Could not fetch Active store name for product ${supabaseProduct.id} (Store ID: ${supabaseProduct.store_id}). Defaulting to 'Unknown Store'.`);
      }
    }
  }

  return {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    price: supabaseProduct.price,
    imageUrls: productImages.length > 0 ? productImages : ['https://placehold.co/600x600.png?text=No+Image'],
    description: supabaseProduct.full_description || supabaseProduct.description || 'No description available.',
    storeId: supabaseProduct.store_id,
    storeName: storeName,
    category: supabaseProduct.category,
    stockCount: supabaseProduct.stock,
    averageRating: undefined, // Placeholder, implement actual fetching if needed
    reviewCount: undefined,  // Placeholder
  };
};

const mapSupabaseStoreToAppStore = (supabaseStore: SupabaseStore): Store => {
  return {
    id: supabaseStore.id,
    name: supabaseStore.name,
    logoUrl: supabaseStore.logo_url || 'https://placehold.co/100x100.png?text=No+Logo',
    description: supabaseStore.description,
  };
};

export const getAllStores = async (supabase: SupabaseClient): Promise<Store[]> => {
  console.log('[getAllStores] Fetching stores with status "Active"...');
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'Active');

  if (error) {
    console.error('[getAllStores] Error fetching stores:', error);
    throw error;
  }
  if (!data || data.length === 0) {
    console.warn('[getAllStores] Supabase query for "Active" stores was successful but returned no data. Check "stores" table data (status=\'Active\') and RLS policies for the "anon" role.');
  } else {
    console.log(`[getAllStores] Fetched ${data.length} "Active" stores.`);
  }
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
};

export const getStoreById = async (supabase: SupabaseClient, id: string): Promise<Store | undefined> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('status', 'Active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // "No rows found"
      console.warn(`[getStoreById] No store found with ID: ${id} and status "Active".`);
      return undefined;
    }
    console.error(`[getStoreById] Error fetching store ${id}:`, error);
    throw new Error(`Failed to fetch store ${id}: ${error.message}`);
  }
   if (!data) { // Should be caught by PGRST116 if no rows, but good to have
     console.warn(`[getStoreById] Store data is null for ID: ${id} (and status "Active").`);
    return undefined;
  }
  return mapSupabaseStoreToAppStore(data);
};

export const getFeaturedStores = async (supabase: SupabaseClient): Promise<Store[]> => {
  console.log('[getFeaturedStores] Fetching featured stores with status "Active"...');
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'Active')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('[getFeaturedStores] Error fetching featured stores:', error);
    throw error;
  }
   if (!data || data.length === 0) {
    console.warn('[getFeaturedStores] Supabase query for "Active" featured stores was successful but returned no data.');
  } else {
    console.log(`[getFeaturedStores] Fetched ${data.length} "Active" featured stores.`);
  }
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
};

export const getAllProducts = async (supabase: SupabaseClient): Promise<Product[]> => {
  console.log('[getAllProducts] Attempting to fetch products with status "Active".');
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'Active');

  if (productsError) {
    console.error('[getAllProducts] Supabase error object while fetching products:', productsError);
    throw new Error(`Supabase error fetching products: ${productsError.message}. Code: ${productsError.code}. Details: ${productsError.details}. Hint: ${productsError.hint}.`);
  }
  if (!productsData) {
    console.warn('[getAllProducts] productsData is null after fetching, and no error was thrown by Supabase.');
    return [];
  }
  if (productsData.length === 0) {
    console.warn('[getAllProducts] No products found with status "Active". Check your database table "products", ensure items have status "Active", and verify RLS policies allow read access for the anon role.');
    return [];
  }
  console.log(`[getAllProducts] Fetched ${productsData.length} products with status "Active" initially.`);
  
  // Optimized image and store fetching
  const productIds = productsData.map(p => p.id);
  let allProductImages: SupabaseProductImage[] = [];
  if (productIds.length > 0) {
    const { data: images, error: imgError } = await supabase.from('product_images').select('*').in('product_id', productIds);
    if (imgError) console.error('[getAllProducts] Error fetching images:', imgError);
    else allProductImages = images || [];
  }

  const storeIds = [...new Set(productsData.map(p => p.store_id).filter(Boolean))] as string[];
  const storesMap = new Map<string, { name: string }>();
  if (storeIds.length > 0) {
    const { data: stores, error: storeError } = await supabase.from('stores').select('id, name').in('id', storeIds).eq('status', 'Active');
    if (storeError) console.error('[getAllProducts] Error fetching store names:', storeError);
    else stores?.forEach(s => storesMap.set(s.id, { name: s.name }));
  }
  
  const mappedProducts = await Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p as SupabaseProduct, allProductImages, storesMap))
  );
  console.log(`[getAllProducts] Successfully mapped ${mappedProducts.length} products.`);
  return mappedProducts;
};

export const getProductById = async (supabase: SupabaseClient, id: string): Promise<Product | undefined> => {
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 'Active')
    .single();

  if (productError) {
    if (productError.code === 'PGRST116') return undefined; // Not found is not an error for a "get by ID"
    console.error(`[getProductById] Error fetching product ${id}:`, productError);
    throw new Error(`Failed to fetch product ${id}: ${productError.message}`);
  }
  if (!productData) return undefined;

  return mapSupabaseProductToAppProduct(supabase, productData as SupabaseProduct);
};

export const getProductsByStoreId = async (supabase: SupabaseClient, storeId: string): Promise<Product[]> => {
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'Active');

  if (productsError) {
    console.error(`[getProductsByStoreId] Error fetching products for store ${storeId}:`, productsError);
    throw new Error(`Failed to fetch products for store ${storeId}: ${productsError.message}`);
  }
  if (!productsData || productsData.length === 0) return [];

  const productIds = productsData.map(p => p.id);
  let allProductImages: SupabaseProductImage[] = [];
   if (productIds.length > 0) {
    const { data: images, error: imgError } = await supabase.from('product_images').select('*').in('product_id', productIds);
    if (imgError) console.error(`[getProductsByStoreId] Error fetching images for store ${storeId} products:`, imgError);
    else allProductImages = images || [];
  }
  
  // Fetch the specific store's name to pass to mapping function
  const storesMap = new Map<string, { name: string }>();
  const { data: storeData, error: storeError } = await supabase.from('stores').select('id, name').eq('id', storeId).eq('status', 'Active').single();
  if(storeError && storeError.code !== 'PGRST116') console.error(`[getProductsByStoreId] Error fetching store name for store ${storeId}:`, storeError);
  if(storeData) storesMap.set(storeData.id, { name: storeData.name });

  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p as SupabaseProduct, allProductImages, storesMap))
  );
};

export const getFeaturedProducts = async (supabase: SupabaseClient): Promise<Product[]> => {
  console.log('[getFeaturedProducts] Fetching featured (most recent 4 active) products...');
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*') // Simplified select
    .eq('status', 'Active')
    .order('created_at', { ascending: false })
    .limit(4);

  if (productsError) {
    console.error('[getFeaturedProducts] Supabase error object while fetching featured products:', productsError);
    throw new Error(`Failed to fetch featured products: ${productsError.message}. Code: ${productsError.code}. Details: ${productsError.details}. Hint: ${productsError.hint}.`);
  }
  if (!productsData) {
    console.warn('[getFeaturedProducts] productsData is null for featured products.');
    return [];
  }
  if (productsData.length === 0) {
    console.log('[getFeaturedProducts] No Active products found to feature.');
    return [];
  }
  console.log(`[getFeaturedProducts] Fetched ${productsData.length} products to feature.`);
  
  const productIds = productsData.map(p => p.id);
  let allProductImages: SupabaseProductImage[] = [];
  if (productIds.length > 0) {
    const { data: images, error: imgError } = await supabase.from('product_images').select('*').in('product_id', productIds);
    if (imgError) console.error('[getFeaturedProducts] Error fetching images:', imgError);
    else allProductImages = images || [];
  }

  const storeIds = [...new Set(productsData.map(p => p.store_id).filter(Boolean))] as string[];
  const storesMap = new Map<string, { name: string }>();
  if (storeIds.length > 0) {
    const { data: stores, error: storeError } = await supabase.from('stores').select('id, name').in('id', storeIds).eq('status', 'Active');
    if (storeError) console.error('[getFeaturedProducts] Error fetching store names:', storeError);
    else stores?.forEach(s => storesMap.set(s.id, { name: s.name }));
  }

  const mappedProducts = await Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p as SupabaseProduct, allProductImages, storesMap))
  );
  console.log(`[getFeaturedProducts] Successfully mapped ${mappedProducts.length} featured products.`);
  return mappedProducts;
};

export const createOrder = async (supabase: SupabaseClient, orderInput: CreateOrderInput): Promise<SupabaseOrder> => {
  console.log('[createOrder] Attempting to create order with input:', orderInput);
  
  const { data, error } = await supabase
    .from('orders')
    .insert([orderInput]) // orderInput now includes lat/lng
    .select()
    .single(); 

  if (error) {
    console.error('[createOrder] Error creating order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
  if (!data) {
    console.error('[createOrder] Order data is null after insert, though no error was thrown.');
    throw new Error('Order creation succeeded but no data was returned.');
  }
  console.log('[createOrder] Order created successfully:', data.id);
  return data;
};

export const createOrderItems = async (supabase: SupabaseClient, orderItemsInput: CreateOrderItemInput[]): Promise<SupabaseOrderItem[]> => {
  const { data, error } = await supabase
    .from('order_items')
    .insert(orderItemsInput)
    .select();

  if (error) {
    console.error('[createOrderItems] Error creating order items:', error);
    throw new Error(`Failed to create order items: ${error.message}`);
  }
   if (!data) {
    console.error('[createOrderItems] Order items data is null after insert, though no error was thrown.');
    throw new Error('Order items creation succeeded but no data was returned.');
  }
  return data;
};

export const updateProductStock = async (supabase: SupabaseClient, productId: string, newStockCount: number): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({ stock: newStockCount, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) {
    console.error(`[updateProductStock] Error updating stock for product ${productId}:`, error);
    throw new Error(`Failed to update stock for product ${productId}: ${error.message}`);
  }
};

export const getProductStock = async (supabase: SupabaseClient, productId: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  if (error) {
    console.error(`[getProductStock] Error fetching stock for product ${productId}:`, error);
    if (error.code === 'PGRST116') return null; // Product not found
    throw new Error(`Failed to fetch stock for product ${productId}: ${error.message}`);
  }
  return data?.stock ?? null;
};

// Fetches a single order and its items by Order ID
export const getOrderDetailsById = async (supabase: SupabaseClient, orderId: string): Promise<AppOrder | null> => {
  console.log(`[getOrderDetailsById] Fetching order details for ID: ${orderId}`);
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) {
    if (orderError.code === 'PGRST116') { // "No rows found"
      console.warn(`[getOrderDetailsById] No order found with ID: ${orderId}`);
      return null;
    }
    console.error(`[getOrderDetailsById] Error fetching order ${orderId}:`, orderError);
    // For a "get by ID", it's often better to throw if it's not a "not found" error.
    throw new Error(`Failed to fetch order ${orderId}: ${orderError.message}`);
  }

  if (!orderData) {
    // This case should ideally be caught by PGRST116, but as a fallback:
    console.warn(`[getOrderDetailsById] Order data is null for ID: ${orderId}, though no error was thrown.`);
    return null;
  }

  console.log(`[getOrderDetailsById] Fetched order data:`, orderData);

  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error(`[getOrderDetailsById] Error fetching items for order ${orderId}:`, itemsError);
    // Decide if you want to throw or return order without items
    // For now, we'll return the order but items array might be empty or mapping might fail
    // A more robust approach might be to throw here too, or ensure AppOrder allows items to be undefined.
    throw new Error(`Failed to fetch items for order ${orderId}: ${itemsError.message}`);
  }

  console.log(`[getOrderDetailsById] Fetched items data for order ${orderId}:`, itemsData);

  const appOrderItems: AppOrderItem[] = itemsData ? itemsData.map((item: SupabaseOrderItem) => ({
    id: item.id,
    productId: item.product_id,
    name: item.product_name_snapshot,
    quantity: item.quantity,
    pricePerUnit: item.price_per_unit_snapshot,
    imageUrl: item.product_image_url_snapshot || 'https://placehold.co/100x100.png?text=No+Image',
    totalPrice: item.quantity * item.price_per_unit_snapshot,
  })) : [];

  return {
    id: orderData.id,
    storeId: orderData.store_id,
    customerName: orderData.customer_name,
    customerEmail: orderData.customer_email,
    orderDate: orderData.order_date,
    totalAmount: orderData.total_amount,
    status: orderData.status,
    shippingAddress: orderData.shipping_address,
    billingAddress: orderData.billing_address,
    shippingMethod: orderData.shipping_method,
    paymentMethod: orderData.payment_method,
    trackingNumber: orderData.tracking_number,
    shippingLatitude: orderData.shipping_latitude,
    shippingLongitude: orderData.shipping_longitude,
    createdAt: orderData.created_at,
    updatedAt: orderData.updated_at,
    items: appOrderItems,
  };
};


// New function to find orders by various search terms
export async function findOrdersBySearchTerm(supabase: SupabaseClient, searchTerm: string): Promise<AppOrder | null> {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  let orderIdToFetch: string | null = null;

  if (uuidRegex.test(searchTerm)) {
    console.log(`[findOrdersBySearchTerm] Search term is a UUID, using directly: ${searchTerm}`);
    orderIdToFetch = searchTerm;
  } else {
    // Try searching by customer_email (exact, case-insensitive)
    console.log(`[findOrdersBySearchTerm] Trying to fetch by email: ${searchTerm}`);
    const { data: emailMatchOrder, error: emailError } = await supabase
      .from('orders')
      .select('id, order_date') // Only select id and order_date for deciding
      .ilike('customer_email', searchTerm) // Case-insensitive match for email
      .order('order_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emailError && emailError.code !== 'PGRST116') {
      console.error(`[findOrdersBySearchTerm] Error fetching order by email ${searchTerm}:`, emailError);
      // Not throwing, will try name next or return null if this was the last attempt.
    }
    if (emailMatchOrder) {
      console.log(`[findOrdersBySearchTerm] Found potential order by email, ID: ${emailMatchOrder.id}`);
      orderIdToFetch = emailMatchOrder.id;
    }

    // If no email match, try searching by customer_name (exact, case-insensitive)
    if (!orderIdToFetch) {
      console.log(`[findOrdersBySearchTerm] No email match, trying to fetch by name: ${searchTerm}`);
      const { data: nameMatchOrder, error: nameError } = await supabase
        .from('orders')
        .select('id, order_date') // Only select id and order_date
        .ilike('customer_name', searchTerm) // Case-insensitive match for name
        .order('order_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (nameError && nameError.code !== 'PGRST116') {
        console.error(`[findOrdersBySearchTerm] Error fetching order by name ${searchTerm}:`, nameError);
      }
      if (nameMatchOrder) {
        console.log(`[findOrdersBySearchTerm] Found potential order by name, ID: ${nameMatchOrder.id}`);
        orderIdToFetch = nameMatchOrder.id;
      }
    }
  }

  if (orderIdToFetch) {
    console.log(`[findOrdersBySearchTerm] Proceeding to fetch full details for Order ID: ${orderIdToFetch}`);
    return getOrderDetailsById(supabase, orderIdToFetch);
  }

  console.log(`[findOrdersBySearchTerm] No order found matching term: ${searchTerm}`);
  return null;
}
