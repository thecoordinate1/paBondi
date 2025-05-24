
"use client";

import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();

  return (
    <Button 
      onClick={() => addToCart(product)} 
      size="lg" 
      className="w-full md:w-auto mt-6"
      disabled={product.stockCount === 0}
    >
      <ShoppingCart size={20} className="mr-2" /> 
      {product.stockCount === 0 ? "Out of Stock" : "Add to Cart"}
    </Button>
  );
}
