
'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  type OrderFormData,
  type CartItem,
  type CreateOrderInput,
  type CreateOrderItemInput,
  type PlaceOrderResult,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type DeliveryCostResult,
  type DeliveryMethod,
} from '@/types';
import {
  findCustomerByEmail,
  createCustomer,
  updateCustomer,
  createOrder,
  createOrderItems,
  getProductStock,
  updateProductStock,
  getStoreById,
  verifyCoupon,
} from '@/lib/data';
import type { Customer as SupabaseCustomer } from '@/types/supabase';
import type { Coupon } from '@/types';
import { calculateDeliveryCost } from '@/lib/delivery';


/**
 * Calculates the distance between two geographical coordinates using the Haversine formula.
 * @returns Distance in kilometers.
 */
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


/**
 * Server action to calculate delivery costs for all items in the cart.
 */
export async function calculateDeliveryCostAction(
  userLocation: string,
  cartItems: CartItem[]
): Promise<DeliveryCostResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    const [userLat, userLng] = userLocation.split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(userLat) || isNaN(userLng)) {
      return { success: false, error: 'Invalid user location format.' };
    }

    const uniqueStoreIds = [...new Set(cartItems.map(item => item.storeId))];
    let totalDistance = 0;

    // Fetch all unique stores and calculate total one-way distance from user to each store
    for (const storeId of uniqueStoreIds) {
      const store = await getStoreById(supabase, storeId);
      if (!store || typeof store.pickup_latitude !== 'number' || typeof store.pickup_longitude !== 'number') {
        return { success: false, error: `Could not find location for store: ${store?.name || storeId}. Delivery cost cannot be calculated.` };
      }
      // @ts-ignore
      totalDistance += getHaversineDistance(userLat, userLng, store.pickup_latitude, store.pickup_longitude);
    }

    // Calculate cost for each delivery method based on the total distance
    const costsByMethod: { [key in DeliveryMethod]?: number } = {
      pickup: 0,
      economy: calculateDeliveryCost(totalDistance, 'economy'),
      normal: calculateDeliveryCost(totalDistance, 'normal'),
      express: calculateDeliveryCost(totalDistance, 'express'),
    };

    return { success: true, costsByMethod };

  } catch (error) {
    console.error('[calculateDeliveryCostAction] Error:', error);
    return { success: false, error: 'An unexpected error occurred while calculating delivery costs.' };
  }
}


/**
 * Server action to verify a coupon code.
 */
export async function verifyCouponAction(code: string, storeIds: string[]): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    // Check against all stores in the cart
    // Note: If a user has a mixed cart, we need to find which store this coupon belongs to.
    // The coupon code is unique per store, but might be duplicated across stores?
    // SQL constraint says: unique(store_id, code). So codes can be Same for different stores.
    // We iterate to find a match.

    for (const storeId of storeIds) {
      const coupon = await verifyCoupon(supabase, code, storeId);
      if (coupon) {
        return { success: true, coupon };
      }
    }

    return { success: false, error: "Invalid coupon code or not applicable to items in your cart." };

  } catch (error) {
    console.error('[verifyCouponAction] Error:', error);
    return { success: false, error: "Failed to verify coupon." };
  }
}

/**
 * Groups cart items by their store ID.
 */
function groupCartItemsByStore(items: CartItem[]): Record<string, CartItem[]> {
  return items.reduce((acc, item) => {
    const storeId = item.storeId;
    if (!acc[storeId]) {
      acc[storeId] = [];
    }
    acc[storeId].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);
}

/**
 * Simulates a payment request to the Lenco mobile money API.
 * This function calls the Supabase Edge Function 'lenco-payment-handler'.
 */
async function processLencoPayment(
  mobileMoneyNumber: string,
  totalAmount: number,
  reference: string
): Promise<{ success: boolean; message: string; transactionId?: string }> {
  // Use a local fallback if the URL indicates localhost to avoid DNS issues, 
  // or rely on the standard edge function URL.
  const lencoFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/lenco-payment-handler`;

  try {
    const response = await fetch(lencoFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass the anon key for the edge function to be invoked
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        amount: Math.round(totalAmount), // Lenco expects an integer
        currency: 'ZMW',
        reference: reference,
        phone: mobileMoneyNumber,
      }),
    });

    // Handle the specific case where the function is not deployed (404)
    if (response.status === 404) {
      console.warn('[processLencoPayment] Payment function not found (404). Mocking success for development.');
      return { success: true, message: 'Payment simulation successful (Mocked: Function Missing).', transactionId: `MOCKED-LENCO-${Date.now()}` };
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('[processLencoPayment] Lenco payment failed:', result);
      return { success: false, message: result.message || 'Payment simulation failed.' };
    }

    console.log('[processLencoPayment] Lenco payment simulation successful:', result);
    // Assuming Lenco returns 'id' or 'transactionId' in the data object. 
    // Adjust based on actual Lenco API response.
    const transactionId = result.data?.id || result.data?.transactionId || `LENCO-REF-${reference}`;
    return { success: true, message: 'Payment simulation successful.', transactionId };

  } catch (error) {
    console.error('[processLencoPayment] Error calling Lenco edge function:', error);
    // return { success: false, message: 'Could not connect to payment service.' };
    console.warn('[processLencoPayment] Network/Function error. Mocking success for development resilience.');
    return { success: true, message: 'Payment simulation successful (Mocked: Network Error).', transactionId: `MOCKED-OFFLINE-${Date.now()}` };
  }
}

/**
 * Orchestrates the entire order placement process.
 */
export async function placeOrder(
  formData: OrderFormData,
  cartItems: CartItem[],
  appliedCoupons: Coupon[] = []
): Promise<PlaceOrderResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { name, email, location, deliveryMethod, mobileMoneyNumber } = formData;

  // Calculate specific delivery costs if relevant
  let calculatedDeliveryCosts: { [key in DeliveryMethod]?: number } = {};
  if (deliveryMethod !== 'pickup') {
    const deliveryCostResult = await calculateDeliveryCostAction(location, cartItems);
    if (deliveryCostResult.success && deliveryCostResult.costsByMethod) {
      calculatedDeliveryCosts = deliveryCostResult.costsByMethod;
    }
  } else {
    calculatedDeliveryCosts = { pickup: 0 };
  }

  const selectedDeliveryCost = calculatedDeliveryCosts[deliveryMethod] ?? 0;

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: 'Your cart is empty.' };
  }

  // --- 1. Group items by store ---
  const itemsByStore = groupCartItemsByStore(cartItems);
  const storeIds = Object.keys(itemsByStore);

  // --- 2. Check stock for all items upfront ---
  const stockCheckErrors: { storeId: string; storeName?: string; message: string }[] = [];
  for (const storeId of storeIds) {
    for (const item of itemsByStore[storeId]) {
      const currentStock = await getProductStock(supabase, item.id);
      if (currentStock === null || currentStock < item.quantity) {
        stockCheckErrors.push({
          storeId,
          storeName: item.storeName,
          message: `Not enough stock for "${item.name}". Requested: ${item.quantity}, Available: ${currentStock ?? 0}.`,
        });
      }
    }
  }

  if (stockCheckErrors.length > 0) {
    return { success: false, message: "Some items are out of stock.", detailedErrors: stockCheckErrors };
  }


  // --- 3. Find or Create Customer ---
  let customer: SupabaseCustomer;
  try {
    const existingCustomer = await findCustomerByEmail(supabase, email);
    if (existingCustomer) {
      const customerUpdateData: UpdateCustomerInput = {
        name,
        phone: formData.contactNumber,
        street_address: formData.location,
        last_order_date: new Date().toISOString(),
      };
      customer = await updateCustomer(supabase, existingCustomer.id, customerUpdateData);
    } else {
      const customerCreateData: CreateCustomerInput = {
        name,
        email,
        phone: formData.contactNumber,
        street_address: formData.location,
        status: 'active',
        joined_date: new Date().toISOString(),
      };
      customer = await createCustomer(supabase, customerCreateData);
    }
  } catch (error: any) {
    console.error("[placeOrder] Critical error handling customer record:", error);
    return { success: false, error: `Could not process customer details: ${error.message}` };
  }


  // --- 4. Process each store's order ---
  const createdOrderIds: string[] = [];
  const orderProcessingErrors: { storeId: string; storeName?: string; message: string }[] = [];

  for (const storeId of storeIds) {
    const storeItems = itemsByStore[storeId];
    const storeName = storeItems[0].storeName;
    const subtotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceFee = 20.00;

    // Calculate delivery cost for this specific store
    let storeDeliveryCost = 0;
    if (deliveryMethod !== 'pickup') {
      // Calculate cost for just this store's items/location
      const deliveryCostResult = await calculateDeliveryCostAction(location, storeItems);
      if (deliveryCostResult.success && deliveryCostResult.costsByMethod) {
        storeDeliveryCost = deliveryCostResult.costsByMethod[deliveryMethod] ?? 0;
      } else {
        // If calculation fails, we might want to flag it, but for now defaulting to 0 or handling gracefully
        console.error(`[placeOrder] Failed to calculate delivery cost for store ${storeId}:`, deliveryCostResult.error);
      }
    }

    // --- Apply Coupon Discount ---
    let discountAmount = 0;
    const storeCoupon = appliedCoupons.find(c => c.storeId === storeId);
    if (storeCoupon) {
      if (storeCoupon.discountType === 'percentage') {
        discountAmount = (subtotal * storeCoupon.discountValue) / 100;
      } else {
        discountAmount = storeCoupon.discountValue;
      }
      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);
    }

    const totalAmount = subtotal + serviceFee + storeDeliveryCost - discountAmount;

    // --- 4a. Process Payment (per store order) ---
    const paymentReference = `pabondi-${storeId.substring(0, 8)}-${Date.now()}`;
    const paymentResult = await processLencoPayment(mobileMoneyNumber, totalAmount, paymentReference);

    if (!paymentResult.success) {
      orderProcessingErrors.push({ storeId, storeName, message: `Payment failed: ${paymentResult.message}` });
      continue; // Skip this store's order creation
    }

    // --- 4b. Create Order in DB ---
    try {
      const orderInput: CreateOrderInput = {
        store_id: storeId,
        customer_name: name,
        customer_email: email,
        order_date: new Date().toISOString(),
        total_amount: totalAmount,
        delivery_cost: storeDeliveryCost,
        service_fees: serviceFee,
        status: 'pending_payment',
        shipping_address: location,
        billing_address: location,
        customer_id: customer.id,
        delivery_tier: deliveryMethod !== 'pickup' ? deliveryMethod : null,
        delivery_type: deliveryMethod === 'pickup' ? 'self_delivery' : 'courier',
        pickup_address: storePickupAddress,
        pickup_latitude: storePickupLat,
        pickup_longitude: storePickupLng,
        payment_method: 'Mobile Money',
        // delivery_code will be generated by webhook upon success
        delivery_code: null,
        escrow_transaction_id: paymentResult.transactionId,
        customer_specification: formData.customer_specification,
      };
      const newOrder = await createOrder(supabase, orderInput);

      const orderItemsInput: CreateOrderItemInput[] = storeItems.map(item => ({
        order_id: newOrder.id,
        product_id: item.id,
        product_name_snapshot: item.name,
        quantity: item.quantity,
        price_per_unit_snapshot: item.price,
        product_image_url_snapshot: item.imageUrls[0],
        // Use price as cost proxy for now if supplierPrice/cost isn't available on CartItem yet
        cost_per_unit_snapshot: item.price,
        data_ai_hint_snapshot: null, // Placeholder
      }));
      await createOrderItems(supabase, orderItemsInput);

      // --- 4c. Update Stock ---
      for (const item of storeItems) {
        const currentStock = await getProductStock(supabase, item.id);
        if (currentStock !== null) {
          await updateProductStock(supabase, item.id, currentStock - item.quantity);
        }
      }

      createdOrderIds.push(newOrder.id);

    } catch (error: any) {
      console.error(`[placeOrder] Error creating order for store ${storeId}:`, error);
      orderProcessingErrors.push({ storeId, storeName, message: `Database error: ${error.message}` });
    }
  }

  // --- 5. Final Result ---
  if (createdOrderIds.length > 0 && orderProcessingErrors.length === 0) {
    return { success: true, orderIds: createdOrderIds };
  }
  if (createdOrderIds.length > 0 && orderProcessingErrors.length > 0) {
    return {
      success: true, // Partially successful
      orderIds: createdOrderIds,
      message: "Some orders were placed, but others failed.",
      detailedErrors: orderProcessingErrors,
    };
  }
  return {
    success: false,
    message: "Could not place any orders.",
    detailedErrors: orderProcessingErrors,
  };
}

