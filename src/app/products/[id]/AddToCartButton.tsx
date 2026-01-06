
"use client";

import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  product: Product & { salePrice?: number }; // Ensure type reflects salePrice
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const isOutOfStock = product.stockCount === 0;

  return (
    <Button 
      onClick={() => addToCart(product)} 
      size="lg" 
      className="w-full" // Removed md:w-auto to make it full width in the column
      disabled={isOutOfStock}
    >
      <ShoppingCart size={20} className="mr-2" /> 
      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
    </Button>
  );
}
