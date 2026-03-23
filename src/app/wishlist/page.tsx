'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';

interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_price: number;
  created_at: string;
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/wishlist');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setItems(data || []);
      } catch (err: any) {
        showToast(err?.message || 'Failed to load wishlist.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user]);

  const removeItem = async (itemId: string, productName: string) => {
    setRemoving(itemId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('wishlists').delete().eq('id', itemId);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      showToast(`"${productName}" removed from wishlist.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove item.', 'error');
    } finally {
      setRemoving(null);
    }
  };

  const getWhatsAppLink = (item: WishlistItem) => {
    const msg = encodeURIComponent(
      `Hi PurelyJid! 👋 I'm interested in "${item.product_name}" (₹${(item.product_price / 100).toLocaleString('en-IN')}) from my wishlist. Could you help me with availability and ordering? 🛍️`
    );
    return `https://wa.me/919999999999?text=${msg}`;
  };

  if (authLoading) {
    return (
      <main className="bg-[#FAF6F0] min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="bg-[#FAF6F0] min-h-screen overflow-x-hidden">
      <Header />

      <section className="pt-32 pb-10 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/products"
              className="text-[11px] uppercase tracking-[0.25em] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Icon name="ArrowLeftIcon" size={12} />
              Back to Shop
            </Link>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
                  <Icon name="HeartIcon" size={18} className="text-white" />
                </div>
                <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground">
                  My Wishlist
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">Items you&apos;ve saved for later.</p>
            </div>
            {items.length > 0 && (
              <div className="shrink-0 mt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Icon name="HeartIcon" size={12} />
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your wishlist…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 space-y-5">
              <div className="w-20 h-20 rounded-full bg-accent-cream flex items-center justify-center mx-auto">
                <Icon name="HeartIcon" size={36} className="text-primary" />
              </div>
              <div>
                <p className="font-display italic text-2xl font-semibold text-foreground mb-2">Your wishlist is empty</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Save items you love while browsing our handcrafted collection.
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 h-11 px-7 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors"
              >
                <Icon name="SparklesIcon" size={14} />
                Explore Collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] shadow-sm overflow-hidden hover:shadow-card transition-shadow group"
                >
                  <div className="relative aspect-square overflow-hidden bg-accent-cream">
                    {item.product_image ? (
                      <AppImage
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="PhotoIcon" size={40} className="text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => removeItem(item.id, item.product_name)}
                      disabled={removing === item.id}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-white transition-all shadow-sm disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      {removing === item.id ? (
                        <div className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <Icon name="HeartIcon" size={14} />
                      )}
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm leading-snug">{item.product_name}</h3>
                      <p className="font-display italic text-lg font-bold text-foreground mt-1">
                        ₹{(item.product_price / 100).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href="/products"
                        className="flex-1 h-9 rounded-full bg-foreground text-[#FAF6F0] text-[10px] font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Icon name="ShoppingBagIcon" size={12} />
                        Shop Now
                      </Link>
                      <a
                        href={getWhatsAppLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3 rounded-full bg-green-500 text-white text-[10px] font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
                        aria-label="Ask on WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Ask
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
