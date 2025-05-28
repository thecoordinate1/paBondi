
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
  updateCustomer
} from '@/lib/data';
import type { CartItem, OrderFormData, CreateOrderInput, CreateOrderItemInput, CreateCustomerInput, UpdateCustomerInput } from '@/types';
import type { Customer as SupabaseCustomer } from '@/types/supabase'; // For Supabase customer type

interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  message?: string;
  error?: string; 
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

  try {
    for (const item of cartItems) {
      if (item.stockCount === undefined) { 
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

  let customerIdToLink: string | null = null;

  try {
    console.log(`[placeOrderAction] Looking for existing customer with email: ${formData.email}`);
    let existingCustomer = await findCustomerByEmail(supabase, formData.email);

    if (existingCustomer) {
      console.log(`[placeOrderAction] Existing customer found: ${existingCustomer.id}. Updating...`);
      const customerUpdateData: UpdateCustomerInput = {
        last_order_date: new Date().toISOString(),
        total_orders: (existingCustomer.total_orders || 0) + 1,
        total_spent: (existingCustomer.total_spent || 0) + totalAmount,
        name: formData.name, // Update name if changed
        street_address: formData.streetAddress,
        city: formData.city,
        state_province: formData.stateProvince,
        zip_postal_code: formData.zipPostalCode,
        country: formData.country,
        // email will not be updated here, assuming it's a primary identifier
      };
      const updatedCustomer = await updateCustomer(supabase, existingCustomer.id, customerUpdateData);
      customerIdToLink = updatedCustomer.id;
      console.log(`[placeOrderAction] Customer ${customerIdToLink} updated.`);
    } else {
      console.log(`[placeOrderAction] No existing customer found. Creating new customer for email: ${formData.email}`);
      const newCustomerData: CreateCustomerInput = {
        name: formData.name,
        email: formData.email,
        status: 'active', // Default status for new customers
        street_address: formData.streetAddress,
        city: formData.city,
        state_province: formData.stateProvince,
        zip_postal_code: formData.zipPostalCode,
        country: formData.country,
        joined_date: new Date().toISOString(),
        last_order_date: new Date().toISOString(),
        total_spent: totalAmount,
        total_orders: 1,
      };
      const newCustomer = await createCustomer(supabase, newCustomerData);
      customerIdToLink = newCustomer.id;
      console.log(`[placeOrderAction] New customer created with ID: ${customerIdToLink}`);
    }
  } catch (customerError) {
    console.error('[placeOrderAction] Error managing customer record:', customerError);
    return { success: false, error: customerError instanceof Error ? customerError.message : 'An error occurred while managing customer data.' };
  }


  const shippingAddress = `${formData.streetAddress}, ${formData.city}, ${formData.stateProvince} ${formData.zipPostalCode}, ${formData.country}`;
  const shippingLatitude = formData.latitude ? parseFloat(formData.latitude) : null;
  const shippingLongitude = formData.longitude ? parseFloat(formData.longitude) : null;

  const orderInput: CreateOrderInput = {
    store_id: cartItems[0].storeId, 
    customer_id: customerIdToLink, // Link to the customer record
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
    const createdOrder = await createOrder(supabase, orderInput);
    if (!createdOrder || !createdOrder.id) {
      throw new Error('Order creation failed or did not return an ID.');
    }
    const orderId = createdOrder.id;

    const orderItemsInput: CreateOrderItemInput[] = cartItems.map(item => ({
      order_id: orderId,
      product_id: item.id,
      product_name_snapshot: item.name,
      quantity: item.quantity,
      price_per_unit_snapshot: item.price,
      product_image_url_snapshot: item.imageUrls[0] || null,
    }));
    await createOrderItems(supabase, orderItemsInput);

    for (const item of cartItems) {
      const newStockCount = (item.stockCount as number) - item.quantity; 
      await updateProductStock(supabase, item.id, newStockCount);
    }
    
    console.log(`[placeOrderAction] SIMULATION: Delivery dispatch for order ${orderId} would be initiated here.`);
    console.log(`[placeOrderAction] SIMULATION: Delivery address: ${shippingAddress}, Lat: ${orderInput.shipping_latitude}, Lng: ${orderInput.shipping_longitude}`);

    return { success: true, orderId: orderId, message: 'Order placed successfully!' };

  } catch (error) {
    console.error('Error placing order:', error);
    // Attempt to roll back customer creation if order fails and customer was new?
    // For now, we keep it simple. A more robust system might handle this.
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred while placing your order.' };
  }
}
