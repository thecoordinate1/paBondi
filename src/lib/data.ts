
import type { Store, Product } from '@/types';
import type { Product as SupabaseProduct, Store as SupabaseStore, ProductImage as SupabaseProductImage } from '@/types/supabase';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

const mapSupabaseProductToAppProduct = async (
  supabase: SupabaseClient, 
  supabaseProduct: SupabaseProduct,
  allProductImages?: SupabaseProductImage[], 
  allStoresMap?: Map<string, { name: string }> 
): Promise<Product> => {
  let productImagesData = allProductImages;
  if (!productImagesData) {
    const { data, error } = await supabase
      .from('product_images')
      .select('image_url, order, product_id, id')
      .eq('product_id', supabaseProduct.id)
      .order('order');
    if (error) console.error(`Error fetching images for product ${supabaseProduct.id} (${supabaseProduct.name}):`, error);
    productImagesData = data || [];
  }

  const productImages = productImagesData
    .filter(img => img.product_id === supabaseProduct.id)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    .map(img => img.image_url);

  let storeName = 'Unknown Store';
  if (allStoresMap && supabaseProduct.store_id && allStoresMap.has(supabaseProduct.store_id)) {
    storeName = allStoresMap.get(supabaseProduct.store_id)!.name;
  } else if (supabaseProduct.store_id) {
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('name')
      .eq('id', supabaseProduct.store_id)
      .single();
    if (storeError && storeError.code !== 'PGRST116') {
      console.error(`Error fetching store name for product ${supabaseProduct.id} (${supabaseProduct.name}) (Store ID: ${supabaseProduct.store_id}):`, storeError);
    }
    if (storeData) storeName = storeData.name;
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
    averageRating: undefined, // Placeholder - to be implemented with actual review data
    reviewCount: undefined,   // Placeholder - to be implemented with actual review data
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
  console.log('[getAllStores] Fetching active stores...');
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('[getAllStores] Error fetching stores:', error);
    throw new Error(`Failed to fetch stores: ${error.message}`);
  }
  console.log(`[getAllStores] Fetched ${data ? data.length : 0} active stores.`);
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
};

export const getStoreById = async (supabase: SupabaseClient, id: string): Promise<Store | undefined> => {
  console.log(`[getStoreById] Fetching store with ID: ${id}`);
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 means no rows found, which is valid for a single() query
      console.error(`[getStoreById] Error fetching store ${id}:`, error);
      throw new Error(`Failed to fetch store ${id}: ${error.message}`);
    }
    console.log(`[getStoreById] No store found with ID: ${id} or it's not active.`);
    return undefined;
  }
  console.log(`[getStoreById] Successfully fetched store: ${data ? data.name : 'N/A'}`);
  return data ? mapSupabaseStoreToAppStore(data) : undefined;
};

export const getAllProducts = async (supabase: SupabaseClient): Promise<Product[]> => {
  console.log('[getAllProducts] Attempting to fetch products with status "published".');
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published');

  if (productsError) {
    console.error('[getAllProducts] Supabase error fetching products:', productsError);
    throw new Error(`Supabase error fetching products: ${productsError.message}. Details: ${productsError.details}. Hint: ${productsError.hint}`);
  }
  
  if (!productsData) {
    console.warn('[getAllProducts] productsData is null after fetching. This should not happen if no error was thrown.');
    return [];
  }

  console.log(`[getAllProducts] Fetched ${productsData.length} products with status "published" initially.`);
  if (productsData.length === 0) {
    console.warn('[getAllProducts] No products found with status "published". Check your database and RLS policies.');
    return [];
  }

  const productIds = productsData.map(p => p.id);
  
  let imagesData: SupabaseProductImage[] = [];
  if (productIds.length > 0) {
    console.log(`[getAllProducts] Fetching images for ${productIds.length} product IDs.`);
    const { data: fetchedImagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds);
    if (imagesError) {
        console.error('[getAllProducts] Error fetching product images:', imagesError);
        // Non-critical, products can be shown without images for now.
    }
    imagesData = fetchedImagesData || [];
    console.log(`[getAllProducts] Fetched ${imagesData.length} product images in total.`);
  }
  
  const storeIds = [...new Set(productsData.map(p => p.store_id).filter(id => !!id))];
  const storesMap = new Map<string, { name: string }>();
  if (storeIds.length > 0) {
    console.log(`[getAllProducts] Fetching store names for ${storeIds.length} unique store IDs.`);
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', storeIds as string[]); 

    if (storesError) {
        console.error('[getAllProducts] Error fetching store names for products:', storesError);
        // Store names might not be critical for all views, but good to log.
    }
    if (storesData) {
      storesData.forEach(s => storesMap.set(s.id, { name: s.name }));
      console.log(`[getAllProducts] Successfully mapped ${storesMap.size} store IDs to names.`);
    } else {
      console.warn('[getAllProducts] No store data returned for product store IDs.');
    }
  }
  
  try {
    console.log(`[getAllProducts] Starting mapping of ${productsData.length} products.`);
    const mappedProducts = await Promise.all(
      productsData.map(p => mapSupabaseProductToAppProduct(supabase, p, imagesData, storesMap))
    );
    console.log(`[getAllProducts] Successfully mapped ${mappedProducts.length} products.`);

    if (productsData.length > 0 && mappedProducts.length === 0) {
      console.error('[getAllProducts] CRITICAL: Initial products were fetched, but mapping resulted in zero products. Check mapping logic and individual item errors.');
      // Optionally, you could throw an error here if this state is unexpected
      // throw new Error("Product mapping failed: initial products found but none were successfully mapped.");
    }
    return mappedProducts;
  } catch (mappingError) {
    console.error('[getAllProducts] Error during product data mapping (Promise.all):', mappingError);
    throw new Error(`Error during product data mapping: ${ (mappingError as Error).message }`);
  }
};

