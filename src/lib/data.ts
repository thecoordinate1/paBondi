
import type { Store, Product } from '@/types';
import type { Product as SupabaseProduct, Store as SupabaseStore, ProductImage as SupabaseProductImage } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

const mapSupabaseProductToAppProduct = async (
  supabase: SupabaseClient,
  supabaseProduct: SupabaseProduct,
  allProductImages?: SupabaseProductImage[],
  allStoresMap?: Map<string, { name: string }>
): Promise<Product> => {
  // console.log(`[mapSupabaseProductToAppProduct] Mapping product ID: ${supabaseProduct.id}, Name: ${supabaseProduct.name}`);

  let productImagesData = allProductImages;
  if (!productImagesData) {
    // console.log(`[mapSupabaseProductToAppProduct] Product images not pre-fetched for ${supabaseProduct.id}. Fetching now.`);
    const { data, error } = await supabase
      .from('product_images')
      .select('image_url, order, product_id, id')
      .eq('product_id', supabaseProduct.id)
      .order('order');
    if (error) console.error(`[mapSupabaseProductToAppProduct] Error fetching images for product ${supabaseProduct.id} (${supabaseProduct.name}):`, error);
    productImagesData = data || [];
  } else {
    // console.log(`[mapSupabaseProductToAppProduct] Using pre-fetched images for ${supabaseProduct.id}. Found ${productImagesData.filter(img => img.product_id === supabaseProduct.id).length} relevant images.`);
  }

  const productImages = productImagesData
    .filter(img => img.product_id === supabaseProduct.id)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    .map(img => img.image_url);

  // console.log(`[mapSupabaseProductToAppProduct] Product ${supabaseProduct.id} has ${productImages.length} images after filtering and sorting.`);

  let storeName = 'Unknown Store';
  if (allStoresMap && supabaseProduct.store_id && allStoresMap.has(supabaseProduct.store_id)) {
    storeName = allStoresMap.get(supabaseProduct.store_id)!.name;
    // console.log(`[mapSupabaseProductToAppProduct] Found store name in pre-fetched map for product ${supabaseProduct.id}: ${storeName}`);
  } else if (supabaseProduct.store_id) {
    // console.log(`[mapSupabaseProductToAppProduct] Store name not in map for product ${supabaseProduct.id}. Fetching store ${supabaseProduct.store_id}.`);
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
      // console.log(`[mapSupabaseProductToAppProduct] Fetched store name for product ${supabaseProduct.id}: ${storeName}`);
    } else {
      // console.warn(`[mapSupabaseProductToAppProduct] Could not fetch Active store name for product ${supabaseProduct.id} (Store ID: ${supabaseProduct.store_id}).`);
    }
  } else {
    // console.log(`[mapSupabaseProductToAppProduct] Product ${supabaseProduct.id} has no store_id.`);
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
    averageRating: undefined, // Placeholder - to be implemented if reviews feature is added
    reviewCount: undefined,   // Placeholder - to be implemented if reviews feature is added
  };
};

const mapSupabaseStoreToAppStore = (supabaseStore: SupabaseStore): Store => {
  // console.log(`[mapSupabaseStoreToAppStore] Mapping store ID: ${supabaseStore.id}, Name: ${supabaseStore.name}`);
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
    .eq('status', 'Active');

  if (error) {
    console.error('[getAllStores] Error fetching stores:', error);
    throw new Error(`Failed to fetch stores: ${error.message}`);
  }
  if (!data || data.length === 0) {
    console.warn('[getAllStores] Supabase query for active stores was successful but returned no data. Check if stores exist with status "Active" and verify RLS policies for the "stores" table allow read access for the anon role.');
  } else {
    console.log(`[getAllStores] Fetched ${data.length} active stores.`);
  }
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
};

export const getStoreById = async (supabase: SupabaseClient, id: string): Promise<Store | undefined> => {
  console.log(`[getStoreById] Fetching store with ID: ${id}`);
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
  console.log(`[getStoreById] Successfully fetched store: ${data.name}`);
  return mapSupabaseStoreToAppStore(data);
};

