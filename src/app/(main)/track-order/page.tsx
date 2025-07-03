
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchOrderAction } from './actions';
import type { AppOrder, AppOrderItem } from '@/types';
import Image from 'next/image';
import { PackageSearch, AlertCircle, Info, ShoppingBag, UserCircle, MapPin, CalendarDays, Hash, Truck, CreditCard, Loader2, MessageSquareText } from 'lucide-react';
import { format } from 'date-fns';

const OrderItemCard = ({ item }: { item: AppOrderItem }) => (
  <div className="flex items-center gap-4 py-3 border-b last:border-b-0">
    <Image
      src={item.imageUrl || 'https://placehold.co/80x80.png'}
      alt={item.name}
      width={80}
      height={80}
      className="rounded-md aspect-square object-cover border"
      data-ai-hint="order item product"
    />
    <div className="flex-grow">
      <h4 className="font-semibold break-words">{item.name}</h4>
      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
      <p className="text-sm text-muted-foreground">
        Price: K {item.pricePerUnit.toFixed(2)} each
      </p>
    </div>
    <p className="font-semibold text-lg">K {item.totalPrice.toFixed(2)}</p>
  </div>
);

const DisplayOrderCard = ({ order }: { order: AppOrder }) => {
  const subtotal = order.items.reduce((acc, item) => acc + item.totalPrice, 0);

  return (
    <Card className="shadow-xl overflow-hidden mt-6">
      <CardHeader className="bg-muted/30 p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <CardTitle className="text-2xl md:text-3xl text-primary">Order Details</CardTitle>
            <CardDescription className="flex items-center gap-1.5 mt-1">
              <Hash size={14}/> ID: {order.id}
            </CardDescription>
          </div>
          <div className="text-sm sm:text-right">
            <p className="font-semibold text-lg">Status: <span className="text-primary">{order.status}</span></p>
            <p className="text-muted-foreground flex items-center gap-1.5 justify-start sm:justify-end">
              <CalendarDays size={14}/> Ordered on: {format(new Date(order.orderDate), "PPP p")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><UserCircle size={22}/> Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><strong>Name:</strong> {order.customerName}</p>
              <p><strong>Email:</strong> <span className="break-all">{order.customerEmail}</span></p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><MapPin size={22}/>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>{order.shippingAddress}</p>
              {order.shippingLatitude && order.shippingLongitude && (
                 <p className="text-xs text-muted-foreground">
                   Coords: {order.shippingLatitude.toFixed(4)}, {order.shippingLongitude.toFixed(4)}
                 </p>
              )}
            </CardContent>
          </Card>
        </div>

        {order.customer_specifications && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><MessageSquareText size={22}/> Customer Specifications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="whitespace-pre-wrap">{order.customer_specifications}</p>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><ShoppingBag size={22}/>Items Ordered</h3>
          <div className="space-y-3 divide-y divide-border rounded-md border bg-card p-4 shadow-inner">
            {order.items.length > 0 ? (
              order.items.map(item => <OrderItemCard key={item.id} item={item} />)
            ) : (
              <p className="text-muted-foreground py-4 text-center">No items found for this order.</p>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            {order.shippingMethod && <p><Truck size={16} className="inline mr-2 text-muted-foreground"/><strong>Shipping Method:</strong> {order.shippingMethod}</p>}
            {order.paymentMethod && <p><CreditCard size={16} className="inline mr-2 text-muted-foreground"/><strong>Payment Method:</strong> {order.paymentMethod} (Simulated)</p>}
            {order.trackingNumber && (
              <p>
                <PackageSearch size={16} className="inline mr-2 text-muted-foreground"/>
                <strong>
                  {order.status.toLowerCase() === 'delivering' ? 'Delivery Code:' : 'Tracking #:'}
                </strong> {order.trackingNumber}
              </p>
            )}
          </div>
          <div className="space-y-1 sm:text-right">
             <p>Subtotal: <span className="font-medium">K {subtotal.toFixed(2)}</span></p>
             <p>Delivery Cost: <span className="font-medium">K {(order.deliveryCost || 0).toFixed(2)}</span></p>
             <p className="text-lg font-semibold">Order Total: <span className="text-primary">K {order.totalAmount.toFixed(2)}</span></p>
          </div>
        </div>
      </CardContent>
       <CardFooter className="bg-muted/20 p-4 text-center">
         <p className="text-xs text-muted-foreground w-full">
           If you have any questions about your order, please contact support with your Order ID.
         </p>
       </CardFooter>
    </Card>
  );
};


export default function TrackOrderPage() {
  const [searchInput, setSearchInput] = useState('');
  const [orders, setOrders] = useState<AppOrder[] | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrackOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setError("Please enter an Order ID, Email, or Name.");
      setOrders(undefined);
      return;
    }
    setIsLoading(true);
    setError(null);
    setOrders(undefined);

    const result = await fetchOrderAction(searchInput.trim());
    if (result.success && result.orders && result.orders.length > 0) {
      setOrders(result.orders);
    } else {
      setError(result.error || `No orders found matching: ${searchInput.trim()}`);
      setOrders([]);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <PackageSearch className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Track Your Order</h1>
        <p className="text-muted-foreground mt-2">Enter your Order ID, Email, or Name below to see its status and details.</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <form onSubmit={handleTrackOrder} className="space-y-4">
            <div>
              <Label htmlFor="searchInput" className="text-base">Order ID, Email, or Name</Label> 
              <Input
                id="searchInput"
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setError(null); 
                  if (orders !== undefined) setOrders(undefined); 
                }}
                placeholder="Enter Order ID, Email, or Full Name" 
                className="mt-1 text-base"
              />
            </div>
            <Button type="submit" className="w-full text-base py-3" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Tracking...
                </>
              ) : "Track Order"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && !isLoading && (
        <Alert variant="destructive" className="shadow-md">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {orders && orders.length === 0 && !isLoading && !error && ( 
        <Alert variant="default" className="shadow-md bg-card border-primary/20">
          <Info className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary">No Orders Found</AlertTitle>
          <AlertDescription>
            We couldn't find any orders matching your criteria: <strong>{searchInput}</strong>. Please check your input and try again.
          </AlertDescription>
        </Alert>
      )}

      {orders && orders.length > 0 && !isLoading && (
        <div className="space-y-6">
          {orders.map(order => (
            <DisplayOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
