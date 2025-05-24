
import type { Store, Product } from '@/types';
import type { Product as SupabaseProduct, Store as SupabaseStore, ProductImage as SupabaseProductImage } from '@/types/supabase';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers'; // Import cookies

const mapSupabaseProductToAppProduct = async (
  supabaseProduct: SupabaseProduct,
  allProductImages: SupabaseProductImage[],
  allStoresMap: Map<string, { name: string }>
): Promise<Product> => {
  const productImages = allProductImages
    .filter(img => img.product_id === supabaseProduct.id)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    .map(img => img.image_url);

  return {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    price: supabaseProduct.price,
    imageUrls: productImages.length > 0 ? productImages : ['https://placehold.co/600x600.png?text=No+Image'],
    description: supabaseProduct.full_description || supabaseProduct.description || 'No description available.',
    storeId: supabaseProduct.store_id,
    storeName: allStoresMap.get(supabaseProduct.store_id)?.name || 'Unknown Store',
    category: supabaseProduct.category,
    stockCount: supabaseProduct.stock,
    // featured, averageRating, reviewCount are not directly available from this basic fetch
    // and will be undefined or handled by UI default
  };
};

const mapSupabaseStoreToAppStore = (supabaseStore: SupabaseStore): Store => {
  return {
    id: supabaseStore.id,
    name: supabaseStore.name,
    logoUrl: supabaseStore.logo_url || 'https://placehold.co/100x100.png?text=No+Logo',
    description: supabaseStore.description,
    // featured is not directly available
  };
};

export const getAllStores = async (): Promise<Store[]> => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
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

export const getStoreById = async (id: string): Promise<Store | undefined> => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error) {
    // Don't log "Row not found" as a critical error for single() queries
    if (error.code !== 'PGRST116') {
      console.error(`Error fetching store ${id}:`, error);
    }
    return undefined;
  }
  return data ? mapSupabaseStoreToAppStore(data) : undefined;
};

export const getAllProducts = async (): Promise<Product[]> => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

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
  const storeIds = [...new Set(productsData.map(p => p.store_id).filter(id => id))]; // Filter out null/undefined store_ids

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
    productsData.map(p => mapSupabaseProductToAppProduct(p, imagesData, storesMap))
  );
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (productError || !productData) {
     if (productError && productError.code !== 'PGRST116') { // Row not found is expected for notFound()
        console.error(`Error fetching product ${id}:`, productError);
     }
    return undefined;
  }

  const { data: imagesData, error: imagesError } = await supabase
    .from('product_images')
    .select('image_url, order, product_id, id') // ensure product_id and id are part of the type
    .eq('product_id', productData.id)
    .order('order');

  if (imagesError) {
    console.error(`Error fetching images for product ${id}:`, imagesError);
  }
  
  const storeMap = new Map<string, { name: string }>();
  if (productData.store_id) {
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', productData.store_id)
      .single();

    if (storeError && storeError.code !== 'PGRST116') {
        console.error(`Error fetching store for product ${id}:`, storeError);
    }
    if (storeData) storeMap.set(storeData.id, { name: storeData.name });
  }

  return mapSupabaseProductToAppProduct(productData, imagesData || [], storeMap);
};

export const getProductsByStoreId = async (storeId: string): Promise<Product[]> => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
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

  const productIds = productsData.map(p => p.id);
  
  let imagesData: SupabaseProductImage[] = [];
  if (productIds.length > 0) {
    const { data: fetchedImagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .in('product_id', productIds);
    if (imagesError) console.error('Error fetching product images:', imagesError);
    imagesData = fetchedImagesData || [];
  }

  const storeData = await getStoreById(storeId); // Reuses existing function which handles its own client
  const storesMap = new Map<string, { name: string }>();
  if (storeData) storesMap.set(storeData.id, { name: storeData.name });
  
  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(p, imagesData, storesMap))
  );
};

export const getFeaturedStores = async (): Promise<Store[]> => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
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

export const getFeaturedProducts = async (): Promise<Product[]> => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
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
  
  const productIds = productsData.map(p => p.id);
  const storeIds = [...new Set(productsData.map(p => p.store_id).filter(id => id))];

  let imagesData: SupabaseProductImage[] = [];
  if (productIds.length > 0) {
      const { data: fetchedImagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds);
      if (imagesError) console.error('Error fetching product images for featured products:', imagesError);
      imagesData = fetchedImagesData || [];
  }
  
  const storesMap = new Map<string, { name: string }>();
  if (storeIds.length > 0) {
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .in('id', storeIds);
      if (storesError) console.error('Error fetching store names for featured products:', storesError);
      if (storesData) {
        storesData.forEach(s => storesMap.set(s.id, { name: s.name }));
      }
  }
  
  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(p, imagesData, storesMap))
  );
};
