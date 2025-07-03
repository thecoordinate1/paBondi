
'use server';

import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { 
  createOrder, 
  createOrderItems, 
  getProductStock, 
  updateProductStock,
  findCustomerByEmail,
  createCustomer,
  updateCustomer,
  getStoreById,
} from '@/lib/data';
import type { CartItem, OrderFormData, CreateOrderInput, CreateOrderItemInput, CreateCustomerInput, UpdateCustomerInput, PlaceOrderResult, DeliveryCostResult, GeocodeResult, Store } from '@/types';
import { calculateDeliveryCost } from '@/lib/delivery';

// Helper function to get driving distance from ORS
async function getStreetDistance(
  userCoords: { latitude: number; longitude: number },
  storeCoords: { latitude: number; longitude: number }
): Promise<number | null> {
  const apiKey = process.env.OPEN_ROUTE_SERVICE_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ORS_API_KEY_HERE') {
    console.error('[getStreetDistance] OpenRouteService API key is not set or is a placeholder.');
    return null;
  }

  // ORS API expects longitude,latitude format
  const start = `${storeCoords.longitude},${storeCoords.latitude}`;
  const end = `${userCoords.longitude},${userCoords.latitude}`;
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${start}&end=${end}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getStreetDistance] ORS Directions API error: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json();
    // The distance is in the summary of the first route, in meters.
    const distanceInMeters = data.features?.[0]?.properties?.summary?.distance;

    if (typeof distanceInMeters === 'number') {
      return distanceInMeters / 1000; // Convert to KM
    } else {
      console.warn('[getStreetDistance] Could not extract distance from ORS response:', JSON.stringify(data));
      return null;
    }
  } catch (error) {
    console.error('[getStreetDistance] Fetch error:', error);
    return null;
  }
}


