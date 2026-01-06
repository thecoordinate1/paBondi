
import type { Store } from '@/types';
import { getAllStores } from '@/lib/data';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import StoreGridClient from './StoreGridClient';
import { Suspense } from 'react';
import PageWrapper from '@/components/PageWrapper';

async function fetchData(): Promise<Store[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  // NOTE: You might want to limit the number of stores fetched initially if the directory grows huge.
  const stores = await getAllStores(supabase);
  return stores;
}

function StoresPageContent({
  initialStores,
  defaultCategory,
  defaultSearch
}: {
  initialStores: Store[],
  defaultCategory?: string,
  defaultSearch?: string
}) {
  // We pass the full array to the client component to handle filtering/searching
  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Explore Our Stores 🏬</h1>
      <StoreGridClient
        initialStores={initialStores}
        isLoading={false}
        defaultCategory={defaultCategory}
        defaultSearch={defaultSearch}
      />
    </div>
  );
}

export default async function StoresPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const category = typeof searchParams?.category === 'string' ? searchParams.category : undefined;
  const search = typeof searchParams?.search === 'string' ? searchParams.search : undefined;

  const initialStores = await fetchData();
  return (
    <PageWrapper>
      {/* Fallback added for a better loading experience while data fetches */}
      <Suspense fallback={<StoreGridClient initialStores={[]} isLoading={true} />}>
        <StoresPageContent
          initialStores={initialStores}
          defaultCategory={category}
          defaultSearch={search}
        />
      </Suspense>
    </PageWrapper>
  );
}
