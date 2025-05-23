"use client";

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold mb-4 text-foreground">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/products" passHref>
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Your Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => (
            <Card key={item.id} className="flex flex-col sm:flex-row items-center p-4 gap-4 overflow-hidden shadow-[0_0_10px_2px_rgba(var(--card-rgb),0.25)]">
              <Link href={`/products/${item.id}`} className="block shrink-0">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={100}
                  height={100}
                  className="rounded-md aspect-square object-cover border"
                  data-ai-hint="cart item"
                />
              </Link>
              <div className="flex-grow text-center sm:text-left">
                <Link href={`/products/${item.id}`} className="block">
                  <h2 className="text-lg font-semibold hover:text-primary transition-colors">{item.name}</h2>
                </Link>
                <p className="text-sm text-muted-foreground">Price: ${item.price.toFixed(2)}</p>
                 <Link href={`/stores/${item.storeId}`} className="text-xs text-muted-foreground hover:underline">
                    Sold by: {item.storeName || 'Store'}
                 </Link>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                  <Minus size={16} />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                  className="w-16 text-center h-9"
                  min="1"
                />
                <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus size={16} />
                </Button>
              </div>
              <p className="font-semibold w-20 text-center sm:text-right text-lg">${(item.price * item.quantity).toFixed(2)}</p>
              <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive/80">
                <Trash2 size={18} />
              </Button>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20 shadow-[0_0_20px_5px_rgba(var(--card-rgb),0.35)]">
            <CardHeader>
              <CardTitle className="text-2xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>${getCartTotal().toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <p>Shipping</p>
                <p>Calculated at checkout</p>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <p>Taxes</p>
                <p>Calculated at checkout</p>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <p>Total</p>
                <p>${getCartTotal().toFixed(2)}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button size="lg" className="w-full">Proceed to Checkout</Button>
              <Button variant="outline" className="w-full" onClick={clearCart}>Clear Cart</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
