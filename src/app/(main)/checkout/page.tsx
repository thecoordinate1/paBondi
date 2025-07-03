
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
import type { OrderFormData, PlaceOrderResult } from '@/types';
import { placeOrderAction, calculateDeliveryFeeAction } from './actions';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Info, LocateFixed, Loader2 } from 'lucide-react';

const checkoutFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  contactNumber: z.string().min(10, { message: "A valid contact number is required (e.g 077/076/075-xxxxxxx)" }),
  location: z.string().min(10, { message: "Please provide location coordinates or use current location." }).refine(val => /^-?\d{1,3}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/.test(val.trim()), {
    message: "Invalid format. Please use 'latitude, longitude'."
  }),
  mobileMoneyNumber: z.string().min(9, { message: "A valid mobile money number is required." }),
});

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [submissionErrors, setSubmissionErrors] = useState<{ storeId?: string; storeName?: string; message: string }[] | null>(null);
  
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (cartItems.length === 0 && isClient) {
      toast({
        title: "Your cart is empty",
        description: "Please add items to your cart before proceeding to checkout.",
        variant: "destructive",
      });
      router.push('/cart');
    }
  }, [cartItems, router, toast, isClient]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<OrderFormData>({
    resolver: zodResolver(checkoutFormSchema),
  });
  
  const userLocation = watch('location');

  const handleCalculateFee = useCallback(async (location: string) => {
    if (cartItems.length === 0) return;
    setIsCalculatingFee(true);
    setCalculationError(null);
    setDeliveryFee(null);
    try {
        const result = await calculateDeliveryFeeAction(location, cartItems);
        if (result.success && result.totalDeliveryFee !== undefined) {
            setDeliveryFee(result.totalDeliveryFee);
        } else {
            setCalculationError(result.error || "Could not calculate delivery fee. Please ensure store information is complete.");
            setDeliveryFee(null);
        }
    } catch (e) {
        setCalculationError("An error occurred while calculating the fee.");
        setDeliveryFee(null);
    } finally {
        setIsCalculatingFee(false);
    }
  }, [cartItems]);

  useEffect(() => {
    const isLocationValid = checkoutFormSchema.shape.location.safeParse(userLocation).success;
    if (isLocationValid) {
        const handler = setTimeout(() => {
            handleCalculateFee(userLocation);
        }, 500); // Debounce for 500ms
        return () => clearTimeout(handler);
    } else {
        setDeliveryFee(null);
        setCalculationError(null);
    }
  }, [userLocation, handleCalculateFee]);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setValue('location', `${latitude}, ${longitude}`, { shouldValidate: true });
          setIsLocating(false);
          toast({
            title: "Location Found!",
            description: "Your current location has been filled in."
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          const errorMessage = `Error: ${error.message}. Please paste coordinates manually.`;
          setLocationError(errorMessage);
          setIsLocating(false);
          toast({
            title: "Location Error",
            description: `Could not get your location. Please ensure you have granted permission in your browser.`,
            variant: "destructive",
          });
        }
      );
    } else {
      const errorMessage = "Geolocation is not supported by this browser.";
      setLocationError(errorMessage);
      setIsLocating(false);
       toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const onSubmit: SubmitHandler<OrderFormData> = async (data) => {
    if (deliveryFee === null) {
      toast({
        title: "Delivery Fee Missing",
        description: "Please provide a valid location to calculate the delivery fee before placing an order.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setSubmissionErrors(null);
    try {
      const result: PlaceOrderResult = await placeOrderAction(data, cartItems);
      if (result.success && result.orderIds && result.orderIds.length > 0) {
        if (!result.detailedErrors || result.detailedErrors.length === 0) {
          toast({
            title: "Order Placed!",
            description: `Redirecting to your order confirmation.`,
          });
          clearCart();
          router.push(`/order-confirmation?orderIds=${result.orderIds.join(',')}`);
        } else {
          toast({
            title: "Partial Order Failure",
            description: `Successfully placed ${result.orderIds.length} order(s), but some items had issues. See details below.`,
            variant: "default",
          });
          setSubmissionErrors(result.detailedErrors);
        }
      } else {
        toast({
          title: "Order Failed",
          description: result.error || "Could not place your order(s). Please try again or check details below.",
          variant: "destructive",
        });
        if (result.detailedErrors && result.detailedErrors.length > 0) {
          setSubmissionErrors(result.detailedErrors);
        } else if (result.error) {
          setSubmissionErrors([{ message: result.error }]);
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setSubmissionErrors([{ message: "An unexpected client-side error occurred." }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient || cartItems.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  const subTotal = getCartTotal();
  const finalTotal = subTotal + (deliveryFee || 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Checkout</h1>

      {submissionErrors && submissionErrors.length > 0 && (
        <Alert variant="destructive" className="shadow-md">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Order Processing Issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {submissionErrors.map((err, index) => (
                <li key={index}>
                  {err.storeName ? `Store ${err.storeName}: ` : ''}{err.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Order Summary Column */}
        <div className="lg:col-span-1 lg:order-last">
          <Card className="sticky top-20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-start text-sm py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3 flex-grow">
                    <Image
                      src={item.imageUrls[0]}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="rounded aspect-square object-cover border"
                      data-ai-hint="cart item"
                    />
                    <div className="flex-grow">
                      <p className="font-medium">{item.name} (x{item.quantity})</p>
                      <p className="text-xs text-muted-foreground">K {item.price.toFixed(2)} each</p>
                      {item.storeName && (
                        <p className="text-xs text-muted-foreground">From: {item.storeName}</p>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold ml-2 shrink-0">K {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <Separator />
               <div className="flex justify-between text-sm">
                <p>Subtotal</p>
                <p>K {subTotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-sm">
                <p>Delivery Fee</p>
                {isCalculatingFee 
                  ? <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
                  : deliveryFee !== null 
                    ? <p>K {deliveryFee.toFixed(2)}</p> 
                    : <p className="text-muted-foreground">K --.--</p>
                }
              </div>
              {calculationError && <p className="text-xs text-destructive text-right">{calculationError}</p>}
              <Separator />
              <div className="flex justify-between font-bold text-lg pt-2">
                <p>Total</p>
                <p>K {finalTotal.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Details Form Column */}
        <div className="lg:col-span-2 lg:order-first">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Delivery Details</CardTitle>
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
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input id="contactNumber" type="tel" {...register("contactNumber")} className="mt-1" />
                  {errors.contactNumber && <p className="text-sm text-destructive mt-1">{errors.contactNumber.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="location">Delivery Location</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleGetCurrentLocation} disabled={isLocating} className="h-8">
                       {isLocating ? <Loader2 className="animate-spin mr-1"/> : <LocateFixed className="mr-1" />}
                       Use Current Location
                     </Button>
                  </div>
                   <div className="flex items-center gap-2">
                     <Input id="location" {...register("location")} placeholder="e.g., 1.28692, 103.85457" className="mt-1" />
                   </div>
                  {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
                  {locationError && <p className="text-sm text-destructive mt-1">{locationError}</p>}
                  <Accordion type="single" collapsible className="w-full text-sm">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="py-2 text-muted-foreground hover:no-underline text-xs">How to get coordinates from Google Maps</AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground space-y-1 pl-4">
                        <p>1. <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open Google Maps</a> and find your location.</p>
                        <p>2. Right-click (or long-press on mobile) on the location.</p>
                        <p>3. The coordinates will appear. Click them to copy.</p>
                        <p>4. Paste into the input field above.</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border-b-0">
                      <AccordionTrigger className="py-2 text-muted-foreground hover:no-underline text-xs">How to get coordinates from Apple Maps</AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground space-y-1 pl-4">
                        <p>1. <a href="https://maps.apple.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open Apple Maps</a> and drop a pin on your location.</p>
                        <p>2. Scroll down in the location card to find coordinates.</p>
                        <p>3. Long-press the coordinates and select "Copy".</p>
                        <p>4. Paste into the input field above.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                   <Label htmlFor="mobileMoneyNumber">Mobile Money Number</Label>
                    <Input id="mobileMoneyNumber" type="tel" {...register("mobileMoneyNumber")} placeholder="e.g., 2567..." className="mt-1" />
                    {errors.mobileMoneyNumber && <p className="text-sm text-destructive mt-1">{errors.mobileMoneyNumber.message}</p>}
                     <p className="text-xs text-muted-foreground">
                      Payment will be simulated. Enter the number for your Mobile Money payment.
                    </p>
                </div>


                <CardFooter className="p-0 pt-4">
                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || isLocating || isCalculatingFee || deliveryFee === null}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" />
                        Placing Order(s)...
                      </>
                    ) : 'Place Order(s) & Simulate Payment'}
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
