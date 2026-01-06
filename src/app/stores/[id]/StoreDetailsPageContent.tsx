
"use client";

import ProductCard from '@/components/ProductCard';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  MapPin,
  Tag,
  Link as LinkIcon,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Linkedin,
  Github,
  Phone,
  Store,
  Package,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import type { Store as AppStore, Product as AppProduct } from '@/types';
import Lightbox from '@/components/Lightbox';

interface StoreDetailsPageContentProps {
  store: AppStore;
  products: AppProduct[];
}

const SocialIcon = ({ platform }: { platform: string }) => {
  const lowerPlatform = platform.toLowerCase();
  if (lowerPlatform === 'instagram') return <Instagram size={18} />;
  if (lowerPlatform === 'twitter') return <Twitter size={18} />;
  if (lowerPlatform === 'facebook') return <Facebook size={18} />;
  if (lowerPlatform === 'youtube') return <Youtube size={18} />;
  if (lowerPlatform === 'linkedin') return <Linkedin size={18} />;
  if (lowerPlatform === 'github') return <Github size={18} />;
  return <LinkIcon size={18} />;
};

export default function StoreDetailsPageContent({ store, products }: StoreDetailsPageContentProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const showConnectSection = store.socialLinks?.length || store.contact_phone;
  const bannerImageUrl = store.banner_url || null;

  return (
    <>
      {lightboxOpen && bannerImageUrl && (
        <Lightbox images={[bannerImageUrl]} onClose={() => setLightboxOpen(false)} />
      )}
      <div className="space-y-8 pb-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/stores" className="hover:text-foreground transition-colors">
            Stores
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{store.name}</span>
        </div>

        {/* Hero Section with Store Info */}
        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-lg group">
          {/* Banner Image */}
          <div className="relative h-48 md:h-64 w-full cursor-pointer" onClick={() => bannerImageUrl && setLightboxOpen(true)}>
            {bannerImageUrl ? (
              <Image
                src={bannerImageUrl}
                alt={`${store.name} banner`}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
                <Package className="text-muted-foreground/30 w-16 h-16" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          <div className="p-6 md:p-10">
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start -mt-20 md:-mt-24">
              {/* Store Logo */}
              <div className="relative group/logo">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover/logo:opacity-40 transition duration-300"></div>
                <div className="relative">
                  <Image
                    src={store.logoUrl}
                    alt={`${store.name} logo`}
                    width={160}
                    height={160}
                    className="rounded-xl border-4 border-card bg-card aspect-square object-contain shadow-xl"
                    data-ai-hint="store logo detail"
                    unoptimized
                  />
                </div>
              </div>

              {/* Store Details */}
              <div className="flex-1 space-y-4 pt-4 text-center lg:text-left">
                <div>
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                    <Store className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl md:text-5xl font-bold">
                      {store.name}
                    </h1>
                  </div>
                  <p className="text-base md:text-lg text-foreground/70 mt-3 max-w-3xl mx-auto lg:mx-0">
                    {store.description}
                  </p>
                </div>

                {/* Store Meta Information */}
                <div className="flex flex-wrap gap-4 pt-2 justify-center lg:justify-start">
                  {store.categories && store.categories.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                      <Tag size={16} className="text-primary" />
                      <span className="text-sm font-medium">{cat}</span>
                    </div>
                  ))}
                  {store.location && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                      <MapPin size={16} className="text-accent" />
                      <span className="text-sm font-medium">{store.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border">
                    <Package size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{products.length} {products.length === 1 ? 'Product' : 'Products'}</span>
                  </div>
                </div>

                {/* Connect Section */}
                {showConnectSection && (
                  <div className="pt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Connect With Us
                    </h3>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      {store.socialLinks &&
                        store.socialLinks.map((link, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                            asChild
                          >
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <SocialIcon platform={link.platform} />
                              <span className="capitalize">{link.platform}</span>
                            </a>
                          </Button>
                        ))}

                      {store.contact_phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                          asChild
                        >
                          <a href={`tel:${store.contact_phone}`} className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Call Store
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Products Section */}
        <section aria-labelledby="store-products-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2
                id="store-products-heading"
                className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3"
              >
                <Package className="w-7 h-7 text-primary" />
                Products
              </h2>
              <p className="text-sm text-muted-foreground">
                Browse all available products from {store.name}
              </p>
            </div>

            <Link href="/stores" passHref>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Stores</span>
              </Button>
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Products Yet
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  This store currently has no products listed. Check back soon for new arrivals!
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}
