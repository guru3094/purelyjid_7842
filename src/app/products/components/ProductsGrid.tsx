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

const STATIC_PRODUCTS: Product[] = [
  {
    id: 1, name: 'Aurora Resin Pendant', category: 'Jewelry', material: 'Resin + Crystal',
    price: 38, originalPrice: 48, rating: 4.9, reviews: 214, badge: 'Bestseller', badgeColor: 'bg-primary',
    image: "https://images.unsplash.com/photo-1676157211877-760c3d400217",
    alt: 'Aurora-colored resin pendant with purple and teal swirls on silver chain',
    inStock: true, slug: 'aurora-resin-pendant'
  },
  {
    id: 2, name: 'Galaxy Geode Tray', category: 'Home Décor', material: 'Resin + Gold Leaf',
    price: 64, originalPrice: null, rating: 5.0, reviews: 89, badge: 'New', badgeColor: 'bg-secondary',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1545b4ef2-1771900598709.png",
    alt: 'Oval resin serving tray with deep blue and gold galaxy pattern on dark surface',
    inStock: true, slug: 'galaxy-geode-tray'
  },
  {
    id: 3, name: 'Floral Resin Earrings', category: 'Jewelry', material: 'Resin + Dried Flowers',
    price: 24, originalPrice: null, rating: 4.8, reviews: 341, badge: 'Popular', badgeColor: 'bg-accent-gold',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1bb068302-1772088252319.png",
    alt: 'Translucent resin earrings with real dried flower inclusions in teardrop shape',
    inStock: true, slug: 'floral-resin-earrings'
  },
  {
    id: 4, name: 'Complete Starter Kit', category: 'DIY Supplies', material: 'Resin + Pigments',
    price: 52, originalPrice: 68, rating: 4.9, reviews: 156, badge: 'Gift Idea', badgeColor: 'bg-primary',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_130a82f81-1772220075768.png",
    alt: 'Resin art starter kit with clear resin bottles, silicone molds, and color pigments spread out',
    inStock: true, slug: 'complete-starter-kit'
  },
  {
    id: 5, name: 'Ocean Wave Coaster Set', category: 'Home Décor', material: 'Resin + Mica',
    price: 42, originalPrice: null, rating: 5.0, reviews: 72, badge: 'New', badgeColor: 'bg-secondary',
    image: "https://images.unsplash.com/photo-1626195850148-820e10d928f6",
    alt: 'Set of four round resin coasters with ocean wave patterns in shades of blue and white',
    inStock: true, slug: 'ocean-wave-coaster-set'
  },
  {
    id: 6, name: 'Pressed Flower Bookmark', category: 'Stationery', material: 'Resin + Botanicals',
    price: 18, originalPrice: null, rating: 4.7, reviews: 198, badge: null, badgeColor: '',
    image: "https://images.unsplash.com/photo-1677737775719-b6824065d398",
    alt: 'Delicate clear resin bookmarks with colorful pressed flowers and gold leaf on open book pages',
    inStock: true, slug: 'pressed-flower-bookmark'
  },
  {
    id: 7, name: 'Geode Wall Clock', category: 'Home Décor', material: 'Resin + Agate',
    price: 88, originalPrice: 110, rating: 4.9, reviews: 44, badge: 'Limited', badgeColor: 'bg-accent-gold',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1e3c8f66e-1772996476517.png",
    alt: 'Round wall clock with geode-inspired resin face in rose gold and ivory tones',
    inStock: false, slug: 'geode-wall-clock'
  },
  {
    id: 8, name: 'Resin Ring Set', category: 'Jewelry', material: 'Resin + Glitter',
    price: 29, originalPrice: null, rating: 4.6, reviews: 127, badge: null, badgeColor: '',
    image: "https://images.unsplash.com/photo-1705058715556-ec2e1a8327b4",
    alt: 'Set of three colorful resin rings with glitter inclusions on marble surface',
    inStock: true, slug: 'resin-ring-set'
  },
  {
    id: 9, name: 'Pigment Powder Set', category: 'DIY Supplies', material: 'Mica Powder',
    price: 34, originalPrice: null, rating: 4.8, reviews: 203, badge: 'Popular', badgeColor: 'bg-accent-gold',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1f764a867-1771900600936.png",
    alt: 'Collection of vibrant mica pigment powder jars in metallic and pearlescent colors',
    inStock: true, slug: 'pigment-powder-set'
  },
  {
    id: 10, name: 'Resin Photo Frame', category: 'Home Décor', material: 'Resin + Shells',
    price: 46, originalPrice: null, rating: 4.9, reviews: 61, badge: 'New', badgeColor: 'bg-secondary',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_13091368f-1772088172091.png",
    alt: 'Handcrafted resin photo frame with embedded seashells and ocean-blue pigment swirls',
    inStock: true, slug: 'resin-photo-frame'
  },
  {
    id: 11, name: 'Silicone Mold Bundle', category: 'DIY Supplies', material: 'Silicone',
    price: 26, originalPrice: 32, rating: 4.7, reviews: 89, badge: null, badgeColor: '',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_131eb6c4b-1766490611748.png",
    alt: 'Bundle of various silicone resin casting molds including geometric and organic shapes',
    inStock: true, slug: 'silicone-mold-bundle'
  },
  {
    id: 12, name: 'Resin Keychain Set', category: 'Accessories', material: 'Resin + Foil',
    price: 22, originalPrice: null, rating: 4.8, reviews: 176, badge: 'Gift Idea', badgeColor: 'bg-primary',
    image: "https://img.rocket.new/generatedImages/rocket_gen_img_1829ab903-1772088721014.png",
    alt: 'Set of four colorful resin keychains with gold foil and floral inclusions on keyring',
    inStock: true, slug: 'resin-keychain-set'
  }
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' }
];

