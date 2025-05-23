
import { getStoreById, getProductsByStoreId } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface StoreDetailsPageProps {
  params: { id: string };
}

export default function StoreDetailsPage({ params }: StoreDetailsPageProps) {
  const store = getStoreById(params.id);

  if (!store) {
    notFound();
  }

  const products = getProductsByStoreId(store.id);

  return (
    <div className="space-y-8">
      <Link href="/stores" passHref>
        <Button variant="outline" className="mb-6">
          <ArrowLeft size={16} className="mr-2" /> Back to Stores
        </Button>
      </Link>

      <Card className="overflow-hidden shadow-[0_0_20px_5px_rgba(var(--card-rgb),0.35)]">
        <CardHeader className="bg-muted/30 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Image
              src={store.logoUrl}
              alt={`${store.name} logo`}
              width={128}
              height={128}
              className="rounded-lg border bg-card aspect-square object-contain"
              data-ai-hint="store logo detail"
            />
            <div className="flex-1">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{store.name}</CardTitle>
              <CardDescription className="text-lg text-foreground/80 mt-2">{store.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <section aria-labelledby="store-products-heading">
        <h2 id="store-products-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
          Products from {store.name}
        </h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-lg py-6">This store currently has no products listed.</p>
        )}
      </section>
    </div>
  );
}

export async function generateStaticParams() {
  const { getAllStores } = await import('@/lib/data');
  const stores = getAllStores();
  return stores.map(store => ({ id: store.id }));
}
