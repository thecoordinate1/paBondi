
import type { Product } from '@/types';
import { getAllProducts } from '@/lib/data';
import { cookies } from 'next/headers'; 
import { createClient } from '@/lib/supabase/server'; 
import ProductGridClient from './ProductGridClient';

async function fetchData(): Promise<Product[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const products = await getAllProducts(supabase);
  return products;
}

export default async function ProductsPageServer() {
  const initialProducts = await fetchData();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">All Products</h1>
      <ProductGridClient initialProducts={initialProducts} isLoading={false} /> 
    </div>
  );
}
