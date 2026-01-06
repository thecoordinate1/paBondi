
import type { Store, Product, CreateOrderInput, CreateOrderItemInput, AppOrder, AppOrderItem, CreateCustomerInput, UpdateCustomerInput, SocialLinkItem, Coupon } from '@/types';
import type { Product as SupabaseProduct, Store as SupabaseStore, ProductImage as SupabaseProductImage, Order as SupabaseOrder, OrderItem as SupabaseOrderItem, Customer as SupabaseCustomer, SocialLink as SupabaseSocialLink, Coupon as SupabaseCoupon } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

const slugify = (text: string) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Swap spaces and underscores for a single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};


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
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('name')
        .eq('id', supabaseProduct.store_id)
        .eq('status', 'Active')
        .single();
      if (storeError && storeError.code !== 'PGRST116') {
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
    salePrice: supabaseProduct.sale_price ?? undefined,
    imageUrls: productImages,
    description: supabaseProduct.description || '',
    storeId: supabaseProduct.store_id,
    storeName: storeName,
    category: supabaseProduct.category,
    stockCount: supabaseProduct.stock,
    averageRating: supabaseProduct.average_rating || 0,
    reviewCount: supabaseProduct.review_count || 0,
    specifications: supabaseProduct.specifications,
    attributes: typeof supabaseProduct.attributes === 'object' ? supabaseProduct.attributes as Record<string, any> : {},
    // New fields
    sku: supabaseProduct.sku,
    fullDescription: supabaseProduct.full_description,
    weightKg: supabaseProduct.weight_kg,
    dimensionsCm: supabaseProduct.dimensions_cm,
    isDropshippable: supabaseProduct.is_dropshippable,
    supplierProductId: supabaseProduct.supplier_product_id,
    supplierPrice: supabaseProduct.supplier_price,
    orderPrice: supabaseProduct.order_price,
    tags: supabaseProduct.tags,
  };
};

const mapSupabaseStoreToAppStore = (
  supabaseStore: SupabaseStore,
  socialLinks?: SupabaseSocialLink[]
): Store => {
  return {
    id: supabaseStore.id,
    name: supabaseStore.name,
    slug: slugify(supabaseStore.name),
    logoUrl: supabaseStore.logo_url || '',
    description: supabaseStore.description,
    categories: (() => {
      const raw = supabaseStore.categories;
      // console.log(`[mapSupabaseStoreToAppStore] Processing categories for ${supabaseStore.name}:`, raw);
      if (!raw) return [];

      // Check if it's already an array (Supabase auto-conversion)
      if (Array.isArray(raw)) {
        return raw.map(item => String(item).trim());
      }

      // Ensure raw is a string before proceeding
      const rawString = String(raw);

      // Try parsing as JSON first
      try {
        const parsed = JSON.parse(rawString);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => String(item).trim());
        }
      } catch (e) {
        // Not valid JSON, proceed to fallback
      }

      // Fallback: Aggressively clean the string
      // Removes: [ ] { } < > " '
      return rawString
        .replace(/^[\s\[\{<]+|[\s\]\}>]+$/g, '') // Remove starting/ending brackets/braces/angles
        .replace(/["']/g, '')                     // Remove quotes
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0 && c !== 'null' && c !== 'undefined');
    })(),
    location: supabaseStore.location,
    contact_phone: supabaseStore.contact_phone,
    pickup_latitude: supabaseStore.pickup_latitude,
    pickup_longitude: supabaseStore.pickup_longitude,
    socialLinks: socialLinks?.map(sl => ({ platform: sl.platform, url: sl.url })) || [],
    banner_url: supabaseStore.banner_url || null,
    is_verified: supabaseStore.is_verified ?? false,
    average_rating: supabaseStore.average_rating ?? 0,
    review_count: supabaseStore.review_count ?? 0,
    contact_email: supabaseStore.contact_email,
    contact_website: supabaseStore.contact_website,
    data_ai_hint: supabaseStore.data_ai_hint,
    status: supabaseStore.status,
    commission_rate: supabaseStore.commission_rate,
    settings: supabaseStore.settings || {},
    created_at: supabaseStore.created_at,
    updated_at: supabaseStore.updated_at,
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
  return data ? data.map(store => mapSupabaseStoreToAppStore(store)) : [];
};

