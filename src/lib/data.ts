
import type { Store, Product } from '@/types';
import type { Product as SupabaseProduct, Store as SupabaseStore, ProductImage as SupabaseProductImage } from '@/types/supabase';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'; // Import SupabaseClient and PostgrestError
// Removed: import { createClient } from '@/lib/supabase/server';
// Removed: import { cookies } from 'next/headers';

const mapSupabaseProductToAppProduct = async (
  supabase: SupabaseClient, // Added supabase client as parameter
  supabaseProduct: SupabaseProduct,
  allProductImages?: SupabaseProductImage[], // Made optional, can fetch if not provided
  allStoresMap?: Map<string, { name: string }> // Made optional, can fetch if not provided
): Promise<Product> => {
  let productImagesData = allProductImages;
  if (!productImagesData) {
    const { data, error } = await supabase
      .from('product_images')
      .select('image_url, order, product_id, id')
      .eq('product_id', supabaseProduct.id)
      .order('order');
    if (error) console.error(`Error fetching images for product ${supabaseProduct.id}:`, error);
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
    if (storeError && storeError.code !== 'PGRST116') console.error(`Error fetching store name for product ${supabaseProduct.id}:`, storeError);
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
    averageRating: undefined, // Placeholder
    reviewCount: undefined,   // Placeholder
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
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
};

export const getStoreById = async (supabase: SupabaseClient, id: string): Promise<Store | undefined> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error(`Error fetching store ${id}:`, error);
    }
    return undefined;
  }
  return data ? mapSupabaseStoreToAppStore(data) : undefined;
};

export const getAllProducts = async (supabase: SupabaseClient): Promise<Product[]> => {
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published');

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return [];
  }
  if (!productsData) return [];

  const productIds = productsData.map(p => p.id);
  const storeIds = [...new Set(productsData.map(p => p.store_id).filter(id => id))];

  let imagesData: SupabaseProductImage[] = [];
  if (productIds.length > 0) {
    const { data: fetchedImagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds);
    if (imagesError) console.error('Error fetching product images:', imagesError);
    imagesData = fetchedImagesData || [];
  }
  
  const storesMap = new Map<string, { name: string }>();
  if (storeIds.length > 0) {
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', storeIds);

    if (storesError) console.error('Error fetching store names for products:', storesError);
    if (storesData) {
      storesData.forEach(s => storesMap.set(s.id, { name: s.name }));
    }
  }
  
  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p, imagesData, storesMap))
  );
};

export const getProductById = async (supabase: SupabaseClient, id: string): Promise<Product | undefined> => {
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (productError || !productData) {
     if (productError && productError.code !== 'PGRST116') {
        console.error(`Error fetching product ${id}:`, productError);
     }
    return undefined;
  }
  // mapSupabaseProductToAppProduct will fetch images and store name if not provided
  return mapSupabaseProductToAppProduct(supabase, productData);
};

export const getProductsByStoreId = async (supabase: SupabaseClient, storeId: string): Promise<Product[]> => {
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'published');

  if (productsError) {
    console.error(`Error fetching products for store ${storeId}:`, productsError);
    return [];
  }
  if (!productsData) return [];

  // mapSupabaseProductToAppProduct will fetch images.
  // We can pre-fetch store name for efficiency.
  const {data: storeData, error: storeError} = await supabase.from('stores').select('id, name').eq('id', storeId).single();
  const storesMap = new Map<string, { name: string }>();
  if(storeData && !storeError) storesMap.set(storeData.id, {name: storeData.name});
  else if(storeError && storeError.code !== 'PGRST116') console.error(`Error fetching store ${storeId} for products list:`, storeError);
  
  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p, undefined, storesMap))
  );
};

export const getFeaturedStores = async (supabase: SupabaseClient): Promise<Store[]> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error fetching featured stores:', error);
    return [];
  }
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
};

export const getFeaturedProducts = async (supabase: SupabaseClient): Promise<Product[]> => {
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(4);

  if (productsError) {
    console.error('Error fetching featured products:', productsError);
    return [];
  }
  if (!productsData) return [];
  
  // mapSupabaseProductToAppProduct will fetch images and store names.
  // For a small number of featured products, fetching them individually inside map is acceptable.
  // For larger lists, pre-fetching images and stores (as in getAllProducts) is more efficient.
  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p))
  );
};
