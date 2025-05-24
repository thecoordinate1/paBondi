
import type { Store } from '@/types';
import { getAllStores } from '@/lib/data'; 
import { cookies } from 'next/headers'; 
import { createClient } from '@/lib/supabase/server'; 
import StoreGridClient from './StoreGridClient';

async function fetchData(): Promise<Store[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const stores = await getAllStores(supabase);
  return stores;
}

export default async function StoresPageServer() {
  const initialStores = await fetchData();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">All Stores</h1>
      <StoreGridClient initialStores={initialStores} isLoading={false} />
    </div>
  );
}
