
'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getOrderDetailsById } from '@/lib/data';
import type { AppOrder } from '@/types';

interface FetchOrderResult {
  success: boolean;
  order?: AppOrder | null;
  error?: string;
}

export async function fetchOrderAction(orderId: string): Promise<FetchOrderResult> {
  if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
    return { success: false, error: 'Invalid Order ID format.' };
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const order = await getOrderDetailsById(supabase, orderId.trim());
    if (order) {
      return { success: true, order: order };
    } else {
      return { success: false, order: null, error: 'Order not found.' };
    }
  } catch (error) {
    console.error(`[fetchOrderAction] Error fetching order ${orderId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching your order.' };
  }
}
