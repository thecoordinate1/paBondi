

"use client";

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchOrderAction } from './actions';
import type { AppOrder, AppOrderItem } from '@/types';
import Image from 'next/image';
import { PackageSearch, AlertCircle, Info, ShoppingBag, UserCircle, MapPin, CalendarDays, Truck, CreditCard, Loader2, MessageSquareText, Phone, Store, CheckCircle, Clock, XCircle, Package, RefreshCw, Check } from 'lucide-react';
import { format } from 'date-fns';
import PageWrapper from '@/components/PageWrapper';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const DeliveryTimer = dynamic(() => import('@/components/DeliveryTimer'), { ssr: false });

// --- Helper Functions ---

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

/**
 * Maps order status strings to colors and icons for better visual feedback.
 */
const getOrderStatusDetails = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
        case 'new':
        case 'pending':
            return { label: 'Pending Confirmation', variant: 'outline' as const, icon: Clock };
        case 'processing':
            return { label: 'Processing', variant: 'secondary' as const, icon: RefreshCw };
        case 'ready_for_pickup':
        case 'ready for pickup':
            return { label: 'Ready for Pick-up', variant: 'default' as const, icon: Store };
        case 'delivering':
        case 'shipped':
            return { label: 'In Transit / Delivering', variant: 'default' as const, icon: Truck };
        case 'delivered':
        case 'completed':
            return { label: 'Delivered', variant: 'success' as const, icon: CheckCircle };
        case 'cancelled':
        case 'failed':
            return { label: 'Cancelled / Failed', variant: 'destructive' as const, icon: XCircle };
        default:
            return { label: status, variant: 'secondary' as const, icon: Info };
    }
};

// --- New Component: Order Tracker Steps ---

