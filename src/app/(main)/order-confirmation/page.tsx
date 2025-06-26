
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle, PackageSearch, Home } from 'lucide-react';
import { Suspense } from 'react';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdsParam = searchParams.get('orderIds');
  const orderIds = orderIdsParam ? orderIdsParam.split(',') : [];

  if (orderIds.length === 0) {
    // Handle case where user navigates to this page directly without order IDs
    return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">No Order Information</CardTitle>
          <CardDescription>It looks like you've landed here without placing an order.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/')}>
            <Home className="mr-2" />
            Go to Homepage
          </Button>
        </CardContent>
      </Card>
    );
  }

  const firstOrderId = orderIds[0];

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6">
      <CheckCircle className="w-24 h-24 text-green-500" />
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Thank You For Your Order!</h1>
      <p className="text-lg text-muted-foreground max-w-xl">
        Your order has been successfully placed. We've sent a confirmation email (simulated) and will notify you once your items have shipped.
      </p>

      <Card className="w-full max-w-md text-left shadow-lg">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Your order{orderIds.length > 1 ? 's were' : ' was'} placed successfully.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-semibold mb-2">Your Order ID{orderIds.length > 1 ? 's' : ''}:</p>
          <div className="space-y-1">
            {orderIds.map(id => (
              <p key={id} className="text-sm font-mono p-2 bg-muted rounded-md break-all">{id}</p>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Link href={`/track-order?search=${firstOrderId}`} passHref className="w-full">
            <Button className="w-full">
              <PackageSearch className="mr-2" />
              Track Your Order(s)
            </Button>
          </Link>
          <Link href="/products" passHref className="w-full">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

// Using Suspense is a good practice when dealing with searchParams
export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div className="text-center p-10">Loading confirmation...</div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}
