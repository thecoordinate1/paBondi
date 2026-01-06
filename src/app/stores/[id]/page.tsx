
import { getStoreById, getProductsByStoreId } from '@/lib/data';
import { notFound } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import StoreDetailsPageContent from './StoreDetailsPageContent';

export default async function StoreDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const store = await getStoreById(supabase, id);

    if (!store) {
        notFound();
    }

    const products = await getProductsByStoreId(supabase, store.id);

    return (
        <PageWrapper>
            <StoreDetailsPageContent store={store} products={products} />
        </PageWrapper>
    );
}