export default function ProductsGrid() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams?.get('search') || '';

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

  useEffect(() => {
    async function fetchProducts() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select('id, name, slug, price, original_price, material, badge, badge_color, image_url, alt_text, in_stock, is_active, display_order, categories(name)')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          // Only fall back to static on actual network/auth error
          setAllProducts(STATIC_PRODUCTS);
          setCategories(['All', 'Jewelry', 'Home Décor', 'DIY Supplies', 'Stationery', 'Accessories']);
        } else if (!data || data.length === 0) {
          // DB reachable but no active products — show empty state (not static)
          setAllProducts([]);
          setCategories(['All']);
        } else {
          const mapped: Product[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug || p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            category: p.categories?.name || 'Uncategorized',
            material: p.material || '',
            price: Math.round((p.price || 0) / 100),
            originalPrice: p.original_price ? Math.round(p.original_price / 100) : null,
            rating: 4.8,
            reviews: 0,
            badge: p.badge || null,
            badgeColor: p.badge_color || 'bg-primary',
            image: p.image_url || 'https://images.unsplash.com/photo-1676157211877-760c3d400217',
            alt: p.alt_text || p.name,
            inStock: p.in_stock !== false,
          }));

          setAllProducts(mapped);

          const uniqueCategories = ['All', ...Array.from(new Set(mapped.map((p) => p.category)))];
          setCategories(uniqueCategories);

          // Adjust priceMax to fit the actual data range
          const maxPrice = Math.max(...mapped.map((p) => p.price), 120);
          setPriceMax(maxPrice);
        }
      } catch {
        setAllProducts(STATIC_PRODUCTS);
        setCategories(['All', 'Jewelry', 'Home Décor', 'DIY Supplies', 'Stationery', 'Accessories']);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();

    // Real-time subscription — refetch when products or categories change
    const supabase = createClient();
    const channel = supabase
      .channel('products-grid-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (urlSearch) setSearchQuery(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const gsapModule = await import('gsap');
        const stModule = await import('gsap/ScrollTrigger');
        const gsap = gsapModule.gsap;
        const ScrollTrigger = stModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        gsap.fromTo('.pg-filter',
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.pg-filter', start: 'top 90%' } }
        );
      } catch {}
    };
    init();
  }, []);

  const maxPrice = allProducts.length > 0 ? Math.max(...allProducts.map((p) => p.price), 120) : 120;

  const suggestions = searchQuery.trim().length >= 1
    ? allProducts
        .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  const filtered = allProducts
    .filter((p) => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesPrice = p.price <= priceMax;
      const matchesStock = !inStockOnly || p.inStock;
      const matchesSearch = !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.material.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesPrice && matchesStock && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const visible = filtered.slice(0, visibleCount);

  const toggleWishlist = (id: string | number) => {
    setWishlist((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSuggestionClick = (name: string) => {
    setSearchQuery(name);
    setShowSuggestions(false);
    setVisibleCount(9);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setVisibleCount(9);
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: typeof product.id === 'string' ? product.id.charCodeAt(0) : product.id as number,
      name: product.name,
      category: product.category,
      price: Math.round(product.price * 100),
      image: product.image,
      alt: product.alt,
      variant: product.material,
    });
    setCartToast(`"${product.name}" added to cart!`);
    setTimeout(() => setCartToast(null), 3000);
  };

  if (loading) {
    return (
      <section className="py-12 px-6 pb-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-xl bg-gray-200 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 pb-28">
      <div className="mx-auto max-w-7xl">

        {/* Search Bar */}
        <div className="mb-8" ref={searchRef}>
          <div className="relative max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Icon name="MagnifyingGlassIcon" size={18} className="absolute left-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); setVisibleCount(9); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search products, categories, materials…"
                className="w-full h-12 pl-11 pr-10 rounded-2xl border border-[rgba(196,120,90,0.2)] bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-sm"
                aria-label="Search products"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[#FAF6F0] transition-colors"
                  aria-label="Clear search"
                >
                  <Icon name="XMarkIcon" size={14} />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[rgba(196,120,90,0.15)] shadow-lg z-30 overflow-hidden">
                <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Suggestions</p>
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSuggestionClick(p.name)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAF6F0] transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#EDE8E0]">
                      <AppImage src={p.image} alt={p.alt} width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · ₹{p.price}</p>
                    </div>
                    <Icon name="ArrowUpLeftIcon" size={13} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && searchQuery.trim().length >= 1 && suggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[rgba(196,120,90,0.15)] shadow-lg z-30 px-4 py-4 text-center">
                <p className="text-sm text-muted-foreground">No products match &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Showing results for</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {searchQuery}
                <button onClick={clearSearch} aria-label="Remove search filter">
                  <Icon name="XMarkIcon" size={11} />
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filter */}
          <aside className="pg-filter w-full lg:w-64 shrink-0 space-y-8">
            <div className="sticky top-28 space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-foreground">Category</p>
                <div className="flex flex-wrap lg:flex-col gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setVisibleCount(9); }}
                      className={`filter-btn px-4 py-2.5 rounded-full border text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${
                        activeCategory === cat
                          ? 'bg-primary text-white border-primary' : 'border-[rgba(196,120,90,0.2)] text-muted-foreground hover:border-primary hover:text-primary'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-foreground">Max Price</p>
                  <span className="text-sm font-bold text-primary">₹{priceMax}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  value={priceMax}
                  onChange={(e) => { setPriceMax(Number(e.target.value)); setVisibleCount(9); }}
                  className="w-full"
                  aria-label="Maximum price filter"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>₹0</span>
                  <span>₹{maxPrice}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-foreground">Availability</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={inStockOnly}
                    onClick={() => { setInStockOnly(!inStockOnly); setVisibleCount(9); }}
                    className={`relative w-10 h-5 rounded-full transition-colors ${inStockOnly ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${inStockOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-xs text-muted-foreground">In Stock Only</span>
                </label>
              </div>

              {(activeCategory !== 'All' || priceMax !== maxPrice || inStockOnly || searchQuery) && (
                <button
                  onClick={() => { setActiveCategory('All'); setPriceMax(maxPrice); setInStockOnly(false); clearSearch(); setVisibleCount(9); }}
                  className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                >
                  <Icon name="ArrowPathIcon" size={13} />
                  Reset all filters
                </button>
              )}

              <div className="pt-4 border-t border-[rgba(196,120,90,0.12)]">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{Math.min(visibleCount, filtered.length)}</span> of{' '}
                  <span className="font-bold text-foreground">{filtered.length}</span> products
                </p>
              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <div className="flex-1 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[rgba(196,120,90,0.12)]">
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 4).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setVisibleCount(9); }}
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border transition-all duration-300 ${
                      activeCategory === cat
                        ? 'bg-primary text-white border-primary' : 'border-[rgba(196,120,90,0.2)] text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-[rgba(196,120,90,0.2)] rounded-lg px-4 py-2 text-xs font-medium text-foreground focus:outline-none focus:border-primary transition-colors"
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="text-center py-24 space-y-4">
                <Icon name="ArchiveBoxXMarkIcon" size={48} className="text-muted-foreground mx-auto" />
                <p className="font-display text-2xl font-bold text-foreground">No products found</p>
                <p className="text-muted-foreground text-sm">Try adjusting your filters or search</p>
                <button
                  onClick={() => { setActiveCategory('All'); setPriceMax(maxPrice); setInStockOnly(false); clearSearch(); }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors"
                >
                  <Icon name="ArrowPathIcon" size={14} />
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {visible.map((product) => (
                  <div key={product.id} className="product-card group">
                    <Link href={`/products/${product.slug}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white shadow-card mb-4">
                      <AppImage
                        src={product.image}
                        alt={product.alt}
                        fill
                        className="object-cover product-card-img saturate-[0.85] group-hover:saturate-100 transition-all duration-1000"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />

                      {!product.inStock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                          <span className="px-4 py-2 rounded-full bg-foreground/80 text-white text-[10px] font-bold uppercase tracking-[0.2em]">
                            Sold Out
                          </span>
                        </div>
                      )}

                      {product.badge && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-white ${product.badgeColor}`}>
                            {product.badge}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => toggleWishlist(product.id)}
                        aria-label={`${wishlist.includes(product.id) ? 'Remove from' : 'Add to'} wishlist`}
                        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                      >
                        <Icon
                          name="HeartIcon"
                          size={15}
                          variant={wishlist.includes(product.id) ? 'solid' : 'outline'}
                          className={wishlist.includes(product.id) ? 'text-primary' : 'text-muted-foreground'}
                        />
                      </button>

                      {product.inStock && (
                        <div className="product-card-overlay absolute inset-0 bg-foreground/15 backdrop-blur-[1px] flex items-end justify-center pb-5 z-10">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                            className="px-6 py-3 rounded-full bg-white text-foreground text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all shadow-warm"
                          >
                            Add to Cart
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 px-1">
                      <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{product.category}</p>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-display text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                          {product.name}
                        </h2>
                      </div>
                      {product.material && <p className="text-[10px] text-muted-foreground">{product.material}</p>}

                      {product.reviews > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-sm ${i < Math.floor(product.rating) ? 'star-filled' : 'text-muted-foreground'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {product.rating} ({product.reviews})
                          </span>
                        </div>
                      )}

                      {/* Price + always-visible Add to Cart */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xl font-bold text-primary">₹{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
                          )}
                        </div>
                        {product.inStock ? (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                            aria-label={`Add ${product.name} to cart`}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-primary hover:text-white transition-all duration-200"
                          >
                            <Icon name="ShoppingBagIcon" size={12} />
                            Add
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Sold Out</span>
                        )}
                      </div>
                    </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {visibleCount < filtered.length && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setVisibleCount((v) => v + 6)}
                  className="inline-flex items-center gap-2 h-12 px-8 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-bold uppercase tracking-[0.25em] text-foreground hover:border-primary hover:text-primary transition-all duration-300"
                >
                  Load More
                  <Icon name="ChevronDownIcon" size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cart Toast Notification */}
        {cartToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-foreground text-[#FAF6F0] px-5 py-3 rounded-2xl shadow-lg text-sm font-medium">
            <Icon name="ShoppingBagIcon" size={16} className="text-primary shrink-0" />
            {cartToast}
            <Link href="/cart" className="text-primary underline text-xs font-semibold ml-1">View Cart</Link>
          </div>
        )}
      </div>
    </section>
  );
}