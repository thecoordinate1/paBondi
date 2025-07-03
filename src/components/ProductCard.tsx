
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';
import StarRating from './StarRating';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const lowStockThreshold = 5;

  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <Link href={`/products/${product.id}`} className="block">
        <CardHeader className="p-0">
          <div className="aspect-square relative w-full overflow-hidden">
            <Image
              src={product.imageUrls[0]}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint="product item"
              className="hover:scale-105 transition-transform duration-300"
            />
             {product.stockCount !== undefined && product.stockCount <= lowStockThreshold && product.stockCount > 0 && (
              <Badge variant="destructive" className="absolute top-2 right-2">Low Stock</Badge>
            )}
            {product.stockCount !== undefined && product.stockCount === 0 && (
              <Badge variant="outline" className="absolute top-2 right-2 bg-muted/80 text-muted-foreground">Out of Stock</Badge>
            )}
          </div>
        </CardHeader>
      </Link>
      <CardContent className="p-4 flex-grow">
        <Link href={`/products/${product.id}`} className="block">
          <CardTitle className="text-lg font-semibold mb-1 hover:text-primary transition-colors break-words">{product.name}</CardTitle>
        </Link>
        <CardDescription className="text-sm text-muted-foreground mb-1">
          <Link href={`/stores/${product.storeId}`} className="hover:underline">
            {product.storeName || 'Visit Store'}
          </Link>
        </CardDescription>
        {product.averageRating !== undefined && product.reviewCount !== undefined && (
          <StarRating rating={product.averageRating} reviewCount={product.reviewCount} size={14} className="mb-2" showText/>
        )}
        <p className="text-xl font-bold text-primary">ZMW {product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button 
          onClick={() => addToCart(product)} 
          className="w-full" 
          variant="default"
          disabled={product.stockCount === 0}
        >
          <ShoppingCart size={18} className="mr-2" />
          {product.stockCount === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
