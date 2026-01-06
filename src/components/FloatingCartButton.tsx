
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Filter, Trash2, ArrowRight, Plus, Minus } from "lucide-react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "./ui/input"
import { cn } from "@/lib/utils"

async function getCategories(): Promise<string[]> {
  const supabase = createClient()
  const { data: products, error } = await supabase
    .from("products")
    .select("category")
    .eq("status", "Active")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }
  if (!products) {
    return []
  }

  const categories = new Set<string>()
  products.forEach((p) => {
    p.category?.split(",").forEach((c) => {
      if (c.trim()) categories.add(c.trim())
    })
  })
  return ["All", ...Array.from(categories).sort()]
}

export default function FloatingCartButton() {
  const { cartItems, getItemCount, clearCart, getCartTotal, updateQuantity, removeFromCart } = useCart()
  const itemCount = getItemCount()
  const [hasMounted, setHasMounted] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category")

  useEffect(() => {
    setHasMounted(true)
    getCategories().then(setCategories)
  }, [])

  const handleCategorySelect = (category: string) => {
    const params = new URLSearchParams(window.location.search)
    if (category === "All") {
      params.delete("category")
    } else {
      params.set("category", category)
    }
    const currentPath = window.location.pathname.includes("/stores")
      ? "/stores"
      : "/products"
    router.push(`${currentPath}?${params.toString()}`)
  }

  if (!hasMounted) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      {/* Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="rounded-full w-14 h-14 shadow-lg">
            <Filter size={24} />
            <span className="sr-only">Filter Products</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="end" className="w-56">
          <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categories.map((category) => (
            <DropdownMenuItem
              key={category}
              onSelect={() => handleCategorySelect(category)}
              className={cn(
                (selectedCategory === category ||
                (!selectedCategory && category === "All")) &&
                  "bg-accent text-accent-foreground"
              )}
            >
              {category}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Floating Cart Popover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="relative rounded-full w-14 h-14 shadow-lg"
          >
            <ShoppingCart size={24} />
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center text-xs rounded-full"
              >
                {itemCount}
              </Badge>
            )}
            <span className="sr-only">View Cart</span>
          </Button>
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] flex flex-col overflow-hidden rounded-2xl bg-card shadow-xl border p-0"
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Your Cart</h3>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 px-4">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4 p-4 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm border-b pb-3 last:border-0"
                    >
                      <div className="flex-grow">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-muted-foreground">K {(item.price * item.quantity).toFixed(2)}</p>
                        <div className="flex items-center space-x-2 mt-2">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                <Minus size={14} />
                            </Button>
                            <span className="font-semibold text-base w-10 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                <Plus size={14} />
                            </Button>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive/80 ml-2">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t font-semibold flex justify-between text-base">
                    <span>Total</span>
                    <span>K{getCartTotal().toFixed(2)}</span>
                </div>
              </>
            )}

            {cartItems.length > 0 && (
              <div className="flex gap-2 mt-auto p-4 border-t bg-muted/50">
                 <Button asChild className="flex-1" variant="outline">
                    <Link href="/cart" onClick={() => setIsPopoverOpen(false)}>
                        View Cart
                    </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/checkout" onClick={() => setIsPopoverOpen(false)}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Checkout
                  </Link>
                </Button>
              </div>
            )}
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </div>
  )
}
