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
import type { OrderFormData, PlaceOrderResult, DeliveryMethod, Coupon } from '@/types';
import { placeOrder, calculateDeliveryCostAction, verifyCouponAction } from './actions';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, LocateFixed, Loader2, Truck, Package, Rocket, Store, User, Map, DollarSign } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';

const CheckoutMap = dynamic(() => import('@/components/CheckoutMap'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted flex items-center justify-center rounded-md">Loading Map...</div>
});

// --- Delivery Method Definitions (with Icons) ---
const deliveryMethods: { id: DeliveryMethod, label: string, description: string, icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'pickup', label: 'Store Pick-up', description: 'Collect your order directly from the store (usually free).', icon: Store },
  { id: 'economy', label: 'Economy', description: '5-7 business days. Cheapest delivery option.', icon: Package },
  { id: 'normal', label: 'Standard', description: '2-4 business days. Reliable and balanced option.', icon: Truck },
  { id: 'express', label: 'Express', description: '1-2 business days. Fastest possible door-to-door delivery.', icon: Rocket },
];

// --- Zod Validation Schema ---
const checkoutFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  contactNumber: z.string().min(10, { message: "A valid contact number is required (e.g 077/076/075-xxxxxxx)" }),
  location: z.string().min(10, { message: "Please provide location coordinates or use current location." }).refine(val => /^-?\d{1,3}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/.test(val.trim()), {
    message: "Invalid format. Please use 'latitude, longitude'."
  }),
  mobileMoneyNumber: z.string().min(9, { message: "A valid mobile money number is required." }),
  customer_specification: z.string().max(500, "Specifications cannot exceed 500 characters.").optional(),
  deliveryMethod: z.enum(['pickup', 'economy', 'normal', 'express']),
});


