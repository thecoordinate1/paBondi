
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
  getStoreById, // Import getStoreById
} from '@/lib/data';
import type { CartItem, OrderFormData, CreateOrderInput, CreateOrderItemInput, CreateCustomerInput, UpdateCustomerInput, PlaceOrderResult } from '@/types';

export async function placeOrderAction(
  formData: OrderFormData,
  cartItems: CartItem[],
  // totalAmount is no longer passed as it will be calculated per store
): Promise<PlaceOrderResult> {
  const cookieStore = cookies();
  const supabase = createSupabaseClient(cookieStore);

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: 'Your cart is empty.' };
  }

  // Group items by storeId
  const itemsByStore = new Map<string, CartItem[]>();
  for (const item of cartItems) {
    if (!itemsByStore.has(item.storeId)) {
      itemsByStore.set(item.storeId, []);
    }
    itemsByStore.get(item.storeId)!.push(item);
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
      // Update name/address immediately if changed from form, other stats later
      const customerPrimeUpdate: UpdateCustomerInput = {
        name: formData.name,
        phone: formData.contactNumber,
        // Since we removed address fields, we clear them or handle them differently
        // For now, we will not update address fields here.
      };
      await updateCustomer(supabase, customerIdToLink, customerPrimeUpdate);

    } else {
      console.log(`[placeOrderAction] No existing customer found. Creating new customer for email: ${formData.email}`);
      const newCustomerData: CreateCustomerInput = {
        name: formData.name,
        email: formData.email,
        phone: formData.contactNumber,
        status: 'active',
        street_address: `Coordinates: ${formData.location}`, // Store coordinates as address
        // city, state, zip, country are removed.
        joined_date: new Date().toISOString(),
        last_order_date: new Date().toISOString(), // Initial, will be updated
        total_spent: 0, // Initial, will be updated
        total_orders: 0, // Initial, will be updated
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

  const shippingAddress = `Coordinates: ${formData.location}`;

  // 2. Process orders for each store
  for (const [storeId, storeItems] of itemsByStore.entries()) {
    let storeName = storeItems[0]?.storeName || 'Unknown Store'; // Get store name from first item or default
    const store = await getStoreById(supabase, storeId);
    if (store && store.name) storeName = store.name;


    // Stock validation for this store's items
    try {
      for (const item of storeItems) {
        const currentStock = await getProductStock(supabase, item.id);
        if (currentStock === null) {
          detailedErrors.push({ storeId, storeName, message: `Product ${item.name} not found.`});
          throw new Error(`Product ${item.name} from store ${storeName} not found, skipping order for this store.`);
        }
        item.stockCount = currentStock; // Ensure cart item has up-to-date stock count
        if (item.stockCount < item.quantity) {
          detailedErrors.push({ storeId, storeName, message: `Not enough stock for ${item.name}. Only ${item.stockCount} available.`});
          throw new Error(`Not enough stock for ${item.name} from store ${storeName}, skipping order for this store.`);
        }
      }
    } catch (stockValidationError) {
      console.warn(`[placeOrderAction] Stock validation failed for store ${storeName} (${storeId}):`, stockValidationError instanceof Error ? stockValidationError.message : stockValidationError);
      // Detailed error already pushed if specific, or a general one if loop broken early
      if (!detailedErrors.find(de => de.storeId === storeId)) {
         detailedErrors.push({ storeId, storeName, message: stockValidationError instanceof Error ? stockValidationError.message : 'Stock validation failed.' });
      }
      continue; // Skip to the next store
    }
    
    const currentStoreOrderTotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderInput: CreateOrderInput = {
      store_id: storeId,
      customer_id: customerIdToLink,
      customer_name: formData.name,
      customer_email: formData.email,
      order_date: new Date().toISOString(),
      total_amount: currentStoreOrderTotal,
      status: 'Pending',
      shipping_address: shippingAddress,
      billing_address: `Mobile Money: ${formData.mobileMoneyNumber}`, // Using billing address for payment info
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
        // item.stockCount should be populated from the earlier check
        const newStockCount = (item.stockCount as number) - item.quantity;
        await updateProductStock(supabase, item.id, newStockCount);
      }
      
      placedOrderIds.push(orderId);
      successfullyProcessedTotalAmountAllStores += currentStoreOrderTotal;
      console.log(`[placeOrderAction] Order ${orderId} for store ${storeName} created successfully. Simulating delivery dispatch.`);
      console.log(`[placeOrderAction] SIMULATION: Delivery dispatch for order ${orderId} (Store: ${storeName}) would be initiated here.`);
      console.log(`[placeOrderAction] SIMULATION: Delivery address: ${shippingAddress}, Lat: ${orderInput.shipping_latitude}, Lng: ${orderInput.shipping_longitude}`);

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
        phone: formData.contactNumber, // ensure phone is updated
        // Name and address were updated earlier if existing, or set on creation
      };
      console.log(`[placeOrderAction] Updating customer ${customerIdToLink} stats:`, customerUpdateStats);
      await updateCustomer(supabase, customerIdToLink, customerUpdateStats);
      console.log(`[placeOrderAction] Customer ${customerIdToLink} stats updated.`);
    } catch (customerUpdateError) {
        console.error(`[placeOrderAction] CRITICAL: Orders placed (${placedOrderIds.join(', ')}) but failed to update customer ${customerIdToLink} stats:`, customerUpdateError);
        // Add to detailed errors, but orders are already placed.
        detailedErrors.push({ message: `Orders were placed, but there was an issue updating your customer profile statistics. Please contact support. Error: ${customerUpdateError instanceof Error ? customerUpdateError.message : "Unknown error"}`});
    }
  }
  
  // 4. Determine overall result
  if (placedOrderIds.length === 0) {
    // If there are detailed errors, use those, otherwise provide a generic message.
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