export const getAllProducts = async (supabase: SupabaseClient): Promise<Product[]> => {
  console.log('[getAllProducts] Attempting to fetch products with status "Active".');
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'Active');

  // console.log('[getAllProducts] RAW Supabase Response for products:');
  // console.log('[getAllProducts] productsData:', JSON.stringify(productsData, null, 2));
  // console.log('[getAllProducts] productsError:', JSON.stringify(productsError, null, 2));

  if (productsError) {
    console.error('[getAllProducts] Supabase error object while fetching products:', {
      message: productsError.message,
      details: productsError.details,
      hint: productsError.hint,
      code: productsError.code,
    });
    throw new Error(`Supabase error fetching products: ${productsError.message}. Code: ${productsError.code}. Details: ${productsError.details}. Hint: ${productsError.hint}.`);
  }

  if (!productsData) {
    console.warn('[getAllProducts] productsData is null after fetching, and no error was thrown by Supabase. This is unexpected but might happen with certain RLS configurations.');
    return [];
  }

  if (productsData.length === 0) {
    console.warn('[getAllProducts] No products found with status "Active". Check your database table "products", ensure items have status "Active", and verify RLS policies allow read access for the anon role.');
    return [];
  }
  console.log(`[getAllProducts] Fetched ${productsData.length} products with status "Active" initially.`);


  const productIds = productsData.map(p => p.id);

  let imagesData: SupabaseProductImage[] = [];
  if (productIds.length > 0) {
    const { data: fetchedImagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds);
    if (imagesError) {
      console.error('[getAllProducts] Error fetching product images:', imagesError);
    } else {
      imagesData = fetchedImagesData || [];
      // console.log(`[getAllProducts] Fetched ${imagesData.length} images for ${productIds.length} products.`);
    }
  }

  const storeIds = [...new Set(productsData.map(p => p.store_id).filter(id => !!id))];
  const storesMap = new Map<string, { name: string }>();
  if (storeIds.length > 0) {
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', storeIds as string[])
      .eq('status', 'Active'); // Ensure we only map to Active stores

    if (storesError) {
      console.error('[getAllProducts] Error fetching store names for products:', storesError);
    } else if (storesData) {
      storesData.forEach(s => storesMap.set(s.id, { name: s.name }));
      // console.log(`[getAllProducts] Fetched ${storesMap.size} Active store names for products.`);
    }
  }

  try {
    const mappedProducts = await Promise.all(
      productsData.map(p => mapSupabaseProductToAppProduct(supabase, p, imagesData, storesMap))
    );
    // console.log(`[getAllProducts] Successfully mapped ${mappedProducts.length} products.`);

    if (productsData.length > 0 && mappedProducts.length === 0) {
      console.error('[getAllProducts] CRITICAL: Initial products were fetched, but mapping resulted in zero products. Check mapping logic and individual item errors in mapSupabaseProductToAppProduct.');
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
    .eq('status', 'Active')
    .single();

  if (productError) {
    if (productError.code === 'PGRST116') {
      console.warn(`[getProductById] No product found with ID: ${id} and status "Active". This could be due to the product not existing, not being "Active", or RLS policies blocking access.`);
      return undefined;
    }
    console.error(`[getProductById] Error fetching product ${id}:`, productError);
    throw new Error(`Failed to fetch product ${id}: ${productError.message}`);
  }
  if (!productData) {
     console.warn(`[getProductById] Product data is null for ID: ${id} (and status "Active"), though no PGRST116 error was thrown. Check RLS policies.`);
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
    .eq('status', 'Active');

  if (productsError) {
    console.error(`[getProductsByStoreId] Error fetching products for store ${storeId}:`, productsError);
    throw new Error(`Failed to fetch products for store ${storeId}: ${productsError.message}`);
  }
  if (!productsData) {
    console.warn(`[getProductsByStoreId] productsData is null for store ${storeId}.`);
    return [];
  }
  if (productsData.length === 0) {
    console.log(`[getProductsByStoreId] No Active products found for store ID: ${storeId}.`);
    return [];
  }
  // console.log(`[getProductsByStoreId] Fetched ${productsData.length} Active products for store ID: ${storeId}.`);

  // Fetch the store name for these products
  const {data: storeData, error: storeError} = await supabase.from('stores').select('id, name').eq('id', storeId).eq('status', 'Active').single();
  const storesMap = new Map<string, { name: string }>();

  if(storeError && storeError.code !== 'PGRST116') {
    console.error(`[getProductsByStoreId] Error fetching store ${storeId} for its products list:`, storeError);
  }
  if(storeData) {
    storesMap.set(storeData.id, {name: storeData.name});
  } else {
     console.warn(`[getProductsByStoreId] Could not fetch Active store name for store ID: ${storeId}`);
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
    .eq('status', 'Active')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('[getFeaturedStores] Error fetching featured stores:', error);
    throw new Error(`Failed to fetch featured stores: ${error.message}`);
  }
  if (!data || data.length === 0) {
    console.warn('[getFeaturedStores] Supabase query for featured active stores was successful but returned no data. Check if stores exist with status "Active" and verify RLS policies.');
  } else {
    console.log(`[getFeaturedStores] Fetched ${data.length} featured active stores.`);
  }
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
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
    console.error('[getFeaturedProducts] Supabase error object while fetching featured products:', {
      message: productsError.message,
      details: productsError.details,
      hint: productsError.hint,
      code: productsError.code,
    });
    throw new Error(`Failed to fetch featured products: ${productsError.message}. Details: ${productsError.details}. Hint: ${productsError.hint}. Code: ${productsError.code}`);
  }
  if (!productsData) {
    console.warn('[getFeaturedProducts] productsData is null for featured products.');
    return [];
  }
  if (productsData.length === 0) {
    console.log('[getFeaturedProducts] No Active products found to feature.');
    return [];
  }
  // console.log(`[getFeaturedProducts] Fetched ${productsData.length} products to feature.`);

  const productIds = productsData.map(p => p.id);
  let imagesData: SupabaseProductImage[] = [];
  if (productIds.length > 0) {
    const { data: fetchedImages, error: imgError } = await supabase.from('product_images').select('*').in('product_id', productIds);
    if (imgError) console.error('[getFeaturedProducts] Error fetching images for featured products:', imgError);
    else imagesData = fetchedImages || [];
  }

  const storeIds = [...new Set(productsData.map(p => p.store_id).filter(Boolean))];
  const storesMap = new Map<string, { name: string }>();
  if (storeIds.length > 0) {
    const { data: fetchedStores, error: strError } = await supabase.from('stores').select('id, name').in('id', storeIds as string[]).eq('status', 'Active');
    if (strError) console.error('[getFeaturedProducts] Error fetching store names for featured products:', strError);
    else if (fetchedStores) fetchedStores.forEach(s => storesMap.set(s.id, { name: s.name }));
  }

  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p, imagesData, storesMap))
  );
};

    