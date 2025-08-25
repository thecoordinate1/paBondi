
import { getStoreById, getProductsByStoreId, getAllStores } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Tag, Link as LinkIcon, Instagram, Twitter, Facebook, Youtube, Linkedin, Github } from 'lucide-react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { CookieOptions } from '@supabase/ssr';
import { Badge } from '@/components/ui/badge';


interface StoreDetailsPageProps {
  params: { id: string };
}

const SocialIcon = ({ platform }: { platform: string }) => {
  const lowerPlatform = platform.toLowerCase();
  if (lowerPlatform === 'instagram') return <Instagram size={20} />;
  if (lowerPlatform === 'twitter') return <Twitter size={20} />;
  if (lowerPlatform === 'facebook') return <Facebook size={20} />;
  if (lowerPlatform === 'youtube') return <Youtube size={20} />;
  if (lowerPlatform === 'linkedin') return <Linkedin size={20} />;
  if (lowerPlatform === 'github') return <Github size={20} />;
  return <LinkIcon size={20} />;
};

export default async function StoreDetailsPage({ params }: StoreDetailsPageProps) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const store = await getStoreById(supabase, params.id);

  if (!store) {
    notFound();
  }

  const products = await getProductsByStoreId(supabase, store.id);

  return (
    <div className="space-y-8">
      <Link href="/stores" passHref>
        <Button variant="outline" className="mb-0"> {/* Changed mb-6 to mb-0 or adjust as needed */}
          <ArrowLeft size={16} className="mr-2" /> Back to Stores
        </Button>
      </Link>

      <Card className="overflow-hidden shadow-xl">
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
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary break-words">{store.name}</CardTitle>
              <CardDescription className="text-lg text-foreground/80 mt-2">{store.description}</CardDescription>
              
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 items-center">
                {store.category && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Tag size={16} className="mr-2 text-primary" />
                    Category: <Badge variant="secondary" className="ml-2">{store.category}</Badge>
                  </div>
                )}
                {store.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin size={16} className="mr-2 text-primary" />
                    Location: <span className="font-medium ml-1 text-foreground/90">{store.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        {store.socialLinks && store.socialLinks.length > 0 && (
          <CardContent className="p-6 md:p-8 border-t">
            <h3 className="text-lg font-semibold text-foreground mb-3">Connect with us:</h3>
            <div className="flex flex-wrap gap-4">
              {store.socialLinks.map((link, index) => (
                <Button key={index} variant="outline" size="sm" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <SocialIcon platform={link.platform} />
                    <span className="ml-2 capitalize">{link.platform}</span>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        )}
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

// This function is called at build time and cannot use cookies.
export async function generateStaticParams() {
    // Create a Supabase client that does not depend on a request context
    const supabase = createClient({
      get: () => undefined,
      set: () => {},
      remove: () => {},
    } as any);

    const stores = await getAllStores(supabase); 
    return stores.map(store => ({ id: store.id }));
}
