
import type { Store } from '@/types';
import { getAllStores } from '@/lib/data'; 
import { cookies } from 'next/headers'; 
import { createClient } from '@/lib/supabase/server'; 
import StoreGridClient from './StoreGridClient';
import { Suspense } from 'react';

async function fetchData(): Promise<Store[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const stores = await getAllStores(supabase);
  return stores;
}

function StoresPageContent({ initialStores }: { initialStores: Store[] }) {
  return <StoreGridClient initialStores={initialStores} isLoading={false} />;
}

export default async function StoresPageServer() {
  const initialStores = await fetchData();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">All Stores</h1>
       <Suspense fallback={<StoreGridClient initialStores={[]} isLoading={true} />}>
        <StoresPageContent initialStores={initialStores} />
      </Suspense>
    </div>
  );
}