const OrderStatusTracker = ({ status }: { status: string }) => {
    const steps = [
        { name: 'Order Placed', key: 'new', icon: Package },
        { name: 'Processing', key: 'processing', icon: RefreshCw },
        { name: 'Shipped/Ready', key: 'shipped', icon: Truck },
        { name: 'Delivered', key: 'delivered', icon: Check },
    ];

    const normalizedStatus = status.toLowerCase();
    const currentStepIndex = steps.findIndex(step => normalizedStatus.includes(step.key));

    // Force 'Delivered' status if the final step is reached
    const isActive = (index: number) => {
        if (normalizedStatus.includes('delivered') || normalizedStatus.includes('completed')) {
            return true;
        }
        return index <= currentStepIndex;
    };

    // Handle cancelled/failed outside the normal flow
    if (normalizedStatus.includes('cancelled') || normalizedStatus.includes('failed')) {
        return (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive flex items-center gap-3">
                <XCircle className="h-6 w-6" />
                <p className="font-semibold">Order {normalizedStatus}. The tracking flow is stopped.</p>
            </div>
        );
    }

    return (
        <div className="flex justify-between items-center relative py-4 mb-4">
            {/* Progress Line */}
            <div className="absolute top-1/2 -translate-y-1/2 left-[5%] right-[5%] h-1 bg-muted rounded-full">
                <div
                    className="absolute h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
            </div>

            {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                    <div key={step.name} className="flex flex-col items-center z-10 w-1/4">
                        <div
                            className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                                isActive(index) ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted text-muted-foreground"
                            )}
                        >
                            <StepIcon className="h-5 w-5" />
                        </div>
                        <p
                            className={cn(
                                "text-xs font-medium mt-2 text-center",
                                isActive(index) ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {step.name}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};


// --- Refactored Components ---

const OrderItemCard = ({ item }: { item: AppOrderItem }) => (
    <div className="flex items-center gap-4 py-3 border-b last:border-b-0">
        <Image
            src={item.imageUrl || ''}
            alt={item.name}
            width={64} // Smaller image in list view
            height={64}
            className="rounded-md aspect-square object-cover border"
            data-ai-hint="order item product"
        />
        <div className="flex-grow">
            <h4 className="font-semibold truncate">{item.name}</h4>
            <p className="text-sm text-muted-foreground">Qty: {item.quantity} @ K {item.pricePerUnit.toFixed(2)}</p>
        </div>
        <p className="font-semibold text-lg text-right shrink-0">K {item.totalPrice.toFixed(2)}</p>
    </div>
);

const DisplayOrderCard = ({ order, isCollapsed = false }: { order: AppOrder, isCollapsed?: boolean }) => {
    const subtotal = order.items.reduce((acc, item) => acc + item.totalPrice, 0);
    const storeSlug = slugify(order.storeName);
    const statusDetails = getOrderStatusDetails(order.status);
    const StatusIcon = statusDetails.icon;

    const CardContentLayout = (
        <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
            <OrderStatusTracker status={order.status} />

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-l-4 border-primary/50">
                    <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-primary/80"><UserCircle size={18} /> Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 p-3 pt-0">
                        <p><strong>Name:</strong> {order.customerName}</p>
                        <p><strong>Email:</strong> <span className="break-all">{order.customerEmail}</span></p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-primary/50">
                    <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-primary/80"><MapPin size={18} /> Shipping</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 p-3 pt-0">
                        <p>{order.shippingAddress || 'N/A'}</p>
                        {order.shippingLatitude && order.shippingLongitude && (
                            <p className="text-xs text-muted-foreground">
                                Coords: {order.shippingLatitude.toFixed(4)}, {order.shippingLongitude.toFixed(4)}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {order.customer_specification && (
                <div className="border rounded-md p-3 bg-muted/20">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5 text-primary/80"><MessageSquareText size={16} /> Specifications</h4>
                    <p className="text-sm whitespace-pre-wrap">{order.customer_specification}</p>
                </div>
            )}

            <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><ShoppingBag size={22} />Items Ordered</h3>
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
                    {order.delivery_tier && <p className="mb-1"><Truck size={16} className="inline mr-2 text-muted-foreground" /><strong>Delivery Tier:</strong> {order.delivery_tier}</p>}
                    {order.paymentMethod && <p className="mb-1"><CreditCard size={16} className="inline mr-2 text-muted-foreground" /><strong>Payment:</strong> {order.paymentMethod}</p>}
                    {order.delivery_code && (
                        <p>
                            <PackageSearch size={16} className="inline mr-2 text-muted-foreground" />
                            <strong>Delivery Code:</strong> {order.delivery_code}
                        </p>
                    )}
                </div>
                <div className="space-y-1 sm:text-right font-medium">
                    <p className="text-muted-foreground">Subtotal: <span className="text-foreground">K {subtotal.toFixed(2)}</span></p>
                    <p className="text-muted-foreground">Delivery Cost: <span className="text-foreground">K {(order.deliveryCost || 0).toFixed(2)}</span></p>
                    <p className="text-xl font-bold">Total: <span className="text-primary">K {order.totalAmount.toFixed(2)}</span></p>
                </div>
            </div>
        </CardContent>
    );


    return (
        <Card className="shadow-xl overflow-hidden mt-6 border-2 border-primary/20">
            {/* Header Section - Consistent for both collapsed/expanded */}
            <CardHeader className="bg-primary/5 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <StatusIcon className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold">Order #{order.id}</h2>
                                <Badge variant={statusDetails.variant as 'default'}>{statusDetails.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                                <Store size={14} /> From: {order.storeName}
                            </p>
                        </div>
                    </div>
                    <div className="text-sm sm:text-right space-y-1 shrink-0">
                        <p className="font-semibold text-lg text-primary">K {order.totalAmount.toFixed(2)}</p>
                        <p className="text-muted-foreground flex items-center gap-1.5 justify-start sm:justify-end">
                            <CalendarDays size={14} /> {format(new Date(order.orderDate), "MMM dd, yyyy")}
                        </p>
                        <DeliveryTimer orderDate={order.orderDate} shippingMethod={order.shippingMethod || 'standard'} />
                    </div>
                </div>
            </CardHeader>

            {isCollapsed ? (
                // Use Accordion when multiple orders are displayed
                <Accordion type="single" collapsible>
                    <AccordionItem value={`order-${order.id}`} className="border-t">
                        <AccordionTrigger className="p-4 sm:p-6 text-base font-semibold text-primary hover:no-underline">
                            View Full Details
                        </AccordionTrigger>
                        <AccordionContent className="p-0">
                            {CardContentLayout}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            ) : (
                // Full content when only one order is displayed
                CardContentLayout
            )}

            <CardFooter className="bg-muted/20 p-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t">
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                    Need help? Contact the store with your Order ID.
                </p>
                {order.storeContactPhone && (
                    <a
                        href={`tel:${order.storeContactPhone}`}
                        className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
                    >
                        <Phone size={16} className="mr-2" />
                        Call {order.storeName}
                    </a>
                )}
            </CardFooter>
        </Card>
    );
};


function TrackOrderPageContent() {
    const [searchInput, setSearchInput] = useState('');
    const [orders, setOrders] = useState<AppOrder[] | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTrackOrder = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedInput = searchInput.trim();
        if (!trimmedInput) {
            setError("Please enter an Order ID, Email, or Name.");
            setOrders(undefined);
            return;
        }
        setIsLoading(true);
        setError(null);
        setOrders(undefined);

        const result = await fetchOrderAction(trimmedInput);
        if (result.success && result.orders && result.orders.length > 0) {
            setOrders(result.orders);
        } else {
            setError(result.error || `No orders found matching: ${trimmedInput}`);
            setOrders([]);
        }
        setIsLoading(false);
    };

    const ordersFound = orders && orders.length > 0;
    const multipleOrders = ordersFound && orders.length > 1;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <PackageSearch className="mx-auto h-16 w-16 text-primary mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">Track Your Order</h1>
                <p className="text-muted-foreground mt-2">Enter your Order ID, Email, or Name below to see its status and details.</p>
            </div>

            <Card className="shadow-lg border-primary/10 border">
                <CardContent className="p-4 sm:p-6">
                    <form onSubmit={handleTrackOrder} className="space-y-4">
                        <div>
                            <Label htmlFor="searchInput" className="sr-only">Order Search Term</Label>
                            <Input
                                id="searchInput"
                                type="text"
                                value={searchInput}
                                onChange={(e) => {
                                    setSearchInput(e.target.value);
                                    setError(null);
                                    if (orders !== undefined) setOrders(undefined);
                                }}
                                placeholder="Order ID, Email, or Full Name"
                                className="mt-1 text-base h-12"
                            />
                        </div>
                        <Button type="submit" className="w-full text-base h-12" disabled={isLoading}>
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
                    <AlertTitle>Search Error</AlertTitle>
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

            {ordersFound && !isLoading && (
                <div className="space-y-6">
                    {multipleOrders && (
                        <Alert variant="default" className="bg-primary/5 border-primary/30">
                            <Info className="h-5 w-5 text-primary" />
                            <AlertTitle>Multiple Results Found</AlertTitle>
                            <AlertDescription>
                                We found **{orders.length}** orders matching your search. Click "View Full Details" to expand each one.
                            </AlertDescription>
                        </Alert>
                    )}
                    {orders.map(order => (
                        <DisplayOrderCard key={order.id} order={order} isCollapsed={multipleOrders} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <PageWrapper>
            <TrackOrderPageContent />
        </PageWrapper>
    )
}
