'use client';
import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { sendOrderConfirmationEmail } from '@/lib/email';

interface OrderItem {
  name: string;
  variant: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams?.get('payment_id');
  const orderId = searchParams?.get('order_id');
  const shippingCharge = parseInt(searchParams?.get('shipping') || '0', 10);
  const [visible, setVisible] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();

  const orderNumber = orderId
    ? orderId?.slice(-8)?.toUpperCase()
    : `PJ${Date.now()?.toString()?.slice(-6)}`;

  // Use real cart items if available, otherwise use sample items
  const orderItems: OrderItem[] = cartItems?.length > 0
    ? cartItems.map((item) => ({
        name: item.name,
        variant: item.variant || '',
        quantity: item.quantity,
        price: item.price,
      }))
    : [
        { name: 'Handwoven Linen Tote', variant: 'Natural / Medium', quantity: 1, price: 10640 },
        { name: 'Ceramic Pour-Over Set', variant: 'Matte White', quantity: 2, price: 7820 },
        { name: 'Beeswax Pillar Candle', variant: 'Honey / Tall', quantity: 1, price: 3160 },
      ];

  // Try to get shipping address from sessionStorage (set during checkout)
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('pj_last_shipping');
      if (stored) {
        setShippingAddress(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const subtotal = orderItems?.reduce((s, i) => s + i?.price * i?.quantity, 0);
  const shipping = shippingCharge || (subtotal >= 125000 ? 0 : 999);
  const total = subtotal + shipping;

  // Delivery estimate: 3-5 business days from today
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 3);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 5);
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const deliveryEstimate = `${formatDate(minDate)} – ${formatDate(maxDate)}`;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Clear cart after order confirmation
  useEffect(() => {
    if (paymentId && cartItems?.length > 0) {
      const t = setTimeout(() => clearCart(), 2000);
      return () => clearTimeout(t);
    }
  }, [paymentId]);

  // Send confirmation email once
  useEffect(() => {
    if (!paymentId || emailSent) return;
    const userEmail = user?.email;
    if (!userEmail) return;
    setEmailSent(true);
    sendOrderConfirmationEmail({
      to: userEmail,
      orderNumber,
      customerName:
        user?.user_metadata?.full_name ||
        user?.email?.split('@')?.[0] ||
        'Valued Customer',
      items: orderItems,
      subtotal,
      shipping,
      total,
      paymentId,
    });
  }, [paymentId, user, emailSent]);

