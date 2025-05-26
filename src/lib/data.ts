
import type { Store, Product, CreateOrderInput, CreateOrderItemInput } from '@/types';
import type { Product as SupabaseProduct, Store as SupabaseStore, ProductImage as SupabaseProductImage, Order as SupabaseOrder, OrderItem as SupabaseOrderItem } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper to map Supabase product to app product, including images and store name
const mapSupabaseProductToAppProduct = async (
  supabase: SupabaseClient,
  supabaseProduct: SupabaseProduct,
  allProductImages?: SupabaseProductImage[], // Optional pre-fetched images for performance
  allStoresMap?: Map<string, { name: string }> // Optional pre-fetched store names
): Promise<Product> => {
  // Fetch images if not provided
  let productImagesData = allProductImages?.filter(img => img.product_id === supabaseProduct.id) || [];
  if (!allProductImages) {
    const { data, error } = await supabase
      .from('product_images')
      .select('image_url, order, product_id, id')
      .eq('product_id', supabaseProduct.id)
      .order('order');
    if (error) console.error(`[mapSupabaseProductToAppProduct] Error fetching images for product ${supabaseProduct.id}:`, error);
    productImagesData = data || [];
  }

  const productImages = productImagesData
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    .map(img => img.image_url);

  // Fetch store name if not provided or in map
  let storeName = 'Unknown Store';
  if (supabaseProduct.store_id) {
    if (allStoresMap && allStoresMap.has(supabaseProduct.store_id)) {
      storeName = allStoresMap.get(supabaseProduct.store_id)!.name;
    } else {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('name')
        .eq('id', supabaseProduct.store_id)
        .eq('status', 'Active') // Ensure we only link to Active stores
        .single();
      if (storeError && storeError.code !== 'PGRST116') { // PGRST116 is "No rows found"
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
    averageRating: undefined, // Placeholder, can be implemented later
    reviewCount: undefined,   // Placeholder, can be implemented later
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

// Store Data Functions
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
    if (error.code === 'PGRST116') {
      console.warn(`[getStoreById] No store found with ID: ${id} and status "Active". This could be due to the store not existing, not being "Active", or RLS policies blocking access.`);
      return undefined;
    }
    console.error(`[getStoreById] Error fetching store ${id}:`, error);
    throw new Error(`Failed to fetch store ${id}: ${error.message}`);
  }
   if (!data) {
     console.warn(`[getStoreById] Store data is null for ID: ${id} (and status "Active"), though no PGRST116 error was thrown. This usually indicates an RLS policy silently filtered the result.`);
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
    console.warn('[getFeaturedStores] Supabase query for "Active" featured stores was successful but returned no data. Check "stores" table data (status=\'Active\') and RLS policies for the "anon" role.');
  } else {
    console.log(`[getFeaturedStores] Fetched ${data.length} "Active" featured stores.`);
  }
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
};


// Product Data Functions
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
    if (productError.code === 'PGRST116') return undefined; // Not found is not an error here
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
    .select('*') 
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

// Order creation functions
export const createOrder = async (supabase: SupabaseClient, orderInput: CreateOrderInput): Promise<SupabaseOrder> => {
  console.log('[createOrder] Attempting to create order with input (including lat/lng if provided):', orderInput);
  
  const { data, error } = await supabase
    .from('orders')
    .insert([orderInput]) // Pass the full orderInput, including lat/lng
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
    if (error.code === 'PGRST116') return null; 
    throw new Error(`Failed to fetch stock for product ${productId}: ${error.message}`);
  }
  return data?.stock ?? null;
};