export const getStoreById = async (supabase: SupabaseClient, idOrSlug: string): Promise<Store | undefined> => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);

  let query = supabase.from('stores').select('*').eq('status', 'Active');

  if (isUUID) {
    console.log(`[getStoreById] Fetching store by UUID: ${idOrSlug}`);
    query = query.eq('id', idOrSlug);
  } else {
    console.log(`[getStoreById] Fetching store by slug: ${idOrSlug}`);
    // This is a temporary workaround. For performance, you should add a 'slug' column to your 'stores' table.
    // The following is inefficient as it fetches all stores and filters in code.
    const { data: allStores, error: allStoresError } = await supabase.from('stores').select('*').eq('status', 'Active');
    if (allStoresError) {
      console.error(`[getStoreById] Error fetching all stores to find slug: ${idOrSlug}`, allStoresError);
      throw new Error(`Failed to fetch stores to find slug: ${allStoresError.message}`);
    }
    const storeData = allStores.find(store => slugify(store.name) === idOrSlug);

    if (!storeData) {
      console.warn(`[getStoreById] No store found with slug: ${idOrSlug}`);
      return undefined;
    }
    // Since we found it, we can continue to fetch social links for it.
    const { data: socialLinksData, error: socialLinksError } = await supabase
      .from('social_links')
      .select('platform, url')
      .eq('store_id', storeData.id);

    if (socialLinksError) {
      console.error(`[getStoreById] Error fetching social links for store ${storeData.id}:`, socialLinksError);
    }

    return mapSupabaseStoreToAppStore(storeData, socialLinksData || undefined);
  }

  // This part only runs if it's a UUID
  const { data: storeData, error: storeError } = await query.single();

  if (storeError) {
    if (storeError.code === 'PGRST116') {
      console.warn(`[getStoreById] No store found with ID: ${idOrSlug} and status "Active".`);
      return undefined;
    }
    console.error(`[getStoreById] Error fetching store ${idOrSlug}:`, storeError);
    throw new Error(`Failed to fetch store ${idOrSlug}: ${storeError.message}`);
  }
  if (!storeData) {
    console.warn(`[getStoreById] Store data is null for ID: ${idOrSlug} (and status "Active").`);
    return undefined;
  }

  const { data: socialLinksData, error: socialLinksError } = await supabase
    .from('social_links')
    .select('platform, url')
    .eq('store_id', idOrSlug);

  if (socialLinksError) {
    console.error(`[getStoreById] Error fetching social links for store ${idOrSlug}:`, socialLinksError);
  }

  return mapSupabaseStoreToAppStore(storeData, socialLinksData || undefined);
};

export const getFeaturedStores = async (supabase: SupabaseClient): Promise<Store[]> => {
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
  return data ? data.map(store => mapSupabaseStoreToAppStore(store)) : [];
};

export const getAllProducts = async (supabase: SupabaseClient): Promise<Product[]> => {
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'Active');

  if (productsError) {
    console.error('[getAllProducts] Supabase error while fetching products:', productsError);
    throw new Error(`Supabase error fetching products: ${productsError.message}`);
  }

  return enrichProductsWithDetails(supabase, productsData || []);
};

export const findProducts = async (
  supabase: SupabaseClient,
  category?: string,
  filters?: Record<string, any>
): Promise<Product[]> => {
  let query = supabase.from('products').select('*').eq('status', 'Active');

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (filters && Object.keys(filters).length > 0) {
    // Use the @> operator to check if the attributes JSONB column contains the filters
    query = query.contains('attributes', filters);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[findProducts] Error fetching products:', error);
    throw error;
  }

  return enrichProductsWithDetails(supabase, data || []);
};

