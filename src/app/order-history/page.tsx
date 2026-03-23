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

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  variant: string | null;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_id: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_ICONS: Record<string, string> = {
  pending: 'ClockIcon',
  processing: 'ArrowPathIcon',
  shipped: 'TruckIcon',
  delivered: 'CheckCircleIcon',
  cancelled: 'XCircleIcon',
};

const STATUS_ICON_COLORS: Record<string, string> = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  shipped: 'text-purple-500',
  delivered: 'text-green-500',
  cancelled: 'text-red-400',
};

export default function OrderHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/order-history');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setOrders(data || []);
      } catch (err: any) {
        const msg = err?.message || 'Failed to load orders. Please try again.';
        setError(msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const retryFetch = () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const fetchOrders = async () => {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        setOrders(data || []);
      } catch (err: any) {
        const msg = err?.message || 'Failed to load orders.';
        setError(msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  };

  if (authLoading) {
    return (
      <main className="bg-[#FAF6F0] min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your account…</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="bg-[#FAF6F0] min-h-screen overflow-x-hidden">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-10 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/homepage"
              className="text-[11px] uppercase tracking-[0.25em] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Icon name="ArrowLeftIcon" size={12} />
              Back to Home
            </Link>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
                  <Icon name="ClipboardDocumentListIcon" size={18} className="text-white" />
                </div>
                <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground">
                  Order History
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Track and review all your past purchases.
              </p>
            </div>
            {orders.length > 0 && (
              <div className="shrink-0 mt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Icon name="ShoppingBagIcon" size={12} />
                  {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Orders */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your orders…</p>
            </div>
          ) : error ? (
            <div className="text-center py-24 space-y-5">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <Icon name="ExclamationCircleIcon" size={28} className="text-red-400" />
              </div>
              <div>
                <p className="font-display italic text-xl font-semibold text-foreground mb-2">Couldn&apos;t load orders</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>
              </div>
              <button
                onClick={retryFetch}
                className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors"
              >
                <Icon name="ArrowPathIcon" size={13} />
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24 space-y-5">
              <div className="w-20 h-20 rounded-full bg-accent-cream flex items-center justify-center mx-auto">
                <Icon name="ShoppingBagIcon" size={36} className="text-primary" />
              </div>
              <div>
                <p className="font-display italic text-2xl font-semibold text-foreground mb-2">No orders yet</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  You haven&apos;t placed any orders. Explore our handcrafted collection!
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 h-11 px-7 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors"
              >
                <Icon name="SparklesIcon" size={14} />
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders?.map((order) => (
                <div
                  key={order?.id}
                  className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] shadow-sm overflow-hidden hover:shadow-card transition-shadow"
                >
                  {/* Order Header */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 cursor-pointer hover:bg-[#FAF6F0]/50 transition-colors"
                    onClick={() => setExpandedOrder(expandedOrder === order?.id ? null : order?.id)}
                    role="button"
                    aria-expanded={expandedOrder === order?.id}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedOrder(expandedOrder === order?.id ? null : order?.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        STATUS_STYLES[order?.status]?.split(' ')[0] || 'bg-accent-cream'
                      }`}>
                        <Icon
                          name={STATUS_ICONS[order?.status] || 'ClockIcon'}
                          size={18}
                          className={STATUS_ICON_COLORS[order?.status] || 'text-primary'}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">#{order?.order_number}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order?.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border ${STATUS_STYLES[order?.status] || STATUS_STYLES.pending}`}>
                        {order?.status}
                      </span>
                      <p className="font-bold text-foreground text-sm">
                        ₹{(order?.total / 100).toLocaleString('en-IN')}
                      </p>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        expandedOrder === order?.id ? 'bg-primary/10 rotate-180' : 'bg-accent-cream'
                      }`}>
                        <Icon
                          name="ChevronDownIcon"
                          size={14}
                          className={expandedOrder === order?.id ? 'text-primary' : 'text-muted-foreground'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Order Items */}
                  {expandedOrder === order?.id && (
                    <div className="border-t border-[rgba(196,120,90,0.1)] px-6 py-5 space-y-4 bg-[#FAF6F0]/30">
                      <div className="space-y-3">
                        {order?.order_items?.map((item) => (
                          <div key={item?.id} className="flex items-center gap-4 bg-white rounded-xl p-3 border border-[rgba(196,120,90,0.08)]">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-accent-cream shrink-0">
                              {item?.product_image ? (
                                <AppImage
                                  src={item.product_image}
                                  alt={item.product_name}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Icon name="PhotoIcon" size={20} className="text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{item?.product_name}</p>
                              {item?.variant && (
                                <p className="text-xs text-muted-foreground">{item.variant}</p>
                              )}
                              <p className="text-xs text-muted-foreground">Qty: {item?.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground shrink-0">
                              ₹{((item?.price * item?.quantity) / 100).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="pt-4 border-t border-[rgba(196,120,90,0.1)] space-y-2 bg-white rounded-xl p-4 border border-[rgba(196,120,90,0.08)]">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Subtotal</span>
                          <span>₹{(order?.subtotal / 100).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Shipping</span>
                          <span>{order?.shipping === 0 ? (
                            <span className="text-primary font-semibold">Free</span>
                          ) : `₹${(order.shipping / 100).toLocaleString('en-IN')}`}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-[rgba(196,120,90,0.08)]">
                          <span>Total</span>
                          <span className="text-primary">₹{(order?.total / 100).toLocaleString('en-IN')}</span>
                        </div>
                        {order?.payment_id && (
                          <p className="text-[10px] text-muted-foreground pt-1 font-mono">
                            Payment ID: {order.payment_id}
                          </p>
                        )}
                      </div>

                      {/* WhatsApp Query Button */}
                      <div className="flex gap-2 pt-1">
                        <a
                          href={`https://wa.me/919999999999?text=${encodeURIComponent(`Hi PurelyJid! 👋 I have a query about my order #${order?.order_number} (₹${(order?.total / 100).toLocaleString('en-IN')}). Status: ${order?.status}. Could you help me? 🙏`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 h-9 rounded-full bg-green-500 text-white text-[10px] font-semibold uppercase tracking-[0.15em] hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Query on WhatsApp
                        </a>
                        <a
                          href={`https://wa.me/919999999999?text=${encodeURIComponent(`Hi PurelyJid! 🧾 Could you send me the invoice for order #${order?.order_number}? Total: ₹${(order?.total / 100).toLocaleString('en-IN')}. Payment ID: ${order?.payment_id || 'N/A'}. Thank you!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 h-9 rounded-full border border-green-300 text-green-700 text-[10px] font-semibold uppercase tracking-[0.15em] hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Icon name="DocumentTextIcon" size={12} />
                          Get Invoice
                        </a>
                      </div>
                    </div>
                  )}
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
