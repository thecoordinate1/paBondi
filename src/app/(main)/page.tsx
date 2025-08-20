
import { getFeaturedStores, getFeaturedProducts } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import StoreCard from '@/components/StoreCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Store, Product } from '@/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const groupStoresByCategory = (stores: Store[]) => {
  return stores.reduce((acc, store) => {
    const category = store.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(store);
    return acc;
  }, {} as Record<string, Store[]>);
};

const groupProductsByCategory = (products: Product[]) => {
  return products.reduce((acc, product) => {
    const category = product.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);
};


export default async function HomePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const featuredStores = await getFeaturedStores(supabase);
  const featuredProducts = await getFeaturedProducts(supabase);

  const storesByCategory = groupStoresByCategory(featuredStores);
  const productsByCategory = groupProductsByCategory(featuredProducts);

  return (
    <div className="space-y-12">
      <section aria-labelledby="hero-heading">
        <div className="bg-gradient-to-r from-primary/10 via-background to-accent/10 p-6 md:p-12 rounded-lg shadow-md text-center">
          <h1 id="hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Welcome to paBondi
          </h1>
          <p className="text-base sm:text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
            Discover unique items from your favorite local stores, all in one place. Quality, convenience, and community, delivered.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/products" passHref className="w-full sm:w-auto">
              <Button size="lg" variant="default" className="w-full sm:w-auto">Shop All Products</Button>
            </Link>
            <Link href="/stores" passHref className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">Explore Stores</Button>
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="featured-stores-heading">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <h2 id="featured-stores-heading" className="text-2xl sm:text-3xl font-semibold text-foreground">
            Featured Stores
          </h2>
          <Link href="/stores" passHref>
            <Button variant="link" className="text-primary p-0 sm:p-2 h-auto sm:h-10 self-start sm:self-center">
              View All Stores <ArrowRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
        {Object.keys(storesByCategory).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(storesByCategory).map(([category, stores]) => (
              <div key={category}>
                <h3 className="text-xl font-semibold text-foreground/90 mb-4">{category}</h3>
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {stores.map(store => (
                      <CarouselItem key={store.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                         <div className="p-1 h-full">
                          <StoreCard store={store} />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex" />
                  <CarouselNext className="hidden sm:flex" />
                </Carousel>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No featured stores available at the moment.</p>
        )}
      </section>

      <section aria-labelledby="featured-products-heading">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <h2 id="featured-products-heading" className="text-2xl sm:text-3xl font-semibold text-foreground">
            Featured Products
          </h2>
          <Link href="/products" passHref>
            <Button variant="link" className="text-primary p-0 sm:p-2 h-auto sm:h-10 self-start sm:self-center">
              View All Products <ArrowRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
         {Object.keys(productsByCategory).length > 0 ? (
           <div className="space-y-8">
            {Object.entries(productsByCategory).map(([category, products]) => (
              <div key={category}>
                <h3 className="text-xl font-semibold text-foreground/90 mb-4">{category}</h3>
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {products.map(product => (
                      <CarouselItem key={product.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                        <div className="p-1 h-full">
                          <ProductCard product={product} />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex" />
                  <CarouselNext className="hidden sm:flex" />
                </Carousel>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No featured products available at the moment.</p>
        )}
      </section>
    </div>
  );
}
