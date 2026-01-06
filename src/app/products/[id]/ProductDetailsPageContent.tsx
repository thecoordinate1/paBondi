
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Store as StoreIcon, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductCard from '@/components/ProductCard';
import AddToCartButton from './AddToCartButton';
import type { Product, Store } from '@/types';
import { slugify } from '@/lib/utils/slugify'; 
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Lightbox from '@/components/Lightbox';

interface ProductDetailsPageContentProps {
  product: Product;
  store: Store | null;
  relatedProducts: Product[];
}

// ----------------------------------------------------------------------
// Client Component for Page Content
// ----------------------------------------------------------------------

export default function ProductDetailsPageContent({ product, store, relatedProducts }: ProductDetailsPageContentProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxStartIndex(index);
    setLightboxOpen(true);
  };

  const storeSlug = store ? slugify(store.name) : product.storeId; 
  const lowStockThreshold = 5;
  const isOnSale = product.salePrice !== undefined && product.salePrice < product.price;

  const breadcrumbSegments = [
    { title: "Home", href: "/" },
    { title: "Products", href: "/products" },
  ];
  if (product.category) {
    breadcrumbSegments.push({ title: product.category, href: `/products?category=${encodeURIComponent(product.category)}` });
  }
  breadcrumbSegments.push({ title: product.name });

  return (
    <>
    {lightboxOpen && product.imageUrls && (
        <Lightbox images={product.imageUrls} startIndex={lightboxStartIndex} onClose={() => setLightboxOpen(false)} />
    )}
    <div className="max-w-screen-xl mx-auto space-y-12 pb-16 px-4 sm:px-6 lg:px-8">
      
      <div className="flex flex-col gap-4">
        <Breadcrumbs segments={breadcrumbSegments} />
        <Link href="/products" passHref>
          <Button variant="ghost" className="w-fit text-muted-foreground hover:text-foreground -ml-4">
            <ArrowLeft size={16} className="mr-2" /> Back to Products
          </Button>
        </Link>
      </div>

      {/* --- MAIN PRODUCT DETAIL GRID --- */}
      <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
        
        {/* LEFT COLUMN: IMAGE CAROUSEL (Lg: col-span-1, Xl: col-span-2) */}
        <Card className="lg:col-span-1 xl:col-span-2 p-4 bg-muted/10 shadow-lg border-none">
          <div className="relative w-full">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <Carousel className="w-full max-w-lg mx-auto" opts={{ loop: product.imageUrls.length > 1 }}>
                <CarouselContent>
                  {product.imageUrls.map((url, index) => (
                    <CarouselItem key={index} onClick={() => openLightbox(index)} className="cursor-pointer">
                      <div className="aspect-square relative rounded-xl overflow-hidden bg-card border">
                        <Image
                          src={url}
                          alt={`${product.name} - image ${index + 1}`}
                          fill 
                          sizes="(max-width: 768px) 100vw, 50vw"
                          style={{ objectFit: 'contain' }}
                          className="p-4"
                          priority={index === 0}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {product.imageUrls.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="aspect-square relative bg-card rounded-xl flex items-center justify-center border">
                <StoreIcon size={64} className="text-muted-foreground" /> 
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT COLUMN: PRODUCT INFO & PURCHASE CONTROLS (Lg: col-span-2, Xl: col-span-2) */}
        <div className="lg:col-span-2 xl:col-span-2 space-y-6">
          
          {/* HEADER (No Rating) */}
          <div className='space-y-2'>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground break-words">{product.name}</h1>
          </div>

          {/* PRICING & STOCK */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              {isOnSale && (
                <p className="text-4xl font-extrabold text-red-600">
                  K {product.salePrice!.toFixed(2)} 
                </p>
              )}
              <p className={cn(
                "text-3xl font-bold text-foreground",
                isOnSale && "text-xl text-muted-foreground line-through font-normal"
              )}>
                K {product.price.toFixed(2)}
              </p>
            </div>
            
            {product.stockCount !== undefined && (
              <div className='my-3'>
                {product.stockCount > lowStockThreshold && (
                  <Badge className="bg-green-600/90 hover:bg-green-500/90 text-white flex items-center gap-1.5">
                    <CheckCircle size={14}/> In Stock
                  </Badge>
                )}
                {product.stockCount <= lowStockThreshold && product.stockCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1.5">
                    <AlertTriangle size={14}/> Only {product.stockCount} left!
                  </Badge>
                )}
                {product.stockCount === 0 && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">Out of Stock</Badge>
                )}
              </div>
            )}

            <div className="border-t border-border/50 pt-4">
              <AddToCartButton product={product} />
            </div>
          </div>

          {/* SELLER INFO */}
          <Card className="p-4 bg-background/50 border shadow-sm">
            {store ? (
              <div className="flex items-center justify-between">
                <Link href={`/stores/${storeSlug}`} className="text-lg font-semibold text-foreground hover:text-primary transition-colors flex items-center">
                  <StoreIcon size={20} className="mr-3 text-muted-foreground" /> 
                  Sold by {store.name}
                </Link>
                <Button variant="outline" size="sm">View Store</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Seller information not available.</p>
            )}
          </Card>

        </div>
      </div>


      {/* --- DETAILS & SPECIFICATIONS --- */}
      <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
        
        {/* LEFT (Full Description) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-foreground border-b pb-2">Description</h2>
          <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{product.description}</p>
        </div>

        {/* RIGHT (Specifications Card) */}
        <Card className="p-6 h-fit">
          <CardTitle className="text-xl flex items-center mb-4">
            <Package size={20} className="mr-3 text-primary" /> Specifications
          </CardTitle>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">Category</span>
              <span className="text-sm font-semibold text-foreground">{product.category || 'N/A'}</span>
            </div>
            {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b pb-2">
                <span className="text-sm font-medium text-muted-foreground">{key}</span>
                <span className="text-sm font-semibold text-foreground">{value as string}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* --- RELATED PRODUCTS (MORE FROM STORE) --- */}
      {relatedProducts.length > 0 && (
        <section className="pt-8">
          <h2 className="text-3xl font-bold mb-6 text-foreground">More from {store?.name || 'This Store'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {relatedProducts.map(relatedProduct => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  );
}
