"use client";

import Link from 'next/link';
import { ShoppingCart, Store, Package, Search as SearchIcon } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} passHref>
      <Button variant="ghost" className={cn("text-sm font-medium", isActive ? "text-primary" : "text-foreground/70 hover:text-foreground")}>
        {icon}
        <span className="ml-2">{children}</span>
      </Button>
    </Link>
  );
};


const Header = () => {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-screen-xl mx-auto px-4">
        <Logo />
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <NavLink href="/stores" icon={<Store size={18} />}>Stores</NavLink>
          <NavLink href="/products" icon={<Package size={18} />}>Products</NavLink>
          <Link href="/cart" passHref>
            <Button variant="ghost" className="relative text-foreground/70 hover:text-foreground">
              <ShoppingCart size={20} />
              <span className="sr-only">Shopping Cart</span>
              {itemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
