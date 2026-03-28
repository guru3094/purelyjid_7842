'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string | number;
  name: string;
  category: string;
  material: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  badge: string | null;
  badgeColor: string;
  image: string;
  alt: string;
  inStock: boolean;
  slug: string;
}

export default function ProductsGrid() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams?.get('search') || '';

  const supabase = createClient(); // ✅ SINGLE INSTANCE

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [priceMax, setPriceMax] = useState(120);
  const [wishlist, setWishlist] = useState<(string | number)[]>([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const [cartToast, setCartToast] = useState<string | null>(null);

  // ✅ FETCH FUNCTION (FIXED)
  const fetchProducts = async () => {
    try {
      console.log("🔄 Fetching products from Supabase...");

      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, original_price, material, badge, badge_color, image_url, alt_text, in_stock, is_active, display_order, categories(name)')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        console.log("❌ Error fetching, falling back");
        setAllProducts([]);
        setCategories(['All']);
        return;
      }

      if (!data || data.length === 0) {
        console.log("⚠️ No products found");
        setAllProducts([]);
        setCategories(['All']);
        return;
      }

      const mapped: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug || p.name.toLowerCase().replace(/\s+/g, '-'),
        category: p.categories?.name || 'Uncategorized',
        material: p.material || '',
        price: Math.round((p.price || 0) / 100),
        originalPrice: p.original_price ? Math.round(p.original_price / 100) : null,
        rating: 4.8,
        reviews: 0,
        badge: p.badge || null,
        badgeColor: p.badge_color || 'bg-primary',
        image: p.image_url || '',
        alt: p.alt_text || p.name,
        inStock: p.in_stock !== false,
      }));

      setAllProducts(mapped);

      const uniqueCategories = ['All', ...Array.from(new Set(mapped.map((p) => p.category)))];
      setCategories(uniqueCategories);

      const maxPrice = Math.max(...mapped.map((p) => p.price), 120);
      setPriceMax(maxPrice);

    } catch (err) {
      console.log("❌ FETCH ERROR:", err);
      setAllProducts([]);
      setCategories(['All']);
    } finally {
      setLoading(false);
    }
  };

  // ✅ INITIAL LOAD + REALTIME FIX
  useEffect(() => {
    fetchProducts();

    console.log("📡 Subscribing to realtime...");

    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          console.log("⚡ Products changed → refetching");
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      console.log("🛑 Cleanup realtime");
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {allProducts.map((p) => (
        <div key={p.id} className="border p-4 rounded-xl shadow">
          <img src={p.image} alt={p.alt} className="w-full h-48 object-cover rounded" />
          <h2 className="font-bold mt-2">{p.name}</h2>
          <p className="text-sm text-gray-500">{p.category}</p>
          <p className="text-lg font-semibold">₹{p.price}</p>
        </div>
      ))}
    </div>
  );
}