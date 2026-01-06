
"use client";

import Link from 'next/link';
import { Store, Package, Menu, PackageSearch, Search, X, ShoppingCart } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

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
  const currentLayoutIsMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);


  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        setShowHeader(false);
      } else {
        // Scrolling up
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    if (isSearchOpen) {
      setIsSearchOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const searchTerm = formData.get('search') as string;
      if (searchTerm) {
          const searchPath = pathname.startsWith('/stores') ? '/stores' : '/products';
          router.push(`${searchPath}?search=${encodeURIComponent(searchTerm)}`);
          setIsSearchOpen(false);
      }
  };


  const navLinksContent = (isSheet = false) => (
    <>
      <NavLink href="/stores" icon={<Store size={18} />} onClick={isSheet ? () => setMobileMenuOpen(false) : undefined} isSheetLink={isSheet}>Stores</NavLink>
      <NavLink href="/products" icon={<Package size={18} />} onClick={isSheet ? () => setMobileMenuOpen(false) : undefined} isSheetLink={isSheet}>Products</NavLink>
      <NavLink href="/track-order" icon={<PackageSearch size={18} />} onClick={isSheet ? () => setMobileMenuOpen(false) : undefined} isSheetLink={isSheet}>Track Order</NavLink>
    </>
  );

  const renderSearch = () => (
     <div ref={searchRef} className="relative flex items-center">
        <div className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out",
            isSearchOpen ? "w-64" : "w-0"
        )}>
            <form onSubmit={handleSearch}>
                <Input
                    name="search"
                    type="search"
                    placeholder={pathname.startsWith('/stores') ? "Search stores..." : "Search products..."}
                    className={cn(
                        "h-9 pr-10 transition-all duration-300 ease-in-out",
                        isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    autoFocus
                />
            </form>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} className="relative z-10 text-foreground/70 hover:text-foreground">
            {isSearchOpen ? <X size={20}/> : <Search size={20}/>}
            <span className="sr-only">{isSearchOpen ? 'Close search' : 'Open search'}</span>
        </Button>
    </div>
  );


  const renderNavigation = () => {
    if (!hasMounted) {
      return (
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <div className="md:hidden">
             <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground" aria-hidden="true" disabled>
                <Menu size={24} />
             </Button>
          </div>
        </nav>
      );
    }

    if (currentLayoutIsMobile) {
      return (
        <div className="flex items-center space-x-2">
           {renderSearch()}
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
        {renderSearch()}
        <Button variant="ghost" size="icon" asChild className="relative text-foreground/70 hover:text-foreground">
          <Link href="/cart">
            <CartButtonContent itemCount={itemCount} hasMounted={hasMounted} />
          </Link>
        </Button>
      </nav>
    );
  };

  return (
    <header className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ease-in-out",
        !showHeader && "-translate-y-full"
      )}>
      <div className="container flex h-16 items-center justify-between max-w-screen-xl mx-auto px-4">
        <div className="flex-1 min-w-0">
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          {renderNavigation()}
        </div>
      </div>
    </header>
  );
};

export default Header;
