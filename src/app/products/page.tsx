
import type { Product } from '@/types';
import { getAllProducts, findProducts } from '@/lib/data';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import ProductGridClient from './ProductGridClient';
import { Suspense } from 'react';
import PageWrapper from '@/components/PageWrapper';

async function fetchData(searchParams?: { [key: string]: string | string[] | undefined }): Promise<Product[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const category = typeof searchParams?.category === 'string' ? searchParams.category : undefined;

  // Extract other filters from searchParams
  // We assume any param other than 'category' and 'sort' is an attribute filter
  const filters: Record<string, any> = {};
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'category' && key !== 'sort' && typeof value === 'string') {
        filters[key] = value;
      }
    });
  }

  if (category || Object.keys(filters).length > 0) {
    return findProducts(supabase, category, filters);
  }

  return getAllProducts(supabase);
}

function ProductsPageContent({ initialProducts }: { initialProducts: Product[] }) {
  return (
    // Outer container for padding
    <div className="space-y-10 px-4 sm:px-6 lg:px-8">

      {/* Enhanced Title Section (Kept Centered/Standard Width) */}
      <header className="py-4 max-w-screen-xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Marketplace 🛍️
        </h1>
        <p className="text-lg text-muted-foreground mt-1">Browse all unique local finds across the platform.</p>
      </header>

      {/* Product Grid Container (MAXIMUM WIDTH) */}
      <div className="max-w-screen-3xl mx-auto">
        <ProductGridClient initialProducts={initialProducts} isLoading={false} />
      </div>
    </div>
  );
}


export default async function ProductsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const initialProducts = await fetchData(searchParams);
  return (
    <PageWrapper>
      <Suspense fallback={<ProductGridClient initialProducts={[]} isLoading={true} />}>
        <ProductsPageContent initialProducts={initialProducts} />
      </Suspense>
    </PageWrapper>
  );
}
