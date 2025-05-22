"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Store } from '@/types';
import { getAllStores } from '@/lib/data';
import StoreCard from '@/components/StoreCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function StoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    setStores(getAllStores());
  }, []);

  const filteredStores = useMemo(() => {
    return stores.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stores, searchTerm]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">All Stores</h1>
      
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
    </div>
  );
}