export const getProductById = async (supabase: SupabaseClient, id: string): Promise<Product | undefined> => {
  console.log(`[getProductById] Fetching product with ID: ${id}`);
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (productError) {
     if (productError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error(`[getProductById] Error fetching product ${id}:`, productError);
        throw new Error(`Failed to fetch product ${id}: ${productError.message}`);
     }
    console.log(`[getProductById] No product found with ID: ${id} or it's not published.`);
    return undefined;
  }
  if (!productData) {
    console.log(`[getProductById] Product data is null for ID: ${id}, though no error was thrown.`);
    return undefined;
  }
  console.log(`[getProductById] Successfully fetched product: ${productData.name}`);
  return mapSupabaseProductToAppProduct(supabase, productData);
};

export const getProductsByStoreId = async (supabase: SupabaseClient, storeId: string): Promise<Product[]> => {
  console.log(`[getProductsByStoreId] Fetching products for store ID: ${storeId}`);
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'published');

  if (productsError) {
    console.error(`[getProductsByStoreId] Error fetching products for store ${storeId}:`, productsError);
    throw new Error(`Failed to fetch products for store ${storeId}: ${productsError.message}`);
  }
  if (!productsData) {
    console.warn(`[getProductsByStoreId] productsData is null for store ${storeId}.`);
    return [];
  }
  if (productsData.length === 0) {
    console.log(`[getProductsByStoreId] No published products found for store ID: ${storeId}.`);
    return [];
  }
  console.log(`[getProductsByStoreId] Fetched ${productsData.length} products for store ID: ${storeId}.`);

  const {data: storeData, error: storeError} = await supabase.from('stores').select('id, name').eq('id', storeId).single();
  const storesMap = new Map<string, { name: string }>();

  if(storeError && storeError.code !== 'PGRST116') {
    console.error(`[getProductsByStoreId] Error fetching store ${storeId} for its products list:`, storeError);
  }
  if(storeData) {
    storesMap.set(storeData.id, {name: storeData.name});
    console.log(`[getProductsByStoreId] Fetched store name for mapping: ${storeData.name}`);
  } else {
     console.warn(`[getProductsByStoreId] Could not fetch store name for store ID: ${storeId}`);
  }
  
  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p, undefined, storesMap))
  );
};

export const getFeaturedStores = async (supabase: SupabaseClient): Promise<Store[]> => {
  console.log('[getFeaturedStores] Fetching featured (most recent 3 active) stores...');
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('[getFeaturedStores] Error fetching featured stores:', error);
    throw new Error(`Failed to fetch featured stores: ${error.message}`);
  }
  console.log(`[getFeaturedStores] Fetched ${data ? data.length : 0} featured stores.`);
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
};

export const getFeaturedProducts = async (supabase: SupabaseClient): Promise<Product[]> => {
  console.log('[getFeaturedProducts] Fetching featured (most recent 4 published) products...');
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(4);

  if (productsError) {
    console.error('[getFeaturedProducts] Error fetching featured products:', productsError);
    throw new Error(`Failed to fetch featured products: ${productsError.message}`);
  }
  if (!productsData) {
    console.warn('[getFeaturedProducts] productsData is null for featured products.');
    return [];
  }
  if (productsData.length === 0) {
    console.log('[getFeaturedProducts] No products found to feature.');
    return [];
  }
  console.log(`[getFeaturedProducts] Fetched ${productsData.length} products to feature.`);
  
  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p))
  );
};

