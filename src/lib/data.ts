
import type { Store, Product } from '@/types';
import type { Product as SupabaseProduct, Store as SupabaseStore, ProductImage as SupabaseProductImage } from '@/types/supabase';
import { createClient } from '@/lib/supabase/server'; // Using server client for data fetching

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
  const supabase = createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('status', 'active'); // Assuming 'active' status for stores

  if (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
  return data ? data.map(mapSupabaseStoreToAppStore) : [];
};

export const getStoreById = async (id: string): Promise<Store | undefined> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error(`Error fetching store ${id}:`, error);
    return undefined;
  }
  return data ? mapSupabaseStoreToAppStore(data) : undefined;
};

export const getAllProducts = async (): Promise<Product[]> => {
  const supabase = createClient();

  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published'); // Assuming 'published' status for products

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return [];
  }
  if (!productsData) return [];

  const productIds = productsData.map(p => p.id);
  const storeIds = [...new Set(productsData.map(p => p.store_id))];

  const { data: imagesData, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', productIds);
  
  if (imagesError) console.error('Error fetching product images:', imagesError);

  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select('id, name')
    .in('id', storeIds);

  if (storesError) console.error('Error fetching store names for products:', storesError);

  const storesMap = new Map<string, { name: string }>();
  if (storesData) {
    storesData.forEach(s => storesMap.set(s.id, { name: s.name }));
  }
  
  const allProductImages = imagesData || [];

  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(p, allProductImages, storesMap))
  );
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  const supabase = createClient();
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (productError || !productData) {
    console.error(`Error fetching product ${id}:`, productError);
    return undefined;
  }

  const { data: imagesData, error: imagesError } = await supabase
    .from('product_images')
    .select('image_url, order')
    .eq('product_id', productData.id)
    .order('order');

  if (imagesError) {
    console.error(`Error fetching images for product ${id}:`, imagesError);
    // Continue without images if fetch fails, default will be used
  }
  
  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('id, name')
    .eq('id', productData.store_id)
    .single();

  if (storeError || !storeData) {
    console.error(`Error fetching store for product ${id}:`, storeError);
  }
  
  const storeName = storeData?.name || 'Unknown Store';
  const storeMap = new Map<string, { name: string }>();
  if (storeData) storeMap.set(storeData.id, { name: storeData.name });


  return mapSupabaseProductToAppProduct(productData, imagesData || [], storeMap);
};

export const getProductsByStoreId = async (storeId: string): Promise<Product[]> => {
  const supabase = createClient();
  
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
  
  const { data: imagesData, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', productIds);

  if (imagesError) console.error('Error fetching product images:', imagesError);

  // For products by store, we already know the store name or can fetch it once
  const storeData = await getStoreById(storeId);
  const storesMap = new Map<string, { name: string }>();
  if (storeData) storesMap.set(storeData.id, { name: storeData.name });
  
  const allProductImages = imagesData || [];

  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(p, allProductImages, storesMap))
  );
};

export const getFeaturedStores = async (): Promise<Store[]> => {
  const supabase = createClient();
  // No 'featured' field in Supabase 'stores' table. Fetching first 3 active stores as "featured".
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
  const supabase = createClient();
  // No 'featured' field in Supabase 'products' table. Fetching first 4 published products as "featured".
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
  const storeIds = [...new Set(productsData.map(p => p.store_id))];

  const { data: imagesData, error: imagesError } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', productIds);
  
  if (imagesError) console.error('Error fetching product images:', imagesError);

  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select('id, name')
    .in('id', storeIds);

  if (storesError) console.error('Error fetching store names for products:', storesError);

  const storesMap = new Map<string, { name: string }>();
  if (storesData) {
    storesData.forEach(s => storesMap.set(s.id, { name: s.name }));
  }
  
  const allProductImages = imagesData || [];
  
  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(p, allProductImages, storesMap))
  );
};
