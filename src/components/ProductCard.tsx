"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <Link href={`/products/${product.id}`} className="block">
        <CardHeader className="p-0">
          <div className="aspect-square relative w-full overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint="product item"
              className="hover:scale-105 transition-transform duration-300"
            />
          </div>
        </CardHeader>
      </Link>
      <CardContent className="p-4 flex-grow">
        <Link href={`/products/${product.id}`} className="block">
          <CardTitle className="text-lg font-semibold mb-1 hover:text-primary transition-colors">{product.name}</CardTitle>
        </Link>
        <CardDescription className="text-sm text-muted-foreground mb-2">
          <Link href={`/stores/${product.storeId}`} className="hover:underline">
            {product.storeName || 'Visit Store'}
          </Link>
        </CardDescription>
        <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button onClick={() => addToCart(product)} className="w-full" variant="default">
          <ShoppingCart size={18} className="mr-2" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
