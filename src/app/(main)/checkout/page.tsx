
"use client";

import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { OrderFormData } from '@/types';
import { placeOrderAction } from './actions';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const checkoutFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  streetAddress: z.string().min(5, { message: "Street address is too short." }),
  city: z.string().min(2, { message: "City name is too short." }),
  stateProvince: z.string().min(2, { message: "State/Province is too short." }),
  zipPostalCode: z.string().min(3, { message: "ZIP/Postal code is too short." }),
  country: z.string().min(2, { message: "Country name is too short." }),
});

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (cartItems.length === 0 && isClient) { // Check isClient to avoid redirect during SSR/initial render
      toast({
        title: "Your cart is empty",
        description: "Please add items to your cart before proceeding to checkout.",
        variant: "destructive",
      });
      router.push('/cart');
    }
  }, [cartItems, router, toast, isClient]);


  const { register, handleSubmit, formState: { errors } } = useForm<OrderFormData>({
    resolver: zodResolver(checkoutFormSchema),
  });

  const onSubmit: SubmitHandler<OrderFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await placeOrderAction(data, cartItems, getCartTotal());
      if (result.success) {
        toast({
          title: "Order Placed!",
          description: `Your order #${result.orderId} has been placed successfully.`,
        });
        clearCart();
        router.push('/'); // Redirect to homepage
      } else {
        toast({
          title: "Order Failed",
          description: result.error || "Could not place your order. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient || cartItems.length === 0) {
    // Render loading or minimal content until client-side check completes or if cart is empty
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Order Summary Column */}
        <div className="lg:col-span-1 lg:order-last">
          <Card className="sticky top-20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                     <Image 
                        src={item.imageUrls[0]} 
                        alt={item.name} 
                        width={40} 
                        height={40} 
                        className="rounded aspect-square object-cover border"
                        data-ai-hint="cart item"
                      />
                    <div>
                      <p className="font-medium">{item.name} (x{item.quantity})</p>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold text-lg pt-2">
                <p>Total</p>
                <p>${getCartTotal().toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Details Form Column */}
        <div className="lg:col-span-2 lg:order-first">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Shipping Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register("name")} className="mt-1" />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" {...register("email")} className="mt-1" />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Input id="streetAddress" {...register("streetAddress")} className="mt-1" />
                  {errors.streetAddress && <p className="text-sm text-destructive mt-1">{errors.streetAddress.message}</p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} className="mt-1" />
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="stateProvince">State / Province</Label>
                    <Input id="stateProvince" {...register("stateProvince")} className="mt-1" />
                    {errors.stateProvince && <p className="text-sm text-destructive mt-1">{errors.stateProvince.message}</p>}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="zipPostalCode">ZIP / Postal Code</Label>
                    <Input id="zipPostalCode" {...register("zipPostalCode")} className="mt-1" />
                    {errors.zipPostalCode && <p className="text-sm text-destructive mt-1">{errors.zipPostalCode.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register("country")} className="mt-1" />
                    {errors.country && <p className="text-sm text-destructive mt-1">{errors.country.message}</p>}
                  </div>
                </div>
                <CardFooter className="p-0 pt-4">
                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Placing Order...' : 'Place Order & Simulate Payment'}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
