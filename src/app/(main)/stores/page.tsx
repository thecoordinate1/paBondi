
"use client"; 

import { useState, useEffect, useMemo } from 'react';
import type { Store } from '@/types';
import { getAllStores } from '@/lib/data'; 
import StoreCard from '@/components/StoreCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

// StoreGridClient remains the same
function StoreGridClient({ initialStores, isLoading }: { initialStores: Store[], isLoading: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stores, setStores] = useState<Store[]>(initialStores);

  useEffect(() => {
    setStores(initialStores);
  }, [initialStores]);

  const filteredStores = useMemo(() => {
    return stores.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.description && store.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stores, searchTerm]);

  if (isLoading) {
     return (
      <>
        <div className="relative mb-8">
          <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search stores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full md:w-1/2 lg:w-1/3"
        />
      </div>

      {filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map(store => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-lg text-center py-10">
          No stores found matching your criteria.
        </p>
      )}
    </>
  );
}

import { cookies } from 'next/headers'; 
import { createClient } from '@/lib/supabase/server'; 

// This is the Server Component part
async function fetchData() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const stores = await getAllStores(supabase);
  return stores;
}

export default async function StoresPageServer() {
  const initialStores = await fetchData();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">All Stores</h1>
      <StoreGridClient initialStores={initialStores} isLoading={false} />
    </div>
  );
}
