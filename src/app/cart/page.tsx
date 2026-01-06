
"use client";

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Minus, Plus, ShoppingBag, CreditCard } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PageWrapper from '@/components/PageWrapper';
import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; 

const slugify = (text: string) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') 
    .replace(/[\s_-]+/g, '-') 
    .replace(/^-+|-+$/g, ''); 
};


function CartPageContent() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  
  // --- Updated Price Calculations ---
  const subtotal = getCartTotal();
  
  // 1. Service Fee replaced Tax (Fixed at K 20.00)
  const SERVICE_FEE = 20.00;
  const serviceFee = cartItems.length > 0 ? SERVICE_FEE : 0.00;
  
  // 2. Shipping is now not calculated here (set to 0 for total calculation)
  const shippingForTotal = 0.00; 

  // Calculate the total based on what is known (Subtotal + Service Fee)
  const total = subtotal + serviceFee + shippingForTotal;
  // ----------------------------------------------------


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
    <div className="space-y-10">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Your Shopping Cart ({cartItems.length})</h1>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* --- LEFT COLUMN: ITEMS --- */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => {
            const storeSlug = item.storeName ? slugify(item.storeName) : item.storeId;
            const itemTotal = item.price * item.quantity;
            
            return (
              <Card key={item.id} className="p-4 shadow-lg hover:shadow-xl transition-shadow relative">
                <div className="flex gap-4">
                    
                    {/* Item Image and Name Block */}
                    <div className="flex-shrink-0">
                        <Link href={`/products/${item.id}`} className="block">
                            <Image
                            src={item.imageUrls[0]} 
                            alt={item.name}
                            width={100}
                            height={100}
                            className="rounded-md aspect-square object-cover border"
                            />
                        </Link>
                    </div>

                    <div className="flex-grow flex flex-col justify-between">
                        {/* Title and Store */}
                        <div>
                            <Link href={`/products/${item.id}`} className="block">
                                <h2 className="text-lg font-semibold hover:text-primary transition-colors break-words line-clamp-2">{item.name}</h2>
                            </Link>
                            <Link href={`/stores/${storeSlug}`} className="text-sm text-muted-foreground hover:underline mt-1">
                                Sold by: {item.storeName || 'Store'}
                            </Link>
                        </div>
                        
                        {/* Price per unit and Remove Button (Mobile/Subtle) */}
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-muted-foreground">Unit Price: K {item.price.toFixed(2)}</p>
                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-destructive hover:bg-destructive/10 sm:hidden">
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator className="my-3"/>

                {/* --- Footer Row: Quantity and Total --- */}
                <div className="flex items-center justify-between">
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                            disabled={item.quantity <= 1}
                        >
                            <Minus size={16} />
                        </Button>
                        <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                            className="w-16 text-center h-9 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                            min="1"
                        />
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                            <Plus size={16} />
                        </Button>
                    </div>
                    
                    {/* Item Total and Remove Button (Desktop) */}
                    <div className="flex items-center gap-4">
                        <p className="font-bold text-xl text-foreground w-20 text-right">K {itemTotal.toFixed(2)}</p>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeFromCart(item.id)} 
                            className="text-destructive hover:bg-destructive/10 hidden sm:inline-flex"
                        >
                            <Trash2 size={18} />
                        </Button>
                    </div>
                </div>
              </Card>
            )
          })}
          
          {/* Clear Cart button moved down for better visibility */}
          <div className="flex justify-between items-center pt-4">
             <Button variant="destructive" size="sm" onClick={clearCart}>
                <Trash2 size={16} className="mr-2"/> Clear All Items
            </Button>
          </div>
        </div>

        {/* --- RIGHT COLUMN: ORDER SUMMARY --- */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 shadow-xl border-primary/20">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-6">
              
              <div className="flex justify-between text-lg">
                <p className="text-muted-foreground">Subtotal</p>
                <p className="font-medium">K {subtotal.toFixed(2)}</p>
              </div>
              
              {/* Shipping (Calculated at checkout) */}
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">Shipping</p>
                <p className="font-medium text-primary">Calculated at checkout</p> {/* CHANGE 1 */}
              </div>
              
              {/* Service Fee (K 20.00 Fixed) */}
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">Service Fee</p> {/* CHANGE 2 */}
                <p className="font-medium">K {serviceFee.toFixed(2)}</p> {/* CHANGE 3 */}
              </div>
              
              <Separator className="mt-4 mb-4"/>
              
              <div className="flex justify-between font-bold text-xl">
                <p>Estimated Total</p> {/* Changed Total to Estimated Total */}
                {/* Note: Total now EXCLUDES shipping, as it is unknown */}
                <p className="text-primary">K {total.toFixed(2)}</p> 
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                    <CreditCard size={18} className="text-primary"/> Estimated Total
                </AlertTitle>
                <AlertDescription className="text-xs">
                    Shipping is excluded and will be calculated based on delivery address at checkout.
                </AlertDescription>
              </Alert>
              <Link href="/checkout" className="w-full">
                <Button size="lg" className="w-full font-semibold">
                  Proceed to Checkout ({cartItems.length} items)
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}


export default function CartPage() {
    return (
        <PageWrapper>
            <CartPageContent />
        </PageWrapper>
    )
}
