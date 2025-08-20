
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Store } from '@/types';
import StoreCard from '@/components/StoreCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';


export default function StoreGridClient({ initialStores, isLoading }: { initialStores: Store[], isLoading: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  
  useEffect(() => {
    setStores(initialStores);
  }, [initialStores]);

   useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  const categories = useMemo(() => {
    const allCategories = new Set(initialStores.map(p => p.category).filter(Boolean) as string[]);
    return ['all', ...Array.from(allCategories).sort()];
  }, [initialStores]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    router.push(`${pathname}?${params.toString()}`);
  };


  const filteredStores = useMemo(() => {
    let processedStores = stores;

    if (selectedCategory !== 'all') {
      processedStores = processedStores.filter(store => store.category === selectedCategory);
    }

    processedStores = processedStores.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.description && store.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return processedStores;
  }, [stores, searchTerm, selectedCategory]);

  if (isLoading) {
     return (
      <>
        <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
            <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3" />
            <Skeleton className="h-10 w-full md:w-[180px]" />
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
       <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
        <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-full lg:w-[350px]"
            />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
