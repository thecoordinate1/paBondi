
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
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

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6">
      <CheckCircle className="w-24 h-24 text-green-500" />
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">Checkout Complete!</h1>
      <p className="text-lg text-muted-foreground max-w-xl">
        Your order has been successfully placed. We've sent a confirmation email (simulated) and will notify you once your items have shipped.
      </p>
      
      <div className="pt-6">
          <Link href="/products" passHref>
            <Button size="lg">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Continue Shopping
            </Button>
          </Link>
      </div>
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
