
'use server';

import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { createOrder, createOrderItems, getProductStock, updateProductStock } from '@/lib/data';
import type { CartItem, OrderFormData, CreateOrderInput, CreateOrderItemInput } from '@/types';
import { redirect }  from 'next/navigation';

interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  message?: string;
  error?: string; // More specific error message for client
}

export async function placeOrderAction(
  formData: OrderFormData,
  cartItems: CartItem[],
  totalAmount: number
): Promise<PlaceOrderResult> {
  const cookieStore = cookies();
  const supabase = createSupabaseClient(cookieStore);

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: 'Your cart is empty.' };
  }

  // Validate stock for all items BEFORE attempting to create order
  try {
    for (const item of cartItems) {
      if (item.stockCount === undefined) { // Should always have stockCount from Product type now
        const currentStock = await getProductStock(supabase, item.id);
        if (currentStock === null) {
          return { success: false, error: `Product ${item.name} not found.` };
        }
        item.stockCount = currentStock; 
      }
      if (item.stockCount < item.quantity) {
        return { success: false, error: `Not enough stock for ${item.name}. Only ${item.stockCount} available.` };
      }
    }
  } catch (stockError) {
    console.error('Stock validation error:', stockError);
    return { success: false, error: 'Could not verify product stock. Please try again.' };
  }

  const shippingAddress = `${formData.streetAddress}, ${formData.city}, ${formData.stateProvince} ${formData.zipPostalCode}, ${formData.country}`;
  
  const shippingLatitude = formData.latitude ? parseFloat(formData.latitude) : null;
  const shippingLongitude = formData.longitude ? parseFloat(formData.longitude) : null;

  const orderInput: CreateOrderInput = {
    store_id: cartItems[0].storeId, 
    customer_name: formData.name,
    customer_email: formData.email,
    order_date: new Date().toISOString(),
    total_amount: totalAmount,
    status: 'Pending', 
    shipping_address: shippingAddress,
    billing_address: shippingAddress, 
    shipping_latitude: Number.isNaN(shippingLatitude) ? null : shippingLatitude,
    shipping_longitude: Number.isNaN(shippingLongitude) ? null : shippingLongitude,
  };

  try {
    // 1. Create the order
    const createdOrder = await createOrder(supabase, orderInput);
    if (!createdOrder || !createdOrder.id) {
      throw new Error('Order creation failed or did not return an ID.');
    }
    const orderId = createdOrder.id;

    // 2. Create order items
    const orderItemsInput: CreateOrderItemInput[] = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.id,
      product_name_snapshot: item.name,
      quantity: item.quantity,
      price_per_unit_snapshot: item.price,
      product_image_url_snapshot: item.imageUrls[0] || null,
    }));
    await createOrderItems(supabase, orderItemsInput);

    // 3. Update product stock
    for (const item of cartItems) {
      const newStockCount = (item.stockCount as number) - item.quantity; // stockCount validated above
      await updateProductStock(supabase, item.id, newStockCount);
    }
    
    // 4. Simulate delivery dispatch (log for now)
    console.log(`[placeOrderAction] SIMULATION: Delivery dispatch for order ${orderId} would be initiated here.`);
    console.log(`[placeOrderAction] SIMULATION: Delivery address: ${shippingAddress}, Lat: ${orderInput.shipping_latitude}, Lng: ${orderInput.shipping_longitude}`);

    // If all steps are successful
    return { success: true, orderId: orderId, message: 'Order placed successfully!' };

  } catch (error)
    console.error('Error placing order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred while placing your order.' };
  }
}