  return (
    <main className="bg-[#FBF7F2] min-h-screen overflow-x-hidden">
      <Header />
      <section className="pt-32 pb-24 px-6">
        <div className="mx-auto max-w-3xl">

          {/* Success Card */}
          <div
            className={`rounded-3xl border border-[rgba(184,92,56,0.12)] bg-white shadow-card overflow-hidden transition-all duration-700 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Top Banner */}
            <div className="bg-gradient-warm px-8 py-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                {[...Array(6)]?.map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-32 h-32 rounded-full border border-white"
                    style={{
                      top: `${(i * 17 + 10) % 100}%`,
                      left: `${(i * 23 + 5) % 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name="CheckCircleIcon" size={36} className="text-white" />
                </div>
                <h1 className="font-display italic text-3xl md:text-4xl font-semibold text-white mb-2">
                  Order Confirmed!
                </h1>
                <p className="text-white/80 text-sm">
                  Thank you for your purchase. Your handcrafted items are on their way.
                </p>
                {user?.email && (
                  <p className="text-white/60 text-xs mt-2">
                    Confirmation sent to{' '}
                    <span className="font-semibold text-white/80">{user?.email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Order Meta */}
            <div className="px-8 py-6 border-b border-[rgba(184,92,56,0.1)]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Order Number', value: `#${orderNumber}`, icon: 'HashtagIcon' },
                  { label: 'Payment ID', value: paymentId ? paymentId?.slice(-10)?.toUpperCase() : '—', icon: 'CreditCardIcon' },
                  { label: 'Est. Delivery', value: deliveryEstimate, icon: 'CalendarDaysIcon' },
                  { label: 'Payment', value: 'Razorpay', icon: 'ShieldCheckIcon' },
                ]?.map((d) => (
                  <div key={d?.label} className="text-center sm:text-left">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-1">
                      {d?.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{d?.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Summary */}
            <div className="px-8 py-6 border-b border-[rgba(184,92,56,0.1)]">
              <h2 className="font-display italic text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Icon name="ShoppingBagIcon" size={18} className="text-primary" />
                Items Ordered
              </h2>
              <div className="space-y-3">
                {orderItems?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2.5 border-b border-[rgba(184,92,56,0.06)] last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-cream flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon name="CubeIcon" size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item?.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item?.variant && `${item.variant} · `}Qty {item?.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      ₹{((item?.price * item?.quantity) / 100)?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 space-y-2.5 bg-[#FBF7F2] rounded-2xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">₹{(subtotal / 100)?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  {shipping === 0 ? (
                    <span className="font-semibold text-primary text-xs uppercase tracking-wide">Free</span>
                  ) : (
                    <span className="font-semibold text-foreground">₹{(shipping / 100)?.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex justify-between pt-2.5 border-t border-[rgba(184,92,56,0.1)]">
                  <span className="font-semibold text-foreground">Total Paid</span>
                  <span className="font-display italic text-xl font-semibold text-foreground">
                    ₹{(total / 100)?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="px-8 py-6 border-b border-[rgba(184,92,56,0.1)]">
              <h2 className="font-display italic text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Icon name="MapPinIcon" size={18} className="text-primary" />
                Shipping Address
              </h2>
              {shippingAddress ? (
                <div className="bg-[#FBF7F2] rounded-2xl p-4 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{shippingAddress.name}</p>
                  {shippingAddress.phone && (
                    <p className="text-xs text-muted-foreground">{shippingAddress.phone}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{shippingAddress.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {shippingAddress.city}, {shippingAddress.state} – {shippingAddress.pincode}
                  </p>
                </div>
              ) : (
                <div className="bg-[#FBF7F2] rounded-2xl p-4 flex items-center gap-3">
                  <Icon name="InformationCircleIcon" size={16} className="text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Shipping details will be confirmed via WhatsApp or email shortly.
                  </p>
                </div>
              )}
            </div>

            {/* Delivery & Tracking */}
            <div className="px-8 py-6 border-b border-[rgba(184,92,56,0.1)]">
              <h2 className="font-display italic text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Icon name="TruckIcon" size={18} className="text-primary" />
                Delivery & Tracking
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="bg-[#FBF7F2] rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-1">
                    Estimated Delivery
                  </p>
                  <p className="text-base font-semibold text-foreground">{deliveryEstimate}</p>
                  <p className="text-xs text-muted-foreground mt-1">3–5 business days</p>
                </div>
                <div className="bg-[#FBF7F2] rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-1">
                    Tracking
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {paymentId ? `AWB: ${paymentId?.slice(-8)?.toUpperCase()}` : 'Pending dispatch'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tracking link sent via WhatsApp
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-px bg-[rgba(184,92,56,0.15)]" />
                <div className="space-y-4">
                  {[
                    { icon: 'CheckCircleIcon', title: 'Order Confirmed', desc: 'Payment received successfully.', done: true },
                    { icon: 'CubeIcon', title: 'Processing', desc: 'Artisans are preparing your items (1–2 days).', done: false },
                    { icon: 'TruckIcon', title: 'Shipped', desc: 'Your order will be dispatched with tracking.', done: false },
                    { icon: 'HomeIcon', title: 'Delivered', desc: `Expected by ${formatDate(maxDate)}.`, done: false },
                  ]?.map((s, i) => (
                    <div key={i} className="flex items-start gap-4 pl-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                          s.done
                            ? 'bg-primary text-white'
                            : 'bg-white border-2 border-[rgba(184,92,56,0.2)] text-muted-foreground'
                        }`}
                      >
                        <Icon name={s.icon} size={14} />
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-semibold ${s.done ? 'text-primary' : 'text-foreground'}`}>
                          {s.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 py-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/products"
                className="flex-1 h-12 rounded-full bg-gradient-warm text-[#FBF7F2] text-xs font-semibold uppercase tracking-[0.2em] hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 shadow-warm"
              >
                <Icon name="ShoppingBagIcon" size={14} />
                Continue Shopping
              </Link>
              <Link
                href="/order-history"
                className="flex-1 h-12 rounded-full border border-[rgba(184,92,56,0.25)] text-foreground text-xs font-semibold uppercase tracking-[0.2em] hover:bg-accent-cream transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <Icon name="ClipboardDocumentListIcon" size={14} />
                View Orders
              </Link>
              <a
                href={`https://wa.me/919518770073?text=${encodeURIComponent(
                  `Hi PurelyJid! 🎉 I just placed order #${orderNumber}. Could you confirm the details and estimated delivery? Thank you!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-12 rounded-full bg-green-500 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-green-600 transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Us
              </a>
            </div>
          </div>

          {/* Craft Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground italic font-display">
              &ldquo;Every piece is made with love and intention — thank you for supporting handcraft.&rdquo;
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-[0.2em]">
              — The PurelyJid Team
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-[#FBF7F2] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading your order…</p>
          </div>
        </main>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
