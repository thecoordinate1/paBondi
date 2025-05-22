"use client"; // Needs to be client for useCart

import { getProductById, getStoreById } from '@/lib/data';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Store as StoreIcon } from 'lucide-react';
import { use } from 'react'; // Import 'use'

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>; // Updated type to Promise
}

export default function ProductDetailsPage({ params: paramsPromise }: ProductDetailsPageProps) {
  const params = use(paramsPromise); // Unwrap the promise
  const product = getProductById(params.id); // Use resolved params
  const { addToCart } = useCart();

  if (!product) {
    notFound();
  }

  const store = getStoreById(product.storeId);

  return (
    <div className="space-y-8">
      <Link href="/products" passHref>
        <Button variant="outline" className="mb-6">
          <ArrowLeft size={16} className="mr-2" /> Back to Products
        </Button>
      </Link>

      <Card className="overflow-hidden shadow-lg">
        <div className="grid md:grid-cols-2 gap-0 md:gap-8 items-start">
          <div className="aspect-square relative w-full bg-muted/30">
            <Image
              src={product.imageUrl}
              alt={product.name}
              layout="fill"
              objectFit="contain"
              className="p-4 md:p-8"
              data-ai-hint="product detail image"
            />
          </div>
          <div className="p-6 md:p-8">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{product.name}</CardTitle>
              {store && (
                <Link href={`/stores/${store.id}`} className="text-md text-muted-foreground hover:text-primary transition-colors flex items-center mt-2">
                  <StoreIcon size={16} className="mr-2" /> Sold by {store.name}
                </Link>
              )}
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <p className="text-3xl font-extrabold text-foreground">${product.price.toFixed(2)}</p>
              <CardDescription className="text-base text-foreground/80 leading-relaxed">{product.description}</CardDescription>
              {product.category && (
                <p className="text-sm text-muted-foreground">Category: <span className="font-medium text-foreground">{product.category}</span></p>
              )}
              <Button onClick={() => addToCart(product)} size="lg" className="w-full md:w-auto mt-6">
                <ShoppingCart size={20} className="mr-2" /> Add to Cart
              </Button>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Note: generateStaticParams can be re-added if data fetching is from a static source
// and pre-rendering is desired. For client component with dynamic data lib, it might be omitted.
// export async function generateStaticParams() {
//   const { getAllProducts } = await import('@/lib/data');
//   const products = getAllProducts();
//   return products.map(product => ({ id: product.id }));
// }
