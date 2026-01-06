
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Store } from '@/types';
import StoreCard from '@/components/StoreCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';


export default function StoreGridClient({
  initialStores,
  isLoading,
  defaultCategory = 'all',
  defaultSearch = ''
}: {
  initialStores: Store[],
  isLoading: boolean,
  defaultCategory?: string,
  defaultSearch?: string
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Use state only for inputs that need instant feedback (like typing)
  // Initialize with passed props (from server) to avoid hydration mismatch
  const [searchTerm, setSearchTerm] = useState(defaultSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);

  // NOTE: We don't need `setStores(initialStores)` as `filteredStores` depends directly on `initialStores`

  // Sync state with URL when search params change externally (e.g., browser back/forward)
  useEffect(() => {
    // Only update state if the URL parameter differs from the current state
    const urlCategory = searchParams.get('category') || 'all';
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate categories dynamically from the data
  const categories = useMemo(() => {
    const allCategories = new Set<string>();
    initialStores.forEach(s => {
      s.categories.forEach(c => {
        if (c.trim()) {
          allCategories.add(c.trim());
        }
      });
    });
    return ['all', ...Array.from(allCategories).sort()];
  }, [initialStores]);

  /**
   * Updates the URL query parameters without triggering a full page reload.
   */
  const updateURLParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };


  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateURLParams('category', category === 'all' ? null : category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    // NOTE: In a production app, you would typically debounce this update 
    // (e.g., wait 300ms after the user stops typing) before updating the URL.
    updateURLParams('search', newSearchTerm || null);
  };


  const filteredStores = useMemo(() => {
    let processedStores = initialStores;
    const currentSearchTerm = (searchParams.get('search') || '').toLowerCase();
    const currentCategory = searchParams.get('category') || 'all';

    // 1. Filter by Category (using URL param)
    if (currentCategory !== 'all') {
      processedStores = processedStores.filter(store =>
        store.categories.includes(currentCategory)
      );
    }

    // 2. Filter by Search Term (using URL param)
    if (currentSearchTerm) {
      processedStores = processedStores.filter(store =>
        store.name.toLowerCase().includes(currentSearchTerm) ||
        (store.description && store.description.toLowerCase().includes(currentSearchTerm))
      );
    }

    return processedStores;
  }, [initialStores, searchParams]); // Dependency on searchParams ensures filtering uses the URL state


  // --- Loading/Skeleton State ---
  if (isLoading) {
    return (
      <>
        <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
          <Skeleton className="h-10 w-full md:w-1/2 lg:w-1/3" />
          <Skeleton className="h-10 w-full md:w-[200px]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </>
    )
  }

  // --- Main Render State ---
  return (
    <>
      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search stores by name or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 w-full lg:w-[400px]" // Increased width for desktop
          />
        </div>

        <div className="w-full md:w-auto flex justify-end">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-[220px]">
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

      <Separator />

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mt-4 mb-6 font-medium">
        Showing **{filteredStores.length}** {filteredStores.length === 1 ? 'store' : 'stores'} found
        {initialStores.length > 0 && filteredStores.length < initialStores.length && ` (out of ${initialStores.length})`}
      </p>

      {/* Store Grid */}
      {filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStores.map(store => (
            // Assuming StoreCard exists and handles display correctly
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-lg text-center py-10 border rounded-lg bg-card/50">
          No stores found matching your current search or category filter.
        </p>
      )}
    </>
  );
}
