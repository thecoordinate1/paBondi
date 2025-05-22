
import { getFeaturedStores, getFeaturedProducts } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import StoreCard from '@/components/StoreCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const featuredStores = getFeaturedStores();
  const featuredProducts = getFeaturedProducts();

  return (
    <div className="space-y-12">
      <section aria-labelledby="hero-heading">
        <div className="bg-gradient-to-r from-primary/10 via-background to-accent/10 p-8 md:p-12 rounded-lg shadow-md text-center">
          <h1 id="hero-heading" className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Welcome to paBondi
          </h1>
          <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
            Discover unique items from your favorite local stores, all in one place. Quality, convenience, and community, delivered.
          </p>
          <div className="space-x-4">
            <Link href="/products" passHref>
              <Button size="lg" variant="default">Shop All Products</Button>
            </Link>
            <Link href="/stores" passHref>
              <Button size="lg" variant="outline">Explore Stores</Button>
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="featured-stores-heading">
        <div className="flex justify-between items-center mb-6">
          <h2 id="featured-stores-heading" className="text-3xl font-semibold text-foreground">
            Featured Stores
          </h2>
          <Link href="/stores" passHref>
            <Button variant="link" className="text-primary">
              View All Stores <ArrowRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
        {featuredStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStores.map(store => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No featured stores available at the moment.</p>
        )}
      </section>

      <section aria-labelledby="featured-products-heading">
        <div className="flex justify-between items-center mb-6">
          <h2 id="featured-products-heading" className="text-3xl font-semibold text-foreground">
            Featured Products
          </h2>
          <Link href="/products" passHref>
            <Button variant="link" className="text-primary">
              View All Products <ArrowRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No featured products available at the moment.</p>
        )}
      </section>
    </div>
  );
}
