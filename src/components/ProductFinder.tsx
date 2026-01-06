
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import AutoPartsFinder from './finders/AutoPartsFinder';
import ApparelFinder from './finders/ApparelFinder';
import JerseysFinder from './finders/JerseysFinder';
import ElectronicsFinder from './finders/ElectronicsFinder';
import GenericFinder from './finders/GenericFinder';
import { createClient } from '@/lib/supabase/client';
import { getProductStats } from '@/lib/data';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types';

const ProductFinder = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<{
    sellerCount: number;
    unitCount: number;
    previewImage?: string | null;
    attributes: Record<string, string[]>;
    minPrice: number;
    cheapestProduct: Product | null;
  }>({ sellerCount: 0, unitCount: 0, attributes: {}, minPrice: 0, cheapestProduct: null });
  const [categories, setCategories] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('status', 'Active');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      if (data) {
        const uniqueCategories = Array.from(new Set(data.map((item) => item.category).filter(Boolean))) as string[];
        uniqueCategories.sort();
        setCategories(uniqueCategories);
      }
    };

    fetchCategories();
  }, [supabase]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedClass) return;
      const data = await getProductStats(supabase, selectedClass, filters);
      setStats(data);
    };
    fetchStats();
  }, [selectedClass, filters, supabase]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = () => {
    if (stats.cheapestProduct) {
      addToCart(stats.cheapestProduct);
    }
  };

  const handleCompare = () => {
    if (!selectedClass) return;
    const params = new URLSearchParams();
    params.set('category', selectedClass);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') params.set(key, value);
    });
    params.set('sort', 'price-asc'); // Sort by price for comparison
    router.push(`/products?${params.toString()}`);
  };

  const renderFinder = () => {
    if (!selectedClass) {
      return (
        <div className="space-y-4">
          <div className="aspect-square relative w-full overflow-hidden rounded-md border bg-muted/30 flex items-center justify-center">
            <Image
              src="/images/finder-instructions.svg"
              alt="How to use product finder"
              fill
              className="object-contain p-6"
            />
          </div>
          <p className="text-center text-muted-foreground text-sm">Select a category above to start searching.</p>
        </div>
      );
    }

    const commonProps = {
      onFilterChange: handleFilterChange,
      stats: { sellerCount: stats.sellerCount, unitCount: stats.unitCount },
      previewImage: stats.previewImage,
      attributes: stats.attributes,
      onCompare: handleCompare
    };

    switch (selectedClass) {
      case 'auto-parts':
        return <AutoPartsFinder {...commonProps} />;
      case 'apparel':
        return <ApparelFinder {...commonProps} />;
      case 'jerseys':
        return <JerseysFinder {...commonProps} />;
      case 'electronics':
        return <ElectronicsFinder {...commonProps} />;
      default:
        return <GenericFinder {...commonProps} category={selectedClass} />;
    }
  };

  // Default categories to show if DB is empty or loading, or just to ensure they are available options
  // However, if we only want what's in DB, we rely on `categories`.
  // Let's merge hardcoded ones with fetched ones to ensure the UI looks good even with empty DB for now?
  // The user said "i dont want the product categories... to be limited to just those three".
  // So I should show ALL categories found in DB.
  // I will also include the 3 hardcoded ones in the list if they are not in the DB, 
  // OR I should just rely on the DB. 
  // If the DB is empty, the finder is useless anyway.
  // But for development, maybe I should keep the hardcoded ones as fallbacks or "Popular" ones?
  // Let's just use the fetched categories. If the user adds a product with "auto-parts", it will show up.
  // Wait, if the DB has no "auto-parts" products, then selecting it is weird if I force it.
  // But the "Finder" components exist for them.
  // I will combine the known types with the fetched ones to ensure the specific finders can be tested/used if desired, 
  // but usually we only want to search for what exists.
  // I'll stick to fetched categories.

  return (
    <Card className="w-full max-w-sm overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg flex flex-col max-h-[85svh]">
      <CardHeader className="p-4 bg-muted/30">
        <div className="flex justify-between items-center gap-4">
          <Select value={selectedClass || undefined} onValueChange={(value: string) => { setSelectedClass(value); setFilters({}); }}>
            <SelectTrigger className="w-full" aria-label="Product Class">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category.replace('-', ' ')}
                </SelectItem>
              ))}
              {/* Fallback if no categories found yet, or maybe we should always show the main 3? 
                  If I don't show them, the user can't select them to see the specific finders unless products exist.
                  I will add them if they are missing from the list, just so the UI isn't empty initially.
              */}
              {!categories.includes('auto-parts') && <SelectItem value="auto-parts">Auto Parts</SelectItem>}
              {!categories.includes('apparel') && <SelectItem value="apparel">Apparel</SelectItem>}
              {!categories.includes('jerseys') && <SelectItem value="jerseys">Jerseys</SelectItem>}
              {!categories.includes('electronics') && <SelectItem value="electronics">Electronics</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
          {renderFinder()}
        </div>

        {/* Price and Add to Cart Section */}
        {selectedClass && (
          <div className="flex flex-col gap-2 pt-4 border-t mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Best Price:</span>
              <span className="text-xl font-bold">
                {stats.minPrice > 0 ? `K${stats.minPrice.toFixed(2)}` : '--'}
              </span>
            </div>
            <Button
              variant="default"
              className="w-full"
              onClick={handleAddToCart}
              disabled={!stats.cheapestProduct}
            >
              <ShoppingCart size={18} className="mr-2" />
              Add to Cart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductFinder;
