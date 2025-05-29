
'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { findOrdersBySearchTerm } from '@/lib/data'; 
import type { AppOrder } from '@/types';

interface FetchOrdersResult { // Changed to FetchOrdersResult (plural)
  success: boolean;
  orders?: AppOrder[] | null; // Changed to array
  error?: string;
}

export async function fetchOrderAction(searchTerm: string): Promise<FetchOrdersResult> {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
    return { success: false, error: 'Invalid search term.' };
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const ordersArray = await findOrdersBySearchTerm(supabase, searchTerm.trim());
    
    if (ordersArray.length > 0) {
      return { success: true, orders: ordersArray };
    } else {
      // This now means no orders found for any criteria (ID, email, or name)
      return { success: false, orders: [], error: 'No orders found matching your search criteria.' };
    }
  } catch (error) {
    console.error(`[fetchOrderAction] Error fetching order(s) with term "${searchTerm}":`, error);
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching your order(s).' };
  }
}
