"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef } from 'react';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Eye, Store, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
// 💡 IMPORTANT: Import the external slugify function here
import { slugify } from '@/lib/utils/slugify'; 

interface ProductCardProps {
  product: Product & { 
    isNew?: boolean; 
    onSale?: number;
  };
  className?: string;
}

const ProductCard = ({ product, className }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0); 
  const lowStockThreshold = 5;
  
  // Use the imported slugify function
  const storeSlug = product.storeName ? slugify(product.storeName) : product.storeId;
  
  // --- Swipe Functionality Refs ---
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const minSwipeDistance = 50; 
  // --------------------------------

  const imageUrls = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls 
    : []; 
  const totalImages = imageUrls.length;

  const isOutOfStock = product.stockCount !== undefined && product.stockCount === 0;
  const isLowStock = !isOutOfStock && product.stockCount !== undefined && product.stockCount <= lowStockThreshold;
  
  const isNew = product.isNew === true;
  const hasSale = product.onSale && product.onSale > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    addToCart(product);
  };
  
  // --- Image Navigation Logic ---
  const goToImage = (index: number) => {
    if (index >= 0 && index < totalImages) {
        setActiveImageIndex(index);
    }
  };

  const handlePrevImage = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex((prevIndex) => (prevIndex - 1 + totalImages) % totalImages);
  };

  const handleNextImage = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex((prevIndex) => (prevIndex + 1) % totalImages);
  };
  // ------------------------------

  // --- Touch Swipe Handlers ---
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = 0; 
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe) {
      if (distance > 0) {
        // Swiped left (show next image)
        handleNextImage(e);
      } else {
        // Swiped right (show previous image)
        handlePrevImage(e);
      }
    }
  };
  // --------------------------

  return (
    <div 
      className={cn(
        "group relative flex flex-col h-full bg-card rounded-2xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden",
        className
      )}
    >
      
      {/* ====================================================================
        --- IMAGE SECTION (Swiping, Badges, & Actions) ---
        ====================================================================
      */}
      <div 
        className="relative aspect-square overflow-hidden bg-secondary/20"
        // Add touch handlers for mobile swiping
        onTouchStart={totalImages > 1 ? onTouchStart : undefined}
        onTouchMove={totalImages > 1 ? onTouchMove : undefined}
        onTouchEnd={totalImages > 1 ? onTouchEnd : undefined}
      >
        {/* Full-size link area for product details */}
        <Link href={`/products/${product.id}`} className="absolute inset-0 block z-10" aria-label={`View details for ${product.name}`}/>

        {/* BADGES CONTAINER (High Z-index) */}
        <div className="absolute inset-0 z-30 pointer-events-none">
            
            {/* TOP LEFT: PROMOTIONAL BADGES */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {isNew && (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-full px-3 py-1 text-xs uppercase font-bold pointer-events-auto">
                        New Arrival
                    </Badge>
                )}
                {hasSale && (
                     <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-lg rounded-full px-3 py-1 text-xs uppercase font-bold pointer-events-auto">
                        {product.onSale}% OFF
                    </Badge>
                )}
            </div>

            {/* TOP RIGHT: STOCK BADGES */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                {isOutOfStock && (
                    <Badge variant="destructive" className="bg-red-500/90 backdrop-blur-sm shadow-sm pointer-events-auto">
                        Sold Out
                    </Badge>
                )}
                {isLowStock && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 shadow-sm pointer-events-auto">
                        Only {product.stockCount} left
                    </Badge>
                )}
            </div>
        </div>

        {/* --- DYNAMIC IMAGE DISPLAY --- */}
        {imageUrls.length > 0 ? (
          <Image
            src={imageUrls[activeImageIndex]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 ease-in-out z-0" 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <Package className="text-muted-foreground w-1/4 h-1/4" />
          </div>
        )}
        
        {/* --- IMAGE NAVIGATION CONTROLS (Larger Click Areas) --- */}
        {totalImages > 1 && (
            <>
                {/* Previous Image Click Area (Full Height Strip) */}
                <button 
                    onClick={handlePrevImage} 
                    className="absolute left-0 top-0 bottom-0 w-1/4 group-hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-40 cursor-pointer"
                    aria-label="Previous image"
                >
                    <ChevronLeft size={24} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 drop-shadow-md" />
                </button>
                
                {/* Next Image Click Area (Full Height Strip) */}
                <button 
                    onClick={handleNextImage} 
                    className="absolute right-0 top-0 bottom-0 w-1/4 group-hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-40 cursor-pointer"
                    aria-label="Next image"
                >
                    <ChevronRight size={24} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 drop-shadow-md" />
                </button>


                {/* Navigation Dots (Visible for both desktop/mobile) */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 z-40 pointer-events-auto">
                    {imageUrls.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToImage(index); }}
                            className={cn(
                                "h-1 w-2 rounded-full transition-all duration-300 pointer-events-auto",
                                index === activeImageIndex ? "bg-white w-5" : "bg-white/50 w-2.5 hover:bg-white/80"
                            )}
                            aria-label={`View image ${index + 1}`}
                        />
                    ))}
                </div>
            </>
        )}
        

        {/* Quick Actions overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20 hidden sm:flex justify-center bg-gradient-to-t from-black/40 to-transparent">
             <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full shadow-lg bg-white/90 hover:bg-white text-black font-medium backdrop-blur-md pointer-events-auto"
             >
                <Eye size={16} className="mr-2" /> Quick View
             </Button>
        </div>
      </div>
      
      {/* ==================================================
        --- CONTENT SECTION (REVIEWS REMOVED) ---
        ==================================================
      */}
      <div className="flex flex-col flex-grow p-4 space-y-3">
        
        {/* Title & Store */}
        <div>
            <Link href={`/stores/${storeSlug}`} className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors mb-2 bg-secondary/50 px-2 py-1 rounded-md">
                <Store size={12} className="mr-1.5" />
                {product.storeName || 'Verified Store'}
            </Link>
            <Link href={`/products/${product.id}`} className="block group/title">
                <h3 className="font-semibold text-base sm:text-lg leading-tight text-foreground group-hover/title:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                </h3>
            </Link>
        </div>

        {/* Price & Action */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/40">
            <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">
                    K {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {hasSale && (
                    <span className="text-sm text-muted-foreground line-through opacity-70">
                         K {(product.price / (1 - product.onSale! / 100)).toFixed(2)}
                    </span>
                )}
            </div>

            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button 
                            onClick={handleAddToCart}
                            size="icon"
                            disabled={isOutOfStock}
                            className={cn(
                                "rounded-full h-10 w-10 transition-all duration-300 shadow-sm",
                                isOutOfStock ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                            )}
                        >
                            {isOutOfStock ? <AlertCircle size={18} /> : <ShoppingCart size={18} />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        <p>{isOutOfStock ? "Unavailable" : "Add to Cart"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
