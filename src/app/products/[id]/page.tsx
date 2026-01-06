
import { getProductById, getStoreById, getProductsByStoreId } from '@/lib/data';
import { notFound } from 'next/navigation';
import ProductDetailsPageContent from './ProductDetailsPageContent';
import PageWrapper from '@/components/PageWrapper';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Product, Store } from '@/types';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const product = await getProductById(supabase, id);

    if (!product) {
        notFound();
    }

    let store: Store | null = null;
    let relatedProducts: Product[] = [];

    if (product.storeId) {
        const fetchedStore = await getStoreById(supabase, product.storeId);
        if (fetchedStore) {
            store = fetchedStore;
            relatedProducts = (await getProductsByStoreId(supabase, product.storeId))
                .filter(p => p.id !== product.id)
                .slice(0, 4);
        }
    }

    return (
        <PageWrapper>
            <ProductDetailsPageContent
                product={product}
                store={store}
                relatedProducts={relatedProducts}
            />
        </PageWrapper>
    )
}
