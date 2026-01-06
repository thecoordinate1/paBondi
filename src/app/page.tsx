"use client";
// Force rebuild


import React, { useState, useEffect, useRef } from 'react';
import { getFeaturedProducts, getBestSellingProducts, getBestSellingStores } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import StoreCard from '@/components/StoreCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    MoveRight,
    Verified,
    ShoppingBag,
    ShoppingCart,
    Truck,
    Star,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product, Store } from '@/types';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import ProductFinder from '@/components/ProductFinder';

// Images
import HeroImg1 from '@/images/1.png';
import HeroImg2 from '@/images/2.png';
import HeroImg3 from '@/images/3.png';

// Helper to group products
const groupProductsByCategory = (products: Product[]) => {
    const acc: Record<string, Product[]> = {};
    products.forEach(product => {
        let categories = product.category?.split(',').map(c => c.trim()).filter(Boolean);
        if (!categories || categories.length === 0) {
            categories = ['Other'];
        }
        categories.forEach(category => {
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
        });
    });
    return acc;
};

function HomePageContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
    const [bestSellingStores, setBestSellingStores] = useState<Store[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const [featuredData, bestSellingData, bestSellingStoresData] = await Promise.all([
                    getFeaturedProducts(supabase),
                    getBestSellingProducts(supabase),
                    getBestSellingStores(supabase)
                ]);

                setProducts(featuredData);
                setBestSellingProducts(bestSellingData);
                setBestSellingStores(bestSellingStoresData);

                if (featuredData.length > 0) {
                    setActiveCategory('All');
                }
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();
    }, []);

    const groupedProducts = groupProductsByCategory(products);
    const categories = ['All', ...Object.keys(groupedProducts)];
    const activeProducts = activeCategory === 'All'
        ? products
        : (activeCategory ? groupedProducts[activeCategory] || [] : []);

    const scrollCategories = (direction: 'left' | 'right') => {
        if (categoryScrollRef.current) {
            const scrollAmount = 200;
            if (direction === 'left') {
                categoryScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="w-full flex flex-col">

            {/* Section 1: Hero Carousel */}
            <section className="h-[100dvh] w-full snap-start relative flex flex-col bg-black shrink-0">
                <Carousel className="w-full h-full" opts={{ loop: true }}>
                    <CarouselContent className="h-full ml-0">
                        {/* Slide 1: Hero */}
                        <CarouselItem className="pl-0 h-full w-full relative">
                            <div className="grid grid-rows-3 h-full w-full">
                                <div className="relative w-full h-full">
                                    <Image
                                        src={HeroImg1}
                                        alt="Hero 1"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                <div className="relative w-full h-full">
                                    <Image
                                        src={HeroImg2}
                                        alt="Hero 2"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="relative w-full h-full">
                                    <Image
                                        src={HeroImg3}
                                        alt="Hero 3"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center z-10">
                                <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">Mwaiseni PaBondi</h1>
                                <p className="text-lg md:text-xl mb-8 max-w-2xl text-white/90">Discover the best local products delivered to your doorstep.</p>
                                <Link href="/products">
                                    <Button size="lg" className="rounded-full text-lg px-8 h-12">Start Shopping</Button>
                                </Link>
                                <div className="w-full px-4 flex justify-between items-center max-w-4xl mx-auto text-white/80 text-sm md:text-base font-medium mt-12">
                                    <motion.div
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 1, duration: 0.5 }}
                                        className="flex items-center gap-2"
                                    >
                                        <motion.div
                                            animate={{ x: [0, 10, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                            className="flex items-center gap-2"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                            <span>Swipe right to learn more</span>
                                        </motion.div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ x: 10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 1, duration: 0.5 }}
                                        className="flex items-center gap-2"
                                    >
                                        <motion.div
                                            animate={{ x: [0, -10, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                            className="flex items-center gap-2"
                                        >
                                            <span>Swipe left to see best selling products</span>
                                            <ChevronRight className="w-5 h-5" />
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </div>
                        </CarouselItem>

                        {/* Slide 2: Best Selling Products */}
                        <CarouselItem className="pl-0 h-full w-full relative">
                            <div className="w-full h-full bg-background flex flex-col pt-20 pb-10 px-4 md:px-8">
                                <div className="max-w-screen-xl mx-auto w-full h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-6 shrink-0">
                                        <div>
                                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Best Selling</h2>
                                            <p className="text-muted-foreground mt-2">Our most popular products this week</p>
                                        </div>
                                        <Link href="/products?sort=best-selling">
                                            <Button variant="outline" className="hidden md:flex rounded-full">
                                                View All <ArrowRight className="ml-2 w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto pb-20 flex-grow no-scrollbar">
                                        {bestSellingProducts.slice(0, 8).map((product, index) => (
                                            <motion.div
                                                key={product.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <ProductCard product={product} className="h-full" />
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="md:hidden flex justify-center mt-4 shrink-0">
                                        <Link href="/products?sort=best-selling">
                                            <Button variant="outline" className="rounded-full w-full">
                                                View All Best Sellers
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>

                        {/* Slide 3: Best Selling Stores */}
                        <CarouselItem className="pl-0 h-full w-full relative">
                            <div className="w-full h-full bg-background flex flex-col pt-20 pb-10 px-4 md:px-8">
                                <div className="max-w-screen-xl mx-auto w-full h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-6 shrink-0">
                                        <div>
                                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Top Stores</h2>
                                            <p className="text-muted-foreground mt-2">Discover the most popular local businesses</p>
                                        </div>
                                        <Link href="/stores">
                                            <Button variant="outline" className="hidden md:flex rounded-full">
                                                View All <ArrowRight className="ml-2 w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20 flex-grow no-scrollbar">
                                        {bestSellingStores.map((store, index) => (
                                            <motion.div
                                                key={store.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <StoreCard store={store} />
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="md:hidden flex justify-center mt-4 shrink-0">
                                        <Link href="/stores">
                                            <Button variant="outline" className="rounded-full w-full">
                                                View All Stores
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>

                        {/* Slide 4: About / Learn More */}
                        <CarouselItem className="pl-0 h-full w-full relative">
                            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
                                {/* Decorative background elements */}
                                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
                                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
                                </div>

                                <div className="max-w-4xl w-full z-10 flex flex-col items-center text-center">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Redefining Local Shopping</h2>
                                        <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
                                            Pabondi connects you directly with the city's best independent creators and boutiques.
                                        </p>
                                    </motion.div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-12">
                                        {[
                                            { icon: ShoppingBag, title: "Curated Selection", desc: "Hand-picked items from top local brands." },
                                            { icon: Verified, title: "100% Authentic", desc: "Direct from creators, guaranteed quality." },
                                            { icon: Truck, title: "Fast Delivery", desc: "Same-day delivery within the city." }
                                        ].map((item, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                                                className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl flex flex-col items-center hover:bg-white/10 transition-colors"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-white">
                                                    <item.icon className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                                <p className="text-sm text-zinc-400">{item.desc}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <Link href="/about">
                                            <Button variant="outline" size="lg" className="rounded-full border-white/20 hover:bg-white hover:text-black text-white bg-transparent h-12 px-8">
                                                Learn More About Us
                                            </Button>
                                        </Link>
                                    </motion.div>
                                </div>

                                {/* Navigation Hint */}
                                <div className="absolute bottom-24 md:bottom-10 left-0 w-full flex justify-center md:hidden">
                                    <motion.div
                                        animate={{ x: [0, 10, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                        className="flex items-center gap-2 text-white/50 text-sm"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>Back to Home</span>
                                    </motion.div>
                                </div>
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                </Carousel>
            </section>

            {/* Section 2: Product Finder */}
            <section className="h-[100dvh] w-full snap-start relative flex flex-col items-center justify-start pt-28 bg-muted/5 shrink-0">
                <div className="container mx-auto px-4 flex flex-col items-center justify-center">
                    <div className="w-full max-w-sm">
                        <ProductFinder />
                    </div>
                </div>
            </section>

            {/* Section 3: Fresh Drops */}
            <section className="min-h-[100dvh] w-full snap-start relative bg-background pt-20 pb-10 shrink-0">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <header className="w-full px-4 py-4 sm:py-6 transition-all sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
                        <div className="max-w-screen-xl mx-auto w-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                        Fresh Drops
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Curated from {categories.length} local collections
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full border-dashed border-primary/30 hover:border-primary text-xs h-8 px-4 hidden sm:flex"
                                        asChild
                                    >
                                        <Link href="/products">View All <ArrowRight className="ml-1 w-3 h-3" /></Link>
                                    </Button>

                                    <div className="h-6 w-[1px] bg-border mx-2 shrink-0 hidden sm:block" />

                                    {/* Mobile Dropdown */}
                                    <div className="md:hidden w-[140px]">
                                        <Select value={activeCategory} onValueChange={setActiveCategory}>
                                            <SelectTrigger className="h-8 text-xs rounded-full bg-background border-border">
                                                <SelectValue placeholder="Select Drop" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat} value={cat} className="text-xs">
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Desktop Pills */}
                                    <div className="hidden md:flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full shrink-0"
                                            onClick={() => scrollCategories('left')}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>

                                        <div
                                            ref={categoryScrollRef}
                                            className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mask-linear-fade max-w-[400px] lg:max-w-[600px] scroll-smooth"
                                        >
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setActiveCategory(cat)}
                                                    className={cn(
                                                        "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border shrink-0",
                                                        activeCategory === cat
                                                            ? "bg-foreground text-background border-foreground shadow-md"
                                                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                                                    )}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full shrink-0"
                                            onClick={() => scrollCategories('right')}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="w-full px-4 py-8">
                        <div className="max-w-screen-xl mx-auto w-full">
                            {activeCategory && activeProducts.length > 0 ? (
                                <div className="group">
                                    <div className="flex items-end justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                                                {activeCategory}
                                            </h3>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                                                {activeProducts.length}
                                            </span>
                                        </div>
                                        <Link href={`/products?category=${encodeURIComponent(activeCategory)}`} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 opacity-60 hover:opacity-100">
                                            See collection <ArrowRight size={14} />
                                        </Link>
                                    </div>

                                    {activeCategory === categories[0] ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(280px,auto)]">
                                            {activeProducts[0] && (
                                                <div className="sm:col-span-2 sm:row-span-2 relative min-h-[400px] sm:min-h-full rounded-2xl overflow-hidden group/card shadow-sm border border-border/50">
                                                    <div className="absolute inset-0 z-10 p-6 sm:p-8 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent text-white">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Top Pick</span>
                                                            <div className="flex text-yellow-400">
                                                                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                                            </div>
                                                        </div>
                                                        <h4 className="text-2xl sm:text-3xl font-bold truncate mb-2">{activeProducts[0].name}</h4>
                                                        <p className="text-white/80 line-clamp-2 text-sm sm:text-base mb-6 max-w-md">{activeProducts[0].description}</p>
                                                        <Link href={`/products/${activeProducts[0].id}`}>
                                                            <Button size="lg" className="bg-white text-black hover:bg-white/90 w-full sm:w-auto font-semibold rounded-full">
                                                                Shop Now <ArrowRight size={16} className="ml-2" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                    <Image
                                                        src={activeProducts[0].imageUrls?.[0] || 'https://picsum.photos/800/800'}
                                                        alt={activeProducts[0].name}
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, 50vw"
                                                        className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                                                    />
                                                </div>
                                            )}

                                            {activeProducts.slice(1, 5).map(product => (
                                                <div key={product.id} className="h-full min-h-[280px]">
                                                    <ProductCard product={product} />
                                                </div>
                                            ))}

                                            {activeProducts.length > 5 && (
                                                <Link
                                                    href={`/products?category=${encodeURIComponent(activeCategory)}`}
                                                    className="flex flex-col items-center justify-center h-full min-h-[200px] rounded-2xl border-2 border-dashed border-muted bg-secondary/10 hover:bg-secondary/30 transition-all gap-3 text-muted-foreground hover:text-primary group/more"
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-background border shadow-sm flex items-center justify-center group-hover/more:scale-110 transition-transform">
                                                        <ArrowRight size={20} />
                                                    </div>
                                                    <span className="font-medium">View all {activeCategory}</span>
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Carousel opts={{ align: "start", loop: false }} className="w-full">
                                                <CarouselContent className="-ml-2 md:-ml-4 pb-4">
                                                    {activeProducts.map(product => (
                                                        <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-[45%] md:basis-[30%] lg:basis-[22%]">
                                                            <ProductCard product={product} />
                                                        </CarouselItem>
                                                    ))}
                                                    <CarouselItem className="pl-2 md:pl-4 basis-[40%] sm:basis-[25%] md:basis-[20%] lg:basis-[15%]">
                                                        <Link href={`/products?category=${encodeURIComponent(activeCategory)}`} className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-xl border border-border bg-card/50 hover:bg-card hover:shadow-lg transition-all gap-2 group/more">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover/more:bg-primary group-hover/more:text-white transition-colors">
                                                                <ArrowRight className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-sm font-medium text-muted-foreground group-hover/more:text-foreground">View all</span>
                                                        </Link>
                                                    </CarouselItem>
                                                </CarouselContent>
                                                <div className="hidden sm:block absolute -top-12 right-0">
                                                    <div className="flex gap-1">
                                                        <CarouselPrevious className="static translate-y-0 h-8 w-8 border-border hover:bg-primary hover:text-white hover:border-primary" />
                                                        <CarouselNext className="static translate-y-0 h-8 w-8 border-border hover:bg-primary hover:text-white hover:border-primary" />
                                                    </div>
                                                </div>
                                            </Carousel>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-card/50 rounded-2xl border border-dashed">
                                    <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-semibold text-muted-foreground">No featured products found</h3>
                                    <p className="text-sm text-muted-foreground/60">Check back later for new arrivals.</p>
                                </div>
                            )}

                            <div className="w-full pt-4 flex justify-center">
                                <Link href="/products">
                                    <Button size="lg" variant="outline" className="rounded-full px-8 h-12 border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary text-base">
                                        Explore Full Marketplace
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function HomePage() {
    return (
        <HomePageContent />
    )
}