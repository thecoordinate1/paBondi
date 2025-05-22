
"use client";

import Link from 'next/link';
import { ShoppingCart, Store, Package, Menu } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import React, { useState, useEffect } from 'react';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void; // To close the sheet
  isSheetLink?: boolean; // To differentiate styling
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
        isSheetLink ? "w-full justify-start py-3 text-base h-auto" : "h-10", // Adjusted height for sheet links
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

const CartButtonContent = ({ itemCount }: { itemCount: number }) => (
  <>
    <ShoppingCart size={20} />
    <span className="sr-only">Shopping Cart</span>
    {itemCount > 0 && (
      <Badge variant="destructive" className="absolute -top-1 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
        {itemCount}
      </Badge>
    )}
  </>
);

const Header = () => {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const navLinksContent = (isSheet = false) => (
    <>
      <NavLink href="/stores" icon={<Store size={18} />} onClick={isSheet ? () => setMobileMenuOpen(false) : undefined} isSheetLink={isSheet}>Stores</NavLink>
      <NavLink href="/products" icon={<Package size={18} />} onClick={isSheet ? () => setMobileMenuOpen(false) : undefined} isSheetLink={isSheet}>Products</NavLink>
    </>
  );

  // Default to desktop layout SSR / hydration to avoid mismatch, hook will update
  const currentLayoutIsMobile = isMobile === undefined ? false : isMobile;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-screen-xl mx-auto px-4">
        <Logo />
        {currentLayoutIsMobile ? (
          <div className="flex items-center space-x-2">
            <Link href="/cart" passHref>
              <Button variant="ghost" className="relative text-foreground/70 hover:text-foreground">
                <CartButtonContent itemCount={itemCount} />
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
                            <CartButtonContent itemCount={itemCount} />
                            <span className="ml-2">View Cart</span>
                        </Button>
                    </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <nav className="flex items-center space-x-2 sm:space-x-4">
            {navLinksContent(false)}
            <Link href="/cart" passHref>
              <Button variant="ghost" className="relative text-foreground/70 hover:text-foreground">
                <CartButtonContent itemCount={itemCount} />
              </Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