export async function reverseGeocodeAction(latitude: number, longitude: number): Promise<GeocodeResult> {
  const apiKey = process.env.OPEN_ROUTE_SERVICE_API_KEY;
  if (!apiKey || apiKey === 'YOUR_ORS_API_KEY_HERE') {
    console.error('[reverseGeocodeAction] OpenRouteService API key is not set or is a placeholder.');
    // Don't expose server config errors to client
    return { success: false, error: 'Could not perform address lookup.' };
  }

  const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${apiKey}&point.lon=${longitude}&point.lat=${latitude}&size=1&layers=address`;

  try {
    const response = await fetch(url, { headers: { 'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8' }});
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[reverseGeocodeAction] ORS API error response:', errorText);
      return { success: false, error: 'Failed to fetch address from coordinates.' };
    }

    const data = await response.json();
    const feature = data.features?.[0];
    if (feature && feature.properties) {
      // ORS 'label' field is often a good pre-formatted address.
      if (feature.properties.label) {
        return { success: true, address: feature.properties.label };
      }

      // Fallback to building it manually
      const { name, street, housenumber, locality, county, region } = feature.properties;
      const addressParts = [housenumber, street, name, locality, county, region].filter(Boolean);
      const address = addressParts.join(', ');
      
      return { success: true, address: address || 'Address details not found.' };
    } else {
      return { success: false, error: 'No address found for these coordinates.' };
    }
  } catch (error) {
    console.error('[reverseGeocodeAction] Fetch error:', error);
    return { success: false, error: 'Could not connect to geocoding service.' };
  }
}

export async function calculateDeliveryCostAction(
  userLocation: string, 
  cartItems: CartItem[]
): Promise<DeliveryCostResult> {
  if (!userLocation) {
    return { success: false, error: 'User location is required.' };
  }
  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: 'Cart is empty.' };
  }

  let userCoords;
  try {
    const coords = userLocation.split(',').map(s => s.trim());
    if (coords.length !== 2) throw new Error("Invalid coordinate format.");
    const latitude = parseFloat(coords[0]);
    const longitude = parseFloat(coords[1]);
    if (isNaN(latitude) || isNaN(longitude)) throw new Error("Coordinates are not valid numbers.");
    userCoords = { latitude, longitude };
  } catch (e) {
      return { success: false, error: 'Invalid user location coordinates format.' };
  }
  
  const cookieStore = cookies();
  const supabase = createSupabaseClient(cookieStore);

  // Filter for valid store IDs to prevent errors from items without a store
  const uniqueStoreIds = [...new Set(cartItems.map(item => item.storeId).filter((id): id is string => !!id))];
  
  if (uniqueStoreIds.length === 0) {
    return { success: false, error: 'No items in cart are associated with a store.' };
  }

  let totalDeliveryCost = 0;
  const costsByStore: Record<string, number> = {};

  try {
    const storePromises = uniqueStoreIds.map(id => getStoreById(supabase, id));
    const stores = await Promise.all(storePromises);

    for (const store of stores) {
      if (!store) {
        console.warn(`[calculateDeliveryCostAction] Could not find a store for one of the items.`);
        continue; // Or handle as an error
      }
      if (store.latitude && store.longitude) {
        const distanceInKm = await getStreetDistance(userCoords, { latitude: store.latitude, longitude: store.longitude });
        
        if (distanceInKm !== null) {
          const cost = calculateDeliveryCost(distanceInKm);
          costsByStore[store.id] = cost;
          totalDeliveryCost += cost;
        } else {
           console.warn(`[calculateDeliveryCostAction] Could not calculate street distance for store ${store.id}.`);
           return { success: false, error: `Could not calculate delivery route for store: ${store.name}. Please check addresses.` };
        }
      } else {
        console.warn(`[calculateDeliveryCostAction] Store ${store.name} (${store.id}) is missing coordinates. Cannot calculate cost.`);
        return { success: false, error: `Store "${store.name}" is missing location data. Cannot calculate delivery.` };
      }
    }
  } catch(error) {
    console.error(`[calculateDeliveryCostAction] Error fetching stores or calculating costs:`, error);
    return { success: false, error: 'An error occurred while calculating delivery costs.' };
  }

  return { success: true, totalDeliveryCost, costsByStore };
}


export async function placeOrderAction(
  formData: OrderFormData,
  cartItems: CartItem[],
): Promise<PlaceOrderResult> {
  const cookieStore = cookies();
  const supabase = createSupabaseClient(cookieStore);

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: 'Your cart is empty.' };
  }

  // Group items by storeId, handling items that might not have one.
  const itemsByStore = new Map<string, CartItem[]>();
  const itemsWithoutStore: CartItem[] = [];
  for (const item of cartItems) {
    if (item.storeId) {
      if (!itemsByStore.has(item.storeId)) {
        itemsByStore.set(item.storeId, []);
      }
      itemsByStore.get(item.storeId)!.push(item);
    } else {
      itemsWithoutStore.push(item);
    }
  }

  // Parse location coordinates from form data
  let latitude: number;
  let longitude: number;

  try {
    const coords = formData.location.split(',').map(s => s.trim());
    if (coords.length !== 2) throw new Error("Invalid coordinate format.");
    latitude = parseFloat(coords[0]);
    longitude = parseFloat(coords[1]);
    if (isNaN(latitude) || isNaN(longitude)) throw new Error("Coordinates are not valid numbers.");
  } catch (e) {
      console.error("[placeOrderAction] Error parsing coordinates:", e);
      return { success: false, error: 'Invalid location coordinates provided. Please use the format "latitude, longitude".' };
  }

  let shippingAddress = `Coordinates: ${formData.location}`; // Default fallback
  const geocodeResult = await reverseGeocodeAction(latitude, longitude);
  if (geocodeResult.success && geocodeResult.address) {
    shippingAddress = geocodeResult.address;
    console.log(`[placeOrderAction] Successfully reverse geocoded coordinates to: ${shippingAddress}`);
  } else {
    console.warn(`[placeOrderAction] Reverse geocoding failed, falling back to coordinates. Reason: ${geocodeResult.error}`);
  }

  let customerIdToLink: string | null = null;
  let existingCustomerTotalOrders = 0;
  let existingCustomerTotalSpent = 0.0;

  // 1. Handle Customer Record
  try {
    console.log(`[placeOrderAction] Looking for existing customer with email: ${formData.email}`);
    let existingCustomer = await findCustomerByEmail(supabase, formData.email);

    if (existingCustomer) {
      console.log(`[placeOrderAction] Existing customer found: ${existingCustomer.id}. Will update after order processing.`);
      customerIdToLink = existingCustomer.id;
      existingCustomerTotalOrders = existingCustomer.total_orders || 0;
      existingCustomerTotalSpent = existingCustomer.total_spent || 0;
      const customerPrimeUpdate: UpdateCustomerInput = {
        name: formData.name,
        phone: formData.contactNumber,
      };
      await updateCustomer(supabase, customerIdToLink, customerPrimeUpdate);

    } else {
      console.log(`[placeOrderAction] No existing customer found. Creating new customer for email: ${formData.email}`);
      const newCustomerData: CreateCustomerInput = {
        name: formData.name,
        email: formData.email,
        phone: formData.contactNumber,
        status: 'active',
        street_address: shippingAddress,
        joined_date: new Date().toISOString(),
        last_order_date: new Date().toISOString(),
        total_spent: 0,
        total_orders: 0,
      };
      const newCustomer = await createCustomer(supabase, newCustomerData);
      customerIdToLink = newCustomer.id;
      console.log(`[placeOrderAction] New customer created with ID: ${customerIdToLink}`);
    }
  } catch (customerError) {
    console.error('[placeOrderAction] Error managing customer record:', customerError);
    return { success: false, error: customerError instanceof Error ? customerError.message : 'An error occurred while managing customer data.' };
  }

  const placedOrderIds: string[] = [];
  const detailedErrors: { storeId?: string; storeName?: string; message: string }[] = [];
  let successfullyProcessedTotalAmountAllStores = 0;
  
  if (itemsWithoutStore.length > 0) {
    detailedErrors.push({ message: `${itemsWithoutStore.length} item(s) could not be processed as they are not linked to a valid store.` });
  }

  // 2. Process orders for each store
  for (const [storeId, storeItems] of itemsByStore.entries()) {
    const store = await getStoreById(supabase, storeId);
    let storeName = store?.name || 'Unknown Store';

    // Stock validation for this store's items
    try {
      for (const item of storeItems) {
        const currentStock = await getProductStock(supabase, item.id);
        if (currentStock === null) {
          detailedErrors.push({ storeId, storeName, message: `Product ${item.name} not found.`});
          throw new Error(`Product ${item.name} from store ${storeName} not found, skipping order for this store.`);
        }
        item.stockCount = currentStock; 
        if (item.stockCount < item.quantity) {
          detailedErrors.push({ storeId, storeName, message: `Not enough stock for ${item.name}. Only ${item.stockCount} available.`});
          throw new Error(`Not enough stock for ${item.name} from store ${storeName}, skipping order for this store.`);
        }
      }
    } catch (stockValidationError) {
      console.warn(`[placeOrderAction] Stock validation failed for store ${storeName} (${storeId}):`, stockValidationError instanceof Error ? stockValidationError.message : stockValidationError);
      if (!detailedErrors.find(de => de.storeId === storeId)) {
         detailedErrors.push({ storeId, storeName, message: stockValidationError instanceof Error ? stockValidationError.message : 'Stock validation failed.' });
      }
      continue;
    }
    
    // Recalculate delivery cost on server for security
    let deliveryCost = 0;
    if (store && store.latitude && store.longitude) {
      const distanceInKm = await getStreetDistance({ latitude, longitude }, { latitude: store.latitude, longitude: store.longitude });
      if (distanceInKm === null) {
        console.error(`[placeOrderAction] CRITICAL: Failed to calculate delivery cost from ORS for store ${storeName} (${storeId}). Skipping order for this store.`);
        detailedErrors.push({ storeId, storeName, message: 'Could not calculate delivery cost. Please try again later.'});
        continue;
      }
      deliveryCost = calculateDeliveryCost(distanceInKm);
    } else {
      console.warn(`[placeOrderAction] Store ${storeName} (${storeId}) is missing coordinates. Delivery cost cannot be calculated. Skipping store.`);
      detailedErrors.push({ storeId, storeName, message: `Store "${storeName}" is missing location data, cannot process order.` });
      continue;
    }

    const subtotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalTotalAmount = subtotal + deliveryCost;

    const orderInput: CreateOrderInput = {
      store_id: storeId,
      customer_id: customerIdToLink,
      customer_name: formData.name,
      customer_email: formData.email,
      order_date: new Date().toISOString(),
      total_amount: finalTotalAmount,
      shipping_cost: deliveryCost,
      status: 'Pending',
      shipping_address: shippingAddress,
      billing_address: `Mobile Money: ${formData.mobileMoneyNumber}`,
      shipping_latitude: latitude,
      shipping_longitude: longitude,
      payment_method: 'Mobile Money',
    };

    try {
      console.log(`[placeOrderAction] Creating order for store ${storeName} (${storeId})`);
      const createdOrder = await createOrder(supabase, orderInput);
      if (!createdOrder || !createdOrder.id) {
        throw new Error(`Order creation failed for store ${storeName} or did not return an ID.`);
      }
      const orderId = createdOrder.id;

      const orderItemsInput: CreateOrderItemInput[] = storeItems.map(item => ({
        order_id: orderId,
        product_id: item.id,
        product_name_snapshot: item.name,
        quantity: item.quantity,
        price_per_unit_snapshot: item.price,
        product_image_url_snapshot: item.imageUrls[0] || null,
      }));
      await createOrderItems(supabase, orderItemsInput);

      for (const item of storeItems) {
        const newStockCount = (item.stockCount as number) - item.quantity;
        await updateProductStock(supabase, item.id, newStockCount);
      }
      
      placedOrderIds.push(orderId);
      successfullyProcessedTotalAmountAllStores += finalTotalAmount;
      console.log(`[placeOrderAction] Order ${orderId} for store ${storeName} created successfully. Simulating delivery dispatch.`);

    } catch (storeOrderError) {
      console.error(`[placeOrderAction] Error processing order for store ${storeName} (${storeId}):`, storeOrderError);
      detailedErrors.push({ storeId, storeName, message: storeOrderError instanceof Error ? storeOrderError.message : `An unexpected error occurred for store ${storeName}.`});
    }
  }

  // 3. Update customer's aggregate data if any orders were successful
  if (customerIdToLink && placedOrderIds.length > 0) {
    try {
      const customerUpdateStats: UpdateCustomerInput = {
        last_order_date: new Date().toISOString(),
        total_orders: existingCustomerTotalOrders + placedOrderIds.length,
        total_spent: existingCustomerTotalSpent + successfullyProcessedTotalAmountAllStores,
        phone: formData.contactNumber,
      };
      console.log(`[placeOrderAction] Updating customer ${customerIdToLink} stats:`, customerUpdateStats);
      await updateCustomer(supabase, customerIdToLink, customerUpdateStats);
      console.log(`[placeOrderAction] Customer ${customerIdToLink} stats updated.`);
    } catch (customerUpdateError) {
        console.error(`[placeOrderAction] CRITICAL: Orders placed (${placedOrderIds.join(', ')}) but failed to update customer ${customerIdToLink} stats:`, customerUpdateError);
        detailedErrors.push({ message: `Orders were placed, but there was an issue updating your customer profile statistics. Please contact support. Error: ${customerUpdateError instanceof Error ? customerUpdateError.message : "Unknown error"}`});
    }
  }
  
  // 4. Determine overall result
  if (placedOrderIds.length === 0) {
    const finalError = detailedErrors.length > 0 ? 'Could not place any orders. See details below.' : (placedOrderIds.length === 0 ? 'No orders were processed. Your cart has not been charged.' : 'An unknown error occurred.');
    return { 
      success: false, 
      error: finalError, 
      detailedErrors: detailedErrors.length > 0 ? detailedErrors : [{message: 'No orders were processed.'}] 
    };
  }

  return { 
    success: true, 
    orderIds: placedOrderIds, 
    message: `Successfully placed ${placedOrderIds.length} order(s).`,
    detailedErrors: detailedErrors.length > 0 ? detailedErrors : undefined
  };
}