function CheckoutPageContent() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  // State Management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [submissionErrors, setSubmissionErrors] = useState<{ storeId?: string; storeName?: string; message: string }[] | null>(null);
  const [deliveryCosts, setDeliveryCosts] = useState<{ [key in DeliveryMethod]?: number } | null>(null);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [costCalculationError, setCostCalculationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // --- Coupon Logic ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsVerifyingCoupon(true);
    setCouponError(null);

    // Check if already applied
    if (appliedCoupons.some(c => c.code === couponCode.trim())) {
      setCouponError("This coupon is already applied.");
      setIsVerifyingCoupon(false);
      return;
    }

    const uniqueStoreIds = [...new Set(cartItems.map(item => item.storeId))];
    const result = await verifyCouponAction(couponCode.trim(), uniqueStoreIds);

    if (result.success && result.coupon) {
      // Check if we already have a coupon for this store
      const existingStoreCouponIndex = appliedCoupons.findIndex(c => c.storeId === result.coupon!.storeId);

      if (existingStoreCouponIndex >= 0) {
        // Replace existing coupon for that store? Or warn? 
        // Let's replace it for better UX
        const newCoupons = [...appliedCoupons];
        newCoupons[existingStoreCouponIndex] = result.coupon;
        setAppliedCoupons(newCoupons);
        toast({
          title: "Coupon Updated",
          description: `Replaced previous coupon for this store with ${result.coupon.code}`,
        });
      } else {
        setAppliedCoupons(prev => [...prev, result.coupon!]);
        toast({
          title: "Coupon Applied!",
          description: `Discount applied to items from correct store.`,
        });
      }
      setCouponCode('');
    } else {
      setCouponError(result.error || "Invalid coupon.");
    }
    setIsVerifyingCoupon(false);
  };

  const handleRemoveCoupon = (code: string) => {
    setAppliedCoupons(prev => prev.filter(c => c.code !== code));
  };

  // Initial Load and Cart Check
  useEffect(() => {
    setIsClient(true);
    if (cartItems.length === 0 && isClient && !isSuccess) {
      toast({
        title: "Your cart is empty",
        description: "Please add items to your cart before proceeding to checkout.",
        variant: "destructive",
      });
      router.push('/cart');
    }
  }, [cartItems, router, toast, isClient, isSuccess]);

  // Form Hook Setup
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<OrderFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      deliveryMethod: 'normal',
    }
  });

  const userLocation = watch('location');
  const selectedDeliveryMethod = watch('deliveryMethod');

  // --- Delivery Cost Calculation Logic ---
  const handleCalculateCost = useCallback(async (location: string) => {
    if (cartItems.length === 0) return;
    setIsCalculatingCost(true);
    setCostCalculationError(null);
    setDeliveryCosts(null);
    try {
      const result = await calculateDeliveryCostAction(location, cartItems);
      if (result.success && result.costsByMethod) {
        setDeliveryCosts(result.costsByMethod);
      } else {
        setCostCalculationError(result.error || "Could not calculate delivery cost. Please ensure store information is complete.");
        setDeliveryCosts(null);
      }
    } catch (e) {
      setCostCalculationError("An error occurred while calculating the cost.");
      setDeliveryCosts(null);
    } finally {
      setIsCalculatingCost(false);
    }
  }, [cartItems]);

  // Trigger cost calculation on location/method change (Debounced effect)
  useEffect(() => {
    const isLocationValid = checkoutFormSchema.shape.location.safeParse(userLocation).success;
    if (isLocationValid && selectedDeliveryMethod !== 'pickup') {
      const handler = setTimeout(() => {
        handleCalculateCost(userLocation);
      }, 500);
      return () => clearTimeout(handler);
    } else if (selectedDeliveryMethod === 'pickup') {
      // Ensure pickup cost is always available and zero
      setDeliveryCosts(prev => ({ ...prev, pickup: 0 }));
      setCostCalculationError(null);
    } else {
      // Clear costs if location is invalid and not pickup
      setDeliveryCosts(prev => (prev ? { pickup: prev.pickup } : null));
    }
  }, [userLocation, handleCalculateCost, selectedDeliveryMethod]);

  // --- Geolocation Logic ---
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

  // --- Form Submission Action ---
  const onSubmit: SubmitHandler<OrderFormData> = async (data) => {
    const currentDeliveryCost = deliveryCosts?.[data.deliveryMethod];
    if (currentDeliveryCost === undefined) {
      toast({
        title: "Delivery Cost Missing",
        description: "Please provide a valid location and select a delivery method.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setSubmissionErrors(null);
    try {
      const result: PlaceOrderResult = await placeOrder(data, cartItems, appliedCoupons);
      if (result.success && result.orderIds && result.orderIds.length > 0) {
        if (!result.detailedErrors || result.detailedErrors.length === 0) {
          toast({
            title: "Payment Initiated!",
            description: `Please check your phone to complete the transaction. Redirecting...`,
          });
          setIsSuccess(true);
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

  // --- Loading / Empty Cart Check ---
  if (!isClient || cartItems.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="mr-2 animate-spin h-6 w-6 text-primary" />
        <p className="text-lg text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  // --- Price Calculations ---
  const subTotal = getCartTotal();
  const serviceFee = 20; // Fixed K20 service fee
  const currentDeliveryCost = deliveryCosts?.[selectedDeliveryMethod] ?? 0;

  // Calculate total discount
  const totalDiscount = appliedCoupons.reduce((total, coupon) => {
    // Find items fro this store
    const storeItems = cartItems.filter(item => item.storeId === coupon.storeId);
    const storeSubtotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (storeSubtotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }
    return total + Math.min(discount, storeSubtotal);
  }, 0);

  const finalTotal = Math.max(0, subTotal + serviceFee + currentDeliveryCost - totalDiscount);
  const isLocationRequired = selectedDeliveryMethod !== 'pickup';

  // --- Helper for Step Titles (Enhancement) ---
  const renderStepTitle = (step: number, title: string, Icon: React.ComponentType<{ className?: string }>) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
        {step}
      </div>
      <h2 className="text-2xl font-bold text-foreground flex items-center">
        <Icon className="mr-2 h-6 w-6 text-primary/80 hidden sm:block" />
        {title}
      </h2>
    </div>
  );

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-extrabold text-foreground border-b pb-4">Secure Checkout</h1>

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
        {/* --- RIGHT COLUMN: ORDER SUMMARY (Sticky) --- */}
        <div className="lg:col-span-1 lg:order-last">
          <Card className="sticky top-20 shadow-xl border-2 border-primary/20">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-2xl">Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">

              {/* Item List Accordion */}
              <Accordion type="single" collapsible defaultValue="items">
                <AccordionItem value="items" className="border-b-0">
                  <AccordionTrigger className="text-base font-semibold py-2 hover:no-underline">
                    Items ({cartItems.length})
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-b-0">
                        <div className="flex items-center gap-3 flex-grow">
                          <Image
                            src={item.imageUrls[0]}
                            alt={item.name}
                            width={32}
                            height={32}
                            className="rounded aspect-square object-cover border"
                            data-ai-hint="cart item"
                          />
                          <div className="flex-grow">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-semibold ml-2 shrink-0">K {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-base text-muted-foreground">
                  <p>Subtotal</p>
                  <p className="font-medium text-foreground">K {subTotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-base text-muted-foreground">
                  <p>Service Fee</p>
                  <p className="font-medium text-foreground">K {serviceFee.toFixed(2)}</p>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-base text-green-600">
                    <p>Discount</p>
                    <p className="font-medium">-K {totalDiscount.toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between text-base">
                  <p className="text-muted-foreground">Delivery ({selectedDeliveryMethod === 'pickup' ? 'Pick-up' : selectedDeliveryMethod})</p>
                  {isCalculatingCost && isLocationRequired
                    ? <Loader2 className="animate-spin h-4 w-4 text-primary" />
                    : <p className={cn("font-medium", currentDeliveryCost > 0 ? "text-foreground" : "text-green-600")}>
                      K {currentDeliveryCost.toFixed(2)}
                    </p>
                  }
                </div>
                {costCalculationError && <p className="text-xs text-destructive text-right">{costCalculationError}</p>}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-xl pt-2">
                <p>Order Total</p>
                <p className="text-primary">K {finalTotal.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- LEFT COLUMN: CHECKOUT FORM (Steps) --- */}
        <div className="lg:col-span-2 lg:order-first">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* --- STEP 1: CONTACT INFORMATION --- */}
            <Card className="shadow-xl">
              <CardHeader>
                {renderStepTitle(1, "Contact Information", User)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register("name")} className="mt-1" />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
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
                </div>
              </CardContent>
            </Card>

            {/* --- STEP 2: DELIVERY & LOCATION --- */}
            <Card className="shadow-xl">
              <CardHeader>
                {renderStepTitle(2, "Delivery Options", Truck)}
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Select Delivery Method</Label>
                  <RadioGroup
                    defaultValue={selectedDeliveryMethod}
                    onValueChange={(value: DeliveryMethod) => setValue('deliveryMethod', value, { shouldValidate: true })}
                    className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {deliveryMethods.map((method) => {
                      const MethodIcon = method.icon;
                      return (
                        <Label key={method.id} htmlFor={method.id} className={cn(
                          "flex flex-col items-start p-4 rounded-lg border-2 cursor-pointer transition-all",
                          selectedDeliveryMethod === method.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
                        )}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={method.id} id={method.id} className="hidden" />
                              <MethodIcon className={cn("h-6 w-6 shrink-0", selectedDeliveryMethod === method.id ? "text-primary" : "text-muted-foreground")} />
                              <span className="font-semibold text-base">{method.label}</span>
                            </div>
                            <p className={cn("font-bold text-sm", selectedDeliveryMethod === method.id ? "text-primary" : "text-foreground")}>
                              {method.id === 'pickup'
                                ? 'FREE'
                                : isCalculatingCost
                                  ? <Loader2 size={16} className="animate-spin text-primary" />
                                  : deliveryCosts && deliveryCosts[method.id] !== undefined
                                    ? `K ${deliveryCosts[method.id]?.toFixed(2)}`
                                    : `K --.--`
                              }
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 pl-9">{method.description}</p>
                        </Label>
                      )
                    })}
                  </RadioGroup>
                </div>


                {isLocationRequired && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="location" className="flex items-center gap-1 font-semibold">
                        <Map className="h-4 w-4 text-muted-foreground" /> Delivery Location (GPS Coordinates)
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleGetCurrentLocation} disabled={isLocating} className="h-8">
                        {isLocating ? <Loader2 className="animate-spin mr-1" /> : <LocateFixed className="mr-1" />}
                        Use Current Location
                      </Button>
                    </div>
                    <Input id="location" {...register("location")} placeholder="e.g., -15.4167, 28.2833 (Latitude, Longitude)" className="mt-1" />
                    {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
                    {locationError && <p className="text-sm text-destructive mt-1">{locationError}</p>}

                    <CheckoutMap
                      location={watch('location')}
                      onLocationChange={(lat, lng) => {
                        setValue('location', `${lat}, ${lng}`, { shouldValidate: true });
                      }}
                    />

                    <Accordion type="single" collapsible className="w-full text-sm">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="py-2 text-muted-foreground hover:no-underline text-xs">How to get coordinates</AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground space-y-1 pl-4">
                          <p>1. <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open Google Maps</a> and find your exact delivery point.</p>
                          <p>2. Right-click (or long-press on mobile) on the spot to drop a pin.</p>
                          <p>3. The coordinates will appear in a small box/pop-up. Click them to copy.</p>
                          <p>4. Paste into the **Delivery Location** field above.</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* --- STEP 3: PAYMENT & COUPONS --- */}
            <Card className="shadow-xl">
              <CardHeader>
                {renderStepTitle(3, "Payment & Review", DollarSign)}
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Coupon Section */}
                <div className="space-y-2 pb-4 border-b">
                  <Label htmlFor="couponCode" className="font-semibold">Discount Coupon</Label>
                  <div className="flex gap-2">
                    <Input
                      id="couponCode"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={isVerifyingCoupon}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || isVerifyingCoupon}
                    >
                      {isVerifyingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : "Apply"}
                    </Button>
                  </div>
                  {couponError && <p className="text-sm text-destructive mt-1">{couponError}</p>}

                  {appliedCoupons.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {appliedCoupons.map(coupon => (
                        <div key={coupon.code} className="flex justify-between items-center text-sm bg-primary/10 p-2 rounded text-primary">
                          <span>Applied: <strong>{coupon.code}</strong> {coupon.discountType === 'percentage' ? `(-${coupon.discountValue}%)` : `(-K ${coupon.discountValue})`}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-transparent text-primary hover:text-destructive"
                            onClick={() => handleRemoveCoupon(coupon.code)}
                          >
                            &times;
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                <div className="space-y-2">
                  <Label htmlFor="mobileMoneyNumber" className="font-semibold">Mobile Money Number for Payment</Label>
                  <Input id="mobileMoneyNumber" type="tel" {...register("mobileMoneyNumber")} placeholder="e.g., 2567..." className="mt-1" />
                  {errors.mobileMoneyNumber && <p className="text-sm text-destructive mt-1">{errors.mobileMoneyNumber.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    Payment will be **simulated**. Enter the number you wish to use for the mobile money transaction.
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="customer_specification" className="font-semibold">Order Specifications (Optional)</Label>
                  <Textarea
                    id="customer_specification"
                    {...register("customer_specification")}
                    className="mt-1"
                    placeholder="e.g., Please call upon arrival, pack items separately, specific delivery instructions..."
                    rows={3}
                  />
                  {errors.customer_specification && <p className="text-sm text-destructive mt-1">{errors.customer_specification.message}</p>}
                </div>

                <CardFooter className="p-0 pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-lg font-bold"
                    disabled={isSubmitting || isLocating || (isCalculatingCost && isLocationRequired) || (deliveryCosts?.[selectedDeliveryMethod] === undefined)}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 animate-spin h-5 w-5" />
                        Placing Order(s)...
                      </>
                    ) : (
                      <>
                        Place Order & Initiate Payment K {finalTotal.toFixed(2)}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}


export default function CheckoutPage() {
  return (
    <PageWrapper>
      <CheckoutPageContent />
    </PageWrapper>
  )
}

