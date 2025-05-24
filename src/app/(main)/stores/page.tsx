
"use client"; // Keep client for filtering, but data is fetched on server

import { useState, useEffect, useMemo } from 'react';
import type { Store } from '@/types';
import { getAllStores } from '@/lib/data'; // This will now be a server function
import StoreCard from '@/components/StoreCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// New component to handle client-side logic
function StoreGridClient({ initialStores }: { initialStores: Store[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stores, setStores] = useState<Store[]>(initialStores); // Initialize with server-fetched data

  useEffect(() => {
    setStores(initialStores);
  }, [initialStores]);

  const filteredStores = useMemo(() => {
    return stores.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.description && store.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stores, searchTerm]);

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

// Server Component to fetch data
export default async function StoresPage() {
  const initialStores = await getAllStores();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">All Stores</h1>
      <StoreGridClient initialStores={initialStores} />
    </div>
  );
}
