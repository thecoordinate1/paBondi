"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { getAllProducts } from '@/lib/data';
import ProductCard from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');

  useEffect(() => {
    setProducts(getAllProducts());
  }, []);

  const categories = useMemo(() => {
    const allCategories = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return ['all', ...Array.from(allCategories)];
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let processedProducts = products;

    if (selectedCategory !== 'all') {
      processedProducts = processedProducts.filter(product => product.category === selectedCategory);
    }

    processedProducts = processedProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.storeName && product.storeName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    switch (sortBy) {
      case 'price-asc':
        processedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        processedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        processedProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        processedProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return processedProducts;
  }, [products, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">All Products</h1>
      
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products or stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-lg text-center py-10">
          No products found matching your criteria.
        </p>
      )}
    </div>
  );
}
