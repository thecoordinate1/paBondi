
'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { findOrdersBySearchTerm } from '@/lib/data'; // Changed from getOrderDetailsById
import type { AppOrder } from '@/types';

interface FetchOrderResult {
  success: boolean;
  order?: AppOrder | null;
  error?: string;
}

export async function fetchOrderAction(searchTerm: string): Promise<FetchOrderResult> {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
    return { success: false, error: 'Invalid search term.' };
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const order = await findOrdersBySearchTerm(supabase, searchTerm.trim()); // Use new function
    if (order) {
      return { success: true, order: order };
    } else {
      return { success: false, order: null, error: 'No order found matching your search criteria.' };
    }
  } catch (error) {
    console.error(`[fetchOrderAction] Error fetching order with term "${searchTerm}":`, error);
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching your order.' };
  }
}