export const getProductStats = async (
  supabase: SupabaseClient,
  category: string,
  filters: Record<string, any>
): Promise<{ sellerCount: number; unitCount: number; previewImage?: string | null; attributes: Record<string, string[]>; minPrice: number; cheapestProduct: Product | null }> => {
  // Fetch id and attributes as well
  let query = supabase.from('products').select('id, store_id, stock, attributes, price, sale_price').eq('status', 'Active');

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (filters && Object.keys(filters).length > 0) {
    query = query.contains('attributes', filters);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getProductStats] Error:', JSON.stringify(error, null, 2));
    return { sellerCount: 0, unitCount: 0, attributes: {}, minPrice: 0, cheapestProduct: null };
  }

  if (!data || data.length === 0) return { sellerCount: 0, unitCount: 0, attributes: {}, minPrice: 0, cheapestProduct: null };

  const uniqueSellers = new Set(data.map(p => p.store_id)).size;
  const totalUnits = data.reduce((sum, p) => sum + (p.stock || 0), 0);

  // Aggregate attributes
  const attributesMap: Record<string, Set<string>> = {};
  data.forEach(p => {
    const attrs = p.attributes;
    if (attrs && typeof attrs === 'object' && !Array.isArray(attrs)) {
      Object.entries(attrs).forEach(([key, val]) => {
        if (key && val) {
          if (!attributesMap[key]) attributesMap[key] = new Set();
          if (typeof val === 'string') attributesMap[key].add(val);
          else if (typeof val === 'number') attributesMap[key].add(String(val));
          // If val is something else (like array), we might skip or join. Assuming simple strings/numbers for now.
        }
      });
    }
  });

  const attributes: Record<string, string[]> = {};
  Object.keys(attributesMap).forEach(key => {
    attributes[key] = Array.from(attributesMap[key]).sort();
  });

  // Calculate min price and find cheapest product ID
  let minPrice = Infinity;
  let cheapestProductId = null;

  data.forEach(p => {
    const effectivePrice = p.sale_price ?? p.price;
    if (effectivePrice < minPrice) {
      minPrice = effectivePrice;
      cheapestProductId = p.id;
    }
  });

  if (minPrice === Infinity) minPrice = 0;

  // Fetch full details for the cheapest product
  let cheapestProduct: Product | null = null;
  let previewImage = null;

  if (cheapestProductId) {
    // We already have a helper to get product by ID which maps it correctly
    const product = await getProductById(supabase, cheapestProductId);
    if (product) {
      cheapestProduct = product;
      // Use the product's first image as preview if available, otherwise fetch explicitly if needed (but getProductById gets images)
      if (product.imageUrls && product.imageUrls.length > 0) {
        previewImage = product.imageUrls[0];
      }
    }

    // Fallback image fetch logic if needed
    if (!previewImage) {
      const { data: imgData } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', cheapestProductId)
        .order('order')
        .limit(1)
        .maybeSingle();

      if (imgData) {
        previewImage = imgData.image_url;
      }
    }
  }

  return { sellerCount: uniqueSellers, unitCount: totalUnits, previewImage, attributes, minPrice, cheapestProduct };
};

export const getProductById = async (supabase: SupabaseClient, id: string): Promise<Product | undefined> => {
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 'Active')
    .single();

  if (productError) {
    if (productError.code === 'PGRST116') return undefined;
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

  const [imagesRes, storeRes] = await Promise.all([
    productIds.length > 0 ? supabase.from('product_images').select('*').in('product_id', productIds) : Promise.resolve({ data: [], error: null }),
    supabase.from('stores').select('id, name').eq('id', storeId).single()
  ]);

  if (imagesRes.error) console.error(`[getProductsByStoreId] Error fetching images for store ${storeId}:`, imagesRes.error);
  if (storeRes.error) console.error(`[getProductsByStoreId] Error fetching store ${storeId}:`, storeRes.error);

  const allProductImages = imagesRes.data || [];
  const storesMap = storeRes.data ? new Map([[storeRes.data.id, { name: storeRes.data.name }]]) : new Map();

  return Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p, allProductImages, storesMap))
  );
};

