'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/contexts/CartContext';
import { createClient } from '@/lib/supabase/client';

interface ProductSpec {
  label: string;
  value: string;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  original_price: number | null;
  material: string;
  badge: string | null;
  badge_color: string;
  image_url: string | null;
  alt_text: string;
  additional_images: { url: string; alt: string }[];
  specifications: ProductSpec[];
  care_instructions: string;
  tags: string[];
  sku: string;
  weight: string;
  dimensions: string;
  in_stock: boolean;
  is_active: boolean;
  stock_quantity: number;
  categories?: { name: string };
}

// Fallback static products (same as ProductsGrid)
const STATIC_PRODUCTS = [
  { id: '1', name: 'Aurora Resin Pendant', slug: 'aurora-resin-pendant', category: 'Jewelry', material: 'Resin + Crystal', price: 3800, original_price: 4800, badge: 'Bestseller', badge_color: 'bg-primary', image_url: 'https://images.unsplash.com/photo-1676157211877-760c3d400217', alt_text: 'Aurora-colored resin pendant with purple and teal swirls on silver chain', in_stock: true, description: 'A stunning handcrafted resin pendant featuring aurora-inspired swirls of purple and teal, set on a delicate silver chain. Each piece is unique, made with premium UV resin and genuine crystal inclusions.', short_description: 'Handcrafted aurora-inspired resin pendant with crystal inclusions.', additional_images: [], specifications: [{ label: 'Material', value: 'UV Resin + Crystal' }, { label: 'Chain Length', value: '18 inches' }, { label: 'Pendant Size', value: '3 cm diameter' }], care_instructions: 'Avoid prolonged exposure to sunlight. Clean gently with a soft cloth. Store in a cool, dry place.', tags: ['pendant', 'jewelry', 'resin', 'aurora'], sku: 'ARP-001', weight: '15g', dimensions: '3 x 3 x 0.5 cm', stock_quantity: 25, is_active: true, categories: { name: 'Jewelry' } },
  { id: '2', name: 'Galaxy Geode Tray', slug: 'galaxy-geode-tray', category: 'Home Décor', material: 'Resin + Gold Leaf', price: 6400, original_price: null, badge: 'New', badge_color: 'bg-secondary', image_url: 'https://img.rocket.new/generatedImages/rocket_gen_img_1545b4ef2-1771900598709.png', alt_text: 'Oval resin serving tray with deep blue and gold galaxy pattern on dark surface', in_stock: true, description: 'An exquisite oval serving tray featuring a deep galaxy-inspired resin pour with real gold leaf accents. Perfect as a decorative piece or functional tray for your home.', short_description: 'Galaxy-inspired resin tray with real gold leaf accents.', additional_images: [], specifications: [{ label: 'Material', value: 'Resin + Gold Leaf' }, { label: 'Size', value: '30 x 20 cm' }, { label: 'Thickness', value: '1.5 cm' }], care_instructions: 'Wipe clean with a damp cloth. Not dishwasher safe. Avoid harsh chemicals.', tags: ['tray', 'home decor', 'galaxy', 'gold leaf'], sku: 'GGT-002', weight: '450g', dimensions: '30 x 20 x 1.5 cm', stock_quantity: 10, is_active: true, categories: { name: 'Home Décor' } },
  { id: '3', name: 'Floral Resin Earrings', slug: 'floral-resin-earrings', category: 'Jewelry', material: 'Resin + Dried Flowers', price: 2400, original_price: null, badge: 'Popular', badge_color: 'bg-accent-gold', image_url: 'https://img.rocket.new/generatedImages/rocket_gen_img_1bb068302-1772088252319.png', alt_text: 'Translucent resin earrings with real dried flower inclusions in teardrop shape', in_stock: true, description: 'Delicate teardrop earrings crafted with real dried flowers preserved in clear UV resin. Each pair captures the beauty of nature in a wearable art form.', short_description: 'Teardrop earrings with real dried flower inclusions.', additional_images: [], specifications: [{ label: 'Material', value: 'UV Resin + Dried Flowers' }, { label: 'Size', value: '4 cm drop' }, { label: 'Closure', value: 'Sterling Silver Hooks' }], care_instructions: 'Keep away from water and perfume. Store in a jewelry box. Handle with care.', tags: ['earrings', 'floral', 'dried flowers', 'jewelry'], sku: 'FRE-003', weight: '8g', dimensions: '4 x 1.5 x 0.5 cm', stock_quantity: 40, is_active: true, categories: { name: 'Jewelry' } },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartToast, setCartToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'care'>('description');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          // Try static fallback
          const staticProduct = STATIC_PRODUCTS.find((p) => p.slug === slug);
          if (staticProduct) {
            setProduct(staticProduct as unknown as ProductDetail);
          } else {
            router.push('/products');
          }
        } else {
          setProduct({
            ...data,
            additional_images: data.additional_images || [],
            specifications: data.specifications || [],
            tags: data.tags || [],
            short_description: data.short_description || '',
            care_instructions: data.care_instructions || '',
            sku: data.sku || '',
            weight: data.weight || '',
            dimensions: data.dimensions || '',
          });
        }
      } catch {
        const staticProduct = STATIC_PRODUCTS.find((p) => p.slug === slug);
        if (staticProduct) {
          setProduct(staticProduct as unknown as ProductDetail);
        } else {
          router.push('/products');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProduct();
  }, [slug, router]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: parseInt(product.id) || Math.random(),
      name: product.name,
      category: product.categories?.name || '',
      price: product.price,
      image: product.image_url || '',
      alt: product.alt_text,
      variant: product.material,
      quantity,
    });
    setCartToast(true);
    setTimeout(() => setCartToast(false), 3000);
  };

  const allImages = product
    ? [
        { url: product.image_url || '', alt: product.alt_text },
        ...(product.additional_images || []),
      ].filter((img) => img.url)
    : [];

  const discountPercent =
    product?.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  if (loading) {
    return (
      <main className="bg-[#FAF6F0] min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-40">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) return null;

  return (
    <main className="bg-[#FAF6F0] min-h-screen">
      <Header />

      {/* Breadcrumb */}
      <div className="px-6 pt-6 pb-2 max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Icon name="ChevronRightIcon" size={12} />
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          <Icon name="ChevronRightIcon" size={12} />
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <section className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-card">
              {allImages.length > 0 ? (
                <AppImage
                  src={allImages[selectedImage]?.url}
                  alt={allImages[selectedImage]?.alt || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#EDE8E0]">
                  <Icon name="PhotoIcon" size={48} className="text-muted-foreground" />
                </div>
              )}
              {product.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-white ${product.badge_color}`}>
                    {product.badge}
                  </span>
                </div>
              )}
              {discountPercent && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-white bg-red-500">
                    -{discountPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <AppImage src={img.url} alt={img.alt} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category + SKU */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted-foreground">
                {product.categories?.name || 'Handcrafted'}
              </span>
              {product.sku && (
                <span className="text-[10px] text-muted-foreground">SKU: {product.sku}</span>
              )}
            </div>

            {/* Name */}
            <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-muted-foreground text-base leading-relaxed">{product.short_description}</p>
            )}

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="font-display text-3xl font-bold text-primary">
                ₹{(product.price / 100).toLocaleString('en-IN')}
              </span>
              {product.original_price && (
                <span className="text-lg text-muted-foreground line-through">
                  ₹{(product.original_price / 100).toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent && (
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Material */}
            {product.material && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Material:</span>
                <span className="text-sm font-semibold text-foreground">{product.material}</span>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className={`text-sm font-semibold ${product.in_stock ? 'text-green-700' : 'text-red-500'}`}>
                {product.in_stock
                  ? product.stock_quantity > 0 && product.stock_quantity <= 10
                    ? `Only ${product.stock_quantity} left in stock`
                    : 'In Stock' :'Out of Stock'}
              </span>
            </div>

            {/* Quantity + Add to Cart */}
            {product.in_stock && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Qty:</span>
                  <div className="flex items-center border border-[rgba(196,120,90,0.2)] rounded-full overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-[#FAF6F0] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Icon name="MinusIcon" size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-foreground">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-[#FAF6F0] transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Icon name="PlusIcon" size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full h-14 rounded-full bg-primary text-white font-bold uppercase tracking-[0.2em] text-sm hover:bg-primary/90 transition-all shadow-warm flex items-center justify-center gap-3"
                >
                  <Icon name="ShoppingBagIcon" size={18} />
                  Add to Cart
                </button>
              </div>
            )}

            {!product.in_stock && (
              <div className="w-full h-14 rounded-full bg-gray-100 text-gray-400 font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 cursor-not-allowed">
                <Icon name="ArchiveBoxXMarkIcon" size={18} />
                Sold Out
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-[#EDE8E0] text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Weight / Dimensions */}
            {(product.weight || product.dimensions) && (
              <div className="flex gap-6 pt-2 border-t border-[rgba(196,120,90,0.1)]">
                {product.weight && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Weight</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{product.weight}</p>
                  </div>
                )}
                {product.dimensions && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Dimensions</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{product.dimensions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Detail Tabs */}
      <section className="px-6 pb-16 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-[rgba(196,120,90,0.1)]">
            {[
              { key: 'description', label: 'Description' },
              { key: 'specs', label: 'Specifications' },
              { key: 'care', label: 'Care Instructions' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-colors border-b-2 ${
                  activeTab === key
                    ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none text-foreground">
                {product.description ? (
                  <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">{product.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">No description available.</p>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                {product.specifications && product.specifications.length > 0 ? (
                  <div className="divide-y divide-[rgba(196,120,90,0.08)]">
                    {product.specifications.map((spec, idx) => (
                      <div key={idx} className="flex items-center py-3 gap-4">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground w-36 shrink-0">{spec.label}</span>
                        <span className="text-sm font-semibold text-foreground">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">No specifications available.</p>
                )}
              </div>
            )}

            {activeTab === 'care' && (
              <div>
                {product.care_instructions ? (
                  <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">{product.care_instructions}</p>
                ) : (
                  <p className="text-muted-foreground italic text-sm">No care instructions available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Back to Products */}
      <div className="px-6 pb-16 max-w-7xl mx-auto">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <Icon name="ArrowLeftIcon" size={16} />
          Back to All Products
        </Link>
      </div>

      <Footer />

      {/* Cart Toast */}
      {cartToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-foreground text-[#FAF6F0] px-5 py-3 rounded-2xl shadow-lg text-sm font-medium">
          <Icon name="ShoppingBagIcon" size={16} className="text-primary shrink-0" />
          Added to cart!
          <Link href="/cart" className="text-primary underline text-xs font-semibold ml-1">View Cart</Link>
        </div>
      )}
    </main>
  );
}
