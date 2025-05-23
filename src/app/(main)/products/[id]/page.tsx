
"use client"; 

import { getProductById, getStoreById, getProductsByStoreId } from '@/lib/data';
import Image from 'next/image';
import { notFound, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Store as StoreIcon, AlertTriangle } from 'lucide-react';
import { use } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import StarRating from '@/components/StarRating';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';


interface ProductDetailsPageProps {
  params: Promise<{ id: string }>; 
}

export default function ProductDetailsPage({ params: paramsPromise }: ProductDetailsPageProps) {
  const params = use(paramsPromise); 
  const product = getProductById(params.id); 
  const { addToCart } = useCart();
  const pathname = usePathname();

  if (!product) {
    notFound();
  }

  const store = getStoreById(product.storeId);
  const lowStockThreshold = 5;

  const breadcrumbSegments = [
    { title: "Home", href: "/" },
    { title: "Products", href: "/products" },
  ];
  if (product.category) {
    // In a real app, you might want to make category a link to a category page
    breadcrumbSegments.push({ title: product.category, href: `/products?category=${encodeURIComponent(product.category)}` });
  }
  breadcrumbSegments.push({ title: product.name });

  const relatedProducts = product.category 
    ? getProductsByStoreId(product.storeId) // Simple logic: products from same store
        .filter(p => p.id !== product.id && p.category === product.category)
        .slice(0, 4) 
    : [];


  return (
    <div className="space-y-8">
      <Breadcrumbs segments={breadcrumbSegments} />
      
      <Link href="/products" passHref>
        <Button variant="outline" className="mb-0">
          <ArrowLeft size={16} className="mr-2" /> Back to Products
        </Button>
      </Link>

      <Card className="overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2 gap-0 md:gap-8 items-start">
          <div className="relative w-full bg-muted/30 p-4 md:p-6">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <Carousel className="w-full max-w-md mx-auto" opts={{ loop: true }}>
                <CarouselContent>
                  {product.imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-square relative bg-card rounded-lg overflow-hidden border">
                        <Image
                          src={url}
                          alt={`${product.name} - image ${index + 1}`}
                          layout="fill"
                          objectFit="contain"
                          className="p-2"
                          data-ai-hint="product detail image"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {product.imageUrls.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2 text-foreground bg-background/50 hover:bg-background/80" />
                    <CarouselNext className="right-2 text-foreground bg-background/50 hover:bg-background/80" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="aspect-square relative bg-card rounded-lg flex items-center justify-center border">
                <StoreIcon size={64} className="text-muted-foreground" /> {/* Placeholder icon */}
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{product.name}</CardTitle>
              {store && (
                <Link href={`/stores/${store.id}`} className="text-md text-muted-foreground hover:text-primary transition-colors flex items-center mt-1">
                  <StoreIcon size={16} className="mr-2" /> Sold by {store.name}
                </Link>
              )}
            </CardHeader>

            {product.averageRating !== undefined && product.reviewCount !== undefined && (
              <div className="my-3">
                <StarRating rating={product.averageRating} reviewCount={product.reviewCount} size={20} showText />
              </div>
            )}
            
            <CardContent className="p-0 space-y-4">
              <p className="text-3xl font-extrabold text-foreground">${product.price.toFixed(2)}</p>

              {product.stockCount !== undefined && (
                <div className='my-3'>
                  {product.stockCount > lowStockThreshold && (
                    <Badge variant="default" className="bg-green-600/80 hover:bg-green-500/80 text-white">In Stock</Badge>
                  )}
                  {product.stockCount <= lowStockThreshold && product.stockCount > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1.5">
                      <AlertTriangle size={14}/> Only {product.stockCount} left in stock!
                    </Badge>
                  )}
                  {product.stockCount === 0 && (
                     <Badge variant="outline" className="bg-muted text-muted-foreground">Out of Stock</Badge>
                  )}
                </div>
              )}

              <CardDescription className="text-base text-foreground/80 leading-relaxed">{product.description}</CardDescription>
              
              {product.category && (
                <p className="text-sm text-muted-foreground">Category: <span className="font-medium text-foreground">{product.category}</span></p>
              )}
              
              <Button 
                onClick={() => addToCart(product)} 
                size="lg" 
                className="w-full md:w-auto mt-6"
                disabled={product.stockCount === 0}
              >
                <ShoppingCart size={20} className="mr-2" /> 
                {product.stockCount === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </CardContent>
          </div>
        </div>
      </Card>

      {relatedProducts.length > 0 && (
        <section className="pt-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map(relatedProduct => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