const enrichProductsWithDetails = async (supabase: SupabaseClient, productsData: SupabaseProduct[]): Promise<Product[]> => {
  if (!productsData || productsData.length === 0) {
    return [];
  }

  const storeIds = [...new Set(productsData.map(p => p.store_id).filter(Boolean))];
  const productIds = productsData.map(p => p.id);

  const [imagesRes, storesRes] = await Promise.all([
    supabase.from('product_images').select('*').in('product_id', productIds),
    supabase.from('stores').select('id, name').in('id', storeIds)
  ]);

  if (imagesRes.error) console.error('[enrichProductsWithDetails] Error fetching images:', imagesRes.error);
  if (storesRes.error) console.error('[enrichProductsWithDetails] Error fetching stores:', storesRes.error);

  const allProductImages = imagesRes.data || [];
  const storesMap = new Map(storesRes.data?.map(s => [s.id, { name: s.name }]));

  const mappedProducts = await Promise.all(
    productsData.map(p => mapSupabaseProductToAppProduct(supabase, p, allProductImages, storesMap))
  );
  return mappedProducts;
};



export const getFeaturedProducts = async (supabase: SupabaseClient, limit = 20): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'Active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getFeaturedProducts] Error fetching featured products:', error);
    throw error;
  }

  return enrichProductsWithDetails(supabase, data || []);
};

export const getBestSellingProducts = async (supabase: SupabaseClient, limit = 8): Promise<Product[]> => {
  // 1. Fetch order items to calculate popularity
  const { data: orderItems, error: orderError } = await supabase
    .from('order_items')
    .select('product_id, quantity');

  if (orderError) {
    console.error('[getBestSellingProducts] Error fetching order items:', orderError);
    // Fallback to featured if error
    return getFeaturedProducts(supabase);
  }

  // 2. Aggregate sales
  const productSales: Record<string, number> = {};
  orderItems?.forEach(item => {
    if (item.product_id) {
      productSales[item.product_id] = (productSales[item.product_id] || 0) + (item.quantity || 1);
    }
  });

  // 3. Sort by sales count
  const sortedProductIds = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a) // Descending order
    .slice(0, limit)
    .map(([id]) => id);

  if (sortedProductIds.length === 0) {
    // Fallback to featured if no sales data
    return getFeaturedProducts(supabase);
  }

  // 4. Fetch product details for the top sellers
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .in('id', sortedProductIds)
    .eq('status', 'Active');

  if (productsError) {
    console.error('[getBestSellingProducts] Error fetching product details:', productsError);
    return [];
  }

  if (!productsData || productsData.length === 0) {
    return [];
  }

  // 5. Re-sort products to match the sales order
  const productsMap = new Map(productsData.map(p => [p.id, p]));
  const orderedProducts = sortedProductIds
    .map(id => productsMap.get(id))
    .filter((p): p is SupabaseProduct => !!p);

  return enrichProductsWithDetails(supabase, orderedProducts);
};

export const getBestSellingStores = async (supabase: SupabaseClient, limit = 5): Promise<Store[]> => {
  // 1. Fetch orders to calculate popularity
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('store_id');

  if (ordersError) {
    console.error('[getBestSellingStores] Error fetching orders:', ordersError);
    return getFeaturedStores(supabase);
  }

  // 2. Aggregate sales
  const storeSales: Record<string, number> = {};
  orders?.forEach(order => {
    if (order.store_id) {
      storeSales[order.store_id] = (storeSales[order.store_id] || 0) + 1;
    }
  });

  // 3. Sort by sales count
  const sortedStoreIds = Object.entries(storeSales)
    .sort(([, a], [, b]) => b - a) // Descending order
    .slice(0, limit)
    .map(([id]) => id);

  if (sortedStoreIds.length === 0) {
    return getFeaturedStores(supabase);
  }

  // 4. Fetch store details for the top sellers
  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .in('id', sortedStoreIds)
    .eq('status', 'Active');

  if (storesError) {
    console.error('[getBestSellingStores] Error fetching store details:', storesError);
    return [];
  }

  if (!storesData || storesData.length === 0) {
    return [];
  }

  // 5. Re-sort stores to match the sales order
  const storesMap = new Map(storesData.map(s => [s.id, s]));
  const orderedStores = sortedStoreIds
    .map(id => storesMap.get(id))
    .filter((s): s is SupabaseStore => !!s);

  return orderedStores.map(store => mapSupabaseStoreToAppStore(store));
};


