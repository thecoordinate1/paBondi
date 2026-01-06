

"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import { Suspense } from 'react';
import PageWrapper from '@/components/PageWrapper';

import { getOrdersByIdsAction } from './actions';
import { useEffect, useState } from 'react';
import type { AppOrder } from '@/types';
import { Loader2, Copy, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderIdsParam = searchParams.get('orderIds');

  const [orders, setOrders] = useState<AppOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!orderIdsParam) {
        setLoading(false);
        return;
      }

      const ids = orderIdsParam.split(',');
      const result = await getOrdersByIdsAction(ids);

      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || "Failed to load order details.");
      }
      setLoading(false);
    };

    fetchOrders();
  }, [orderIdsParam]);

  // Polling for updates if any order is pending
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    const hasPending = orders.some(o => o.status === 'pending_payment');
    if (!hasPending) return;

    const intervalId = setInterval(async () => {
      if (!orderIdsParam) return;
      // Re-fetch orders
      const ids = orderIdsParam.split(',');
      const result = await getOrdersByIdsAction(ids);
      if (result.success && result.orders) {
        setOrders(result.orders);
        // If all are now paid, we can optionally stop polling or let the effect cleanup handle it on next render
        const stillPending = result.orders.some(o => o.status === 'pending_payment');
        if (!stillPending) {
          toast({
            title: "Payment Confirmed!",
            description: "Your orders have been processed successfully.",
            variant: "default",
          });
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [orders, orderIdsParam, toast]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Retrieving your order details...</p>
      </div>
    );
  }

  if (error || !orders || orders.length === 0) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">Order Lookup Failed</CardTitle>
          <CardDescription>{error || "We couldn't find the details for your order."}</CardDescription>
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

  const isPending = orders.some(o => o.status === 'pending_payment');
  const isFailed = orders.some(o => o.status === 'payment_failed');
  const isOnHold = orders.some(o => o.status === 'on_hold');
  const isAllPaid = orders.every(o => o.status === 'paid_pending_delivery');

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 md:px-0 pb-10">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          {isPending ? (
            <Loader2 className="w-20 h-20 text-yellow-500 animate-spin" />
          ) : isFailed ? (
            <AlertTriangle className="w-20 h-20 text-red-500" />
          ) : isOnHold ? (
            <Loader2 className="w-20 h-20 text-yellow-600 animate-spin" />
          ) : (
            <CheckCircle className="w-20 h-20 text-green-500" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          {isPending
            ? "Payment Initiated"
            : isFailed
              ? "Payment Declined"
              : isOnHold
                ? "Payment Under Review"
                : "Payment Successful!"
          }
        </h1>
        <p className="text-lg text-muted-foreground">
          {isPending
            ? "Please complete the payment on your mobile phone. We are waiting for confirmation..."
            : isFailed
              ? "We could not process your payment. Please try again or contact support."
              : isOnHold
                ? "Your payment is currently being reviewed for security. We will notify you shortly."
                : "Your payment was processed securely via Lenco."
          }
        </p>
      </div>

      {isPending ? (
        <Alert variant="default" className="border-2 border-primary/50 bg-primary/10">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle className="font-bold text-lg">Waiting for Confirmation</AlertTitle>
          <AlertDescription className="text-base mt-2">
            We've sent a request to your mobile money number. Please approve the transaction. This page will update automatically once payment is received.
          </AlertDescription>
        </Alert>
      ) : isFailed ? (
        <Alert variant="destructive" className="border-2 border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold text-lg">Payment Declined</AlertTitle>
          <AlertDescription className="text-base mt-2 flex flex-col gap-2">
            <p>Your mobile money provider declined the transaction. This can happen due to insufficient funds or a timeout.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/checkout')}>Retry Payment</Button>
              <Link href="/" passHref><Button variant="link" size="sm" className="text-red-600">Cancel Order</Button></Link>
            </div>
          </AlertDescription>
        </Alert>
      ) : isOnHold ? (
        <Alert variant="default" className="border-2 border-yellow-500/50 bg-yellow-500/10 text-yellow-800 dark:text-yellow-400">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold text-lg">Transaction Under Review</AlertTitle>
          <AlertDescription className="text-base mt-2">
            For your security, this transaction has been flagged for a standard manual review. You don't need to do anything. We will send you an email once it is cleared.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive" className="border-2 border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold text-lg">IMPORTANT: SAVE YOUR CODES</AlertTitle>
          <AlertDescription className="text-base mt-2">
            Please take a screenshot or write down the <strong>Delivery Code</strong> and <strong>Escrow Transaction ID</strong> for each order below. You will need these to confirm receipt of your delivery.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden border-2 border-primary/10 shadow-lg">
            <CardHeader className="bg-muted/50 border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-primary">{order.storeName}</CardTitle>
                  <CardDescription>
                    Order #{order.id.slice(0, 8).toUpperCase()}
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase">
                      {order.status.replace('_', ' ')}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-muted-foreground">Total to Pay</p>
                  <p className="text-xl font-bold">K {order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid md:grid-cols-2 gap-6">

              {/* CODES SECTION */}
              <div className="space-y-4 bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Security Codes
                </h3>

                <div className="space-y-3">
                  <div className="bg-background p-3 rounded-md border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Delivery Code</p>
                    <div className="flex items-center justify-between">
                      <code className="text-lg font-mono font-bold text-primary">
                        {order.delivery_code ? order.delivery_code : <span className="text-muted-foreground italic text-sm">Waiting for payment...</span>}
                      </code>
                      {order.delivery_code && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(order.delivery_code || "", "Delivery Code")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-md border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Escrow Trans. ID</p>
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono font-bold break-all">{order.escrow_transaction_id || "PENDING"}</code>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(order.escrow_transaction_id || "", "Escrow ID")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILS SECTION */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Delivery To</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{order.shippingAddress}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Items</h3>
                  <ul className="space-y-2">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                        <span className="font-medium">K {(item.pricePerUnit * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-6 text-center">
        <Link href="/products" passHref>
          <Button size="lg" className="font-semibold">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

function OrderConfirmationPageContent() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}

export default function OrderConfirmationPage() {
  return (
    <PageWrapper>
      <OrderConfirmationPageContent />
    </PageWrapper>
  )
}
