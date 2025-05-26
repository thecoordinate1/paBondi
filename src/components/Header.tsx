
"use client";

import Link from 'next/link';
import { ShoppingCart, Store, Package, Menu, PackageSearch } from 'lucide-react'; // Added PackageSearch
import Logo from './Logo';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import React, { useState, useEffect } from 'react';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
  isSheetLink?: boolean;
}

const NavLink = ({ href, children, icon, onClick, isSheetLink = false }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Button
      asChild
      variant="ghost"
      onClick={onClick}
      className={cn(
        "text-sm font-medium",
        isSheetLink ? "w-full justify-start py-3 text-base h-auto" : "h-10",
        isActive
          ? (isSheetLink ? "bg-primary/10 text-primary font-semibold" : "text-primary")
          : "text-foreground/70 hover:text-foreground hover:bg-primary/5",
        isSheetLink ? "px-4" : ""
      )}
    >
      <Link href={href}>
        {icon}
        <span className="ml-2">{children}</span>
      </Link>
    </Button>
  );
};

const CartButtonContent = ({ itemCount, hasMounted }: { itemCount: number; hasMounted: boolean }) => (
  <>
    <ShoppingCart size={20} />
    <span className="sr-only">Shopping Cart</span>
    {hasMounted && itemCount > 0 && (
      <Badge variant="destructive" className="absolute -top-1 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
        {itemCount}
      </Badge>
    )}
  </>
);

const Header = () => {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const currentLayoutIsMobile = useIsMobile(); // Keep the hook call
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname, mobileMenuOpen]); // Added mobileMenuOpen to dependency array

  const navLinksContent = (isSheet = false) => (
    <>
      <NavLink href="/stores" icon={<Store size={18} />} onClick={isSheet ? () => setMobileMenuOpen(false) : undefined} isSheetLink={isSheet}>Stores</NavLink>
      <NavLink href="/products" icon={<Package size={18} />} onClick={isSheet ? () => setMobileMenuOpen(false) : undefined} isSheetLink={isSheet}>Products</NavLink>
      <NavLink href="/track-order" icon={<PackageSearch size={18} />} onClick={isSheet ? () => setMobileMenuOpen(false) : undefined} isSheetLink={isSheet}>Track Order</NavLink>
    </>
  );

  const renderNavigation = () => {
    if (!hasMounted) {
      // Render a minimal, consistent structure for SSR and initial client render
      // This structure should be common to both mobile and desktop before hydration
      return (
        <nav className="flex items-center space-x-2 sm:space-x-4">
          {/* Desktop-like structure for cart button as a baseline */}
          <Link href="/cart" passHref>
            <Button variant="ghost" className="relative text-foreground/70 hover:text-foreground">
              <CartButtonContent itemCount={0} hasMounted={false} /> {/* Default to 0 items, no badge before mount */}
            </Button>
          </Link>
          {/* Placeholder for mobile menu trigger to ensure DOM consistency if needed */}
          <div className="md:hidden">
             <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground" aria-hidden="true" disabled>
                <Menu size={24} />
             </Button>
          </div>
        </nav>
      );
    }

    // Post-hydration rendering based on actual mobile state
    if (currentLayoutIsMobile) {
      return (
        <div className="flex items-center space-x-2">
          <Link href="/cart" passHref>
            <Button variant="ghost" className="relative text-foreground/70 hover:text-foreground">
              <CartButtonContent itemCount={itemCount} hasMounted={hasMounted} />
            </Button>
          </Link>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
                <Menu size={24} />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                 <SheetTitle className="text-left">
                   <span onClick={() => setMobileMenuOpen(false)} className="cursor-pointer">
                      <Logo />
                   </span>
                 </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-1 p-4 flex-grow">
                {navLinksContent(true)}
              </nav>
               <div className="p-4 border-t mt-auto">
                  <Link href="/cart" passHref>
                      <Button variant="outline" className="w-full relative" onClick={() => setMobileMenuOpen(false)}>
                          <CartButtonContent itemCount={itemCount} hasMounted={hasMounted} />
                          <span className="ml-2">View Cart</span>
                      </Button>
                  </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      );
    }

    // Desktop navigation
    return (
      <nav className="flex items-center space-x-2 sm:space-x-4">
        {navLinksContent(false)}
        <Link href="/cart" passHref>
          <Button variant="ghost" className="relative text-foreground/70 hover:text-foreground">
            <CartButtonContent itemCount={itemCount} hasMounted={hasMounted} />
          </Button>
        </Link>
      </nav>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-screen-xl mx-auto px-4">
        <Logo />
        {renderNavigation()}
      </div>
    </header>
  );
};

export default Header;