// Customer Data Functions
export const findCustomerByEmail = async (supabase: SupabaseClient, email: string): Promise<SupabaseCustomer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error(`[findCustomerByEmail] Error finding customer by email ${email}:`, error);
    throw new Error(`Failed to find customer by email: ${error.message}`);
  }
  return data;
};

export const createCustomer = async (supabase: SupabaseClient, customerData: CreateCustomerInput): Promise<SupabaseCustomer> => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();

  if (error) {
    console.error('[createCustomer] Error creating customer:', error);
    throw new Error(`Failed to create customer: ${error.message}`);
  }
  if (!data) {
    console.error('[createCustomer] Customer data is null after insert, though no error was thrown.');
    throw new Error('Customer creation succeeded but no data was returned.');
  }
  return data;
};

export const updateCustomer = async (supabase: SupabaseClient, customerId: string, customerData: UpdateCustomerInput): Promise<SupabaseCustomer> => {
  const { ...updatePayload } = customerData;

  const { data, error } = await supabase
    .from('customers')
    .update(updatePayload)
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    console.error(`[updateCustomer] Error updating customer ${customerId}:`, error);
    throw new Error(`Failed to update customer: ${error.message}`);
  }
  if (!data) {
    console.error(`[updateCustomer] Customer data is null after update for ID ${customerId}, though no error was thrown.`);
    throw new Error('Customer update succeeded but no data was returned.');
  }
  return data;
};


// Coupon Logic
export const verifyCoupon = async (supabase: SupabaseClient, code: string, storeId: string): Promise<Coupon | null> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('store_id', storeId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error(`[verifyCoupon] Error verifying coupon ${code} for store ${storeId}:`, error);
    }
    return null;
  }

  if (!data) return null;

  // Additional checks (dates, usage limit)
  const now = new Date();
  if (data.start_date && new Date(data.start_date) > now) return null;
  if (data.end_date && new Date(data.end_date) < now) return null;
  if (data.usage_limit && (data.used_count || 0) >= data.usage_limit) return null;

  return {
    id: data.id,
    code: data.code,
    storeId: data.store_id,
    discountType: data.discount_type as 'percentage' | 'fixed_amount',
    discountValue: data.discount_value,
    minSpend: data.min_spend || 0,
    description: data.description,
  };
};





// Order Data Functions
export const createOrder = async (supabase: SupabaseClient, orderInput: CreateOrderInput): Promise<SupabaseOrder> => {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderInput])
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

export const getOrderDetailsById = async (supabase: SupabaseClient, orderId: string): Promise<AppOrder | null> => {
  console.log(`[getOrderDetailsById] Fetching order details for ID: ${orderId}`);

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select(`*`)
    .eq('id', orderId)
    .single();

  if (orderError) {
    if (orderError.code === 'PGRST116') {
      console.warn(`[getOrderDetailsById] No order found with ID: ${orderId}`);
      return null;
    }
    console.error(`[getOrderDetailsById] Error fetching order ${orderId}:`, orderError);
    throw new Error(`Failed to fetch order ${orderId}: ${orderError.message}`);
  }

  if (!orderData) {
    console.warn(`[getOrderDetailsById] Order data is null for ID: ${orderId}, though no error was thrown.`);
    return null;
  }

  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('name, contact_phone')
    .eq('id', orderData.store_id)
    .single();

  if (storeError) {
    console.error(`[getOrderDetailsById] Error fetching store details for order ${orderId}:`, storeError);
    // We can still proceed, but store name and phone will be missing.
  }


  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error(`[getOrderDetailsById] Error fetching items for order ${orderId}:`, itemsError);
    throw new Error(`Failed to fetch items for order ${orderId}: ${itemsError.message}`);
  }

  const appOrderItems: AppOrderItem[] = itemsData ? itemsData.map((item: SupabaseOrderItem) => ({
    id: item.id,
    productId: item.product_id,
    name: item.product_name_snapshot,
    quantity: item.quantity,
    pricePerUnit: item.price_per_unit_snapshot,
    imageUrl: item.product_image_url_snapshot,
    totalPrice: item.quantity * item.price_per_unit_snapshot,
  })) : [];

  return {
    id: orderData.id,
    storeId: orderData.store_id,
    storeName: storeData?.name || 'Unknown Store',
    storeContactPhone: storeData?.contact_phone || null,
    customerName: orderData.customer_name,
    customerEmail: orderData.customer_email,
    orderDate: orderData.order_date,
    totalAmount: orderData.total_amount,
    deliveryCost: orderData.delivery_cost,
    status: orderData.status,
    shippingAddress: orderData.shipping_address,
    billingAddress: orderData.billing_address,
    shipping_method: orderData.delivery_tier, // Mapping tier to deprecated property for compatibility
    delivery_tier: orderData.delivery_tier,
    paymentMethod: orderData.payment_method,
    trackingNumber: orderData.delivery_code, // Mapping code to deprecated property for compatibility
    delivery_code: orderData.delivery_code,
    escrow_transaction_id: orderData.escrow_transaction_id, // Added
    service_fees: orderData.service_fees,
    shippingLatitude: orderData.shipping_latitude,
    shippingLongitude: orderData.shipping_longitude,
    customer_specification: orderData.customer_specification,
    createdAt: orderData.created_at,
    updatedAt: orderData.updated_at,
    items: appOrderItems,
    customerId: orderData.customer_id,
  };
};

export async function findOrdersBySearchTerm(supabase: SupabaseClient, searchTerm: string): Promise<AppOrder[]> {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  let orderIdsToFetch: string[] = [];

  if (uuidRegex.test(searchTerm)) {
    console.log(`[findOrdersBySearchTerm] Search term is a UUID: ${searchTerm}`);
    const order = await getOrderDetailsById(supabase, searchTerm);
    return order ? [order] : [];
  }

  console.log(`[findOrdersBySearchTerm] Trying to fetch by email: ${searchTerm}`);
  const { data: emailMatchOrders, error: emailError } = await supabase
    .from('orders')
    .select('id')
    .ilike('customer_email', searchTerm)
    .order('order_date', { ascending: false });

  if (emailError && emailError.code !== 'PGRST116') {
    console.error(`[findOrdersBySearchTerm] Error fetching orders by email ${searchTerm}:`, emailError);
    return [];
  }

  if (emailMatchOrders && emailMatchOrders.length > 0) {
    console.log(`[findOrdersBySearchTerm] Found ${emailMatchOrders.length} orders by email.`);
    orderIdsToFetch = emailMatchOrders.map(o => o.id);
  } else {
    console.log(`[findOrdersBySearchTerm] No email match, trying to fetch by name (most recent): ${searchTerm}`);
    const { data: nameMatchOrders, error: nameError } = await supabase
      .from('orders')
      .select('id')
      .ilike('customer_name', `%${searchTerm}%`)
      .order('order_date', { ascending: false });

    if (nameError && nameError.code !== 'PGRST116') {
      console.error(`[findOrdersBySearchTerm] Error fetching order by name ${searchTerm}:`, nameError);
      return [];
    }
    if (nameMatchOrders && nameMatchOrders.length > 0) {
      console.log(`[findOrdersBySearchTerm] Found ${nameMatchOrders.length} order(s) by name.`);
      orderIdsToFetch = nameMatchOrders.map(o => o.id);
    }
  }

  if (orderIdsToFetch.length > 0) {
    console.log(`[findOrdersBySearchTerm] Proceeding to fetch full details for Order IDs: ${orderIdsToFetch.join(', ')}`);
    const fetchedOrdersPromises = orderIdsToFetch.map(id => getOrderDetailsById(supabase, id));
    const resolvedOrders = await Promise.all(fetchedOrdersPromises);
    const validOrders = resolvedOrders.filter(order => order !== null) as AppOrder[];
    console.log(`[findOrdersBySearchTerm] Fetched details for ${validOrders.length} orders.`);
    return validOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }

  console.log(`[findOrdersBySearchTerm] No orders found matching term: ${searchTerm}`);
  return [];
}
