'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getOrderDetailsById } from '@/lib/data';
import type { AppOrder } from '@/types';

export async function getOrdersByIdsAction(orderIds: string[]): Promise<{ success: boolean; orders?: AppOrder[]; error?: string }> {
    if (!orderIds || orderIds.length === 0) {
        return { success: false, error: 'No order IDs provided.' };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    try {
        const orderPromises = orderIds.map(id => getOrderDetailsById(supabase, id));
        const orders = (await Promise.all(orderPromises)).filter((o): o is AppOrder => o !== null);

        if (orders.length === 0) {
            return { success: false, error: 'No orders found.' };
        }

        return { success: true, orders };
    } catch (error: any) {
        console.error('[getOrdersByIdsAction] Error fetching orders:', error);
        return { success: false, error: 'Failed to fetch order details.' };
    }
}
