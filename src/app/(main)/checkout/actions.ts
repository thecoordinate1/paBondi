
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
        // Fetch if undefined, though ideally it's always present from initial product load
        const currentStock = await getProductStock(supabase, item.id);
        if (currentStock === null) {
          return { success: false, error: `Product ${item.name} not found.` };
        }
        item.stockCount = currentStock; // Update item with fetched stock
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
  const orderInput: CreateOrderInput = {
    store_id: cartItems[0].storeId, // Simplification: use first item's store_id
    customer_name: formData.name,
    customer_email: formData.email,
    order_date: new Date().toISOString(),
    total_amount: totalAmount,
    status: 'Pending', // Initial status
    shipping_address: shippingAddress,
    billing_address: shippingAddress, // Assuming billing is same as shipping for now
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
    // This should ideally be in a transaction, but Supabase JS client doesn't directly support transactions in edge functions/server actions easily.
    // We'll do it sequentially. If any stock update fails, we're in a partial state.
    // A more robust solution would involve a database function/trigger or a queue system.
    for (const item of cartItems) {
      const newStockCount = (item.stockCount as number) - item.quantity; // stockCount validated above
      await updateProductStock(supabase, item.id, newStockCount);
    }
    
    // If all steps are successful
    return { success: true, orderId: orderId, message: 'Order placed successfully!' };

  } catch (error) {
    console.error('Error placing order:', error);
    // TODO: Implement more sophisticated error handling / rollback if possible
    // For example, if order items fail after order is created, or stock update fails.
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred while placing your order.' };
  }
}
