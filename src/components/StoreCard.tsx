import Image from 'next/image';
import Link from 'next/link';
import type { Store } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface StoreCardProps {
  store: Store;
}

const StoreCard = ({ store }: StoreCardProps) => {
  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <Link href={`/stores/${store.id}`} className="block">
        <CardHeader className="flex flex-row items-center space-x-4 p-4">
          <Image
            src={store.logoUrl}
            alt={`${store.name} logo`}
            width={64}
            height={64}
            className="rounded-md aspect-square object-contain"
            data-ai-hint="store logo"
          />
          <CardTitle className="text-xl font-semibold hover:text-primary transition-colors">{store.name}</CardTitle>
        </CardHeader>
      </Link>
      <CardContent className="p-4 pt-0 flex-grow">
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">{store.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Link href={`/stores/${store.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            Visit Store <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default StoreCard;
