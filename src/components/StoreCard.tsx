
import Image from 'next/image';
import Link from 'next/link';
import type { Store } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Package } from 'lucide-react';

interface StoreCardProps {
  store: Store;
}

const StoreCard = ({ store }: StoreCardProps) => {
  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border-muted">
      <Link href={`/stores/${store.slug}`} className="block relative group">
        {/* Banner Section */}
        <div className="h-32 w-full bg-muted relative overflow-hidden">
          {store.banner_url ? (
            <Image
              src={store.banner_url}
              alt={`${store.name} banner`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
              <Package className="text-muted-foreground/30 w-12 h-12" />
            </div>
          )}
          {/* Overlay gradient for text readability if needed */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
        </div>

        {/* Logo overlapping banner */}
        <div className="absolute -bottom-8 left-4 rounded-lg shadow-md border-2 border-background overflow-hidden bg-background">
          {store.logoUrl ? (
            <Image
              src={store.logoUrl}
              alt={`${store.name} logo`}
              width={64}
              height={64}
              className="object-contain w-16 h-16 bg-white"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 bg-secondary flex items-center justify-center">
              <Package className="text-muted-foreground w-8 h-8" />
            </div>
          )}
        </div>

        {/* Verified Badge */}
        {store.is_verified && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> VERIFIED
          </div>
        )}
      </Link>

      <CardHeader className="pt-10 pb-2 px-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold hover:text-primary transition-colors break-words leading-tight">
            <Link href={`/stores/${store.slug}`}>{store.name}</Link>
          </CardTitle>
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex text-yellow-500">
            {/* Simple star rendering based on average_rating */}
            <span className="text-sm font-medium text-foreground">{store.average_rating?.toFixed(1) || 'N/A'}</span>
            <span className="ml-1 text-xs text-muted-foreground">★</span>
          </div>
          <span className="text-xs text-muted-foreground">• {store.review_count || 0} reviews</span>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2 flex-grow">
        <CardDescription className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {store.description}
        </CardDescription>

        {/* Categories Pills */}
        {store.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {store.categories.slice(0, 3).map((cat, idx) => (
              <span key={idx} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full capitalize">
                {cat}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 border-t mt-auto bg-muted/20">
        <Link href={`/stores/${store.slug}`} className="w-full">
          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            Visit Store <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default StoreCard;
