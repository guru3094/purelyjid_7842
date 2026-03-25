'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface ShippingInfo {
  charge: number;
  deliveryDays: number | null;
  source: 'pincode' | 'zone' | 'default';
  zoneName?: string;
}

const DEFAULT_FREE_ABOVE = 125000; // ₹1,250 in paise
const DEFAULT_SHIPPING = 999; // ₹9.99 in paise

async function lookupShipping(pincode: string, city: string, area: string, subtotal: number): Promise<ShippingInfo> {
  if (!pincode || pincode.length !== 6) {
    return { charge: subtotal >= DEFAULT_FREE_ABOVE ? 0 : DEFAULT_SHIPPING, deliveryDays: null, source: 'default' };
  }
  try {
    const supabase = createClient();

    // 1. Check pincode-specific rule first
    const { data: pincodeData } = await supabase
      .from('delivery_pincodes')
      .select('extra_charge, free_shipping_above, delivery_days, is_active')
      .eq('pincode', pincode)
      .eq('is_active', true)
      .single();

    if (pincodeData) {
      const freeAbove = pincodeData.free_shipping_above || 0;
      const isFree = freeAbove > 0 ? subtotal >= freeAbove : pincodeData.extra_charge === 0;
      return {
        charge: isFree ? 0 : pincodeData.extra_charge,
        deliveryDays: pincodeData.delivery_days,
        source: 'pincode',
      };
    }

    // 2. Check zone rules (ordered by priority desc)
    const { data: zones } = await supabase
      .from('shipping_zones')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (zones && zones.length > 0) {
      const cityLower = city.toLowerCase();
      const areaLower = area.toLowerCase();

      for (const zone of zones) {
        let matches = false;
        if (zone.zone_type === 'city' && zone.city) {
          matches = cityLower.includes(zone.city.toLowerCase()) || zone.city.toLowerCase().includes(cityLower);
        } else if (zone.zone_type === 'state' && zone.state) {
          // state matching handled by city field fallback
          matches = false; // state not in form yet, skip
        } else if (zone.zone_type === 'area' && zone.area_keywords) {
          const keywords = zone.area_keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);
          matches = keywords.some((kw: string) => areaLower.includes(kw) || cityLower.includes(kw));
        }

        if (matches) {
          const freeAbove = zone.free_shipping_above || 0;
          const isFree = freeAbove > 0 ? subtotal >= freeAbove : zone.shipping_charge === 0;
          return {
            charge: isFree ? 0 : zone.shipping_charge,
            deliveryDays: zone.delivery_days,
            source: 'zone',
            zoneName: zone.zone_name,
          };
        }
      }
    }
  } catch {
    // silently fall through to default
  }

  // 3. Default fallback
  return {
    charge: subtotal >= DEFAULT_FREE_ABOVE ? 0 : DEFAULT_SHIPPING,
    deliveryDays: null,
    source: 'default',
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { cartItems, itemCount, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    charge: subtotal >= DEFAULT_FREE_ABOVE ? 0 : DEFAULT_SHIPPING,
    deliveryDays: null,
    source: 'default',
  });
  const [lookingUpShipping, setLookingUpShipping] = useState(false);

  // Brief loading for hydration
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Pre-fill email from logged-in user
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  // Auto-lookup shipping when pincode is complete
  const doShippingLookup = useCallback(async (pincode: string, city: string, address: string) => {
    setLookingUpShipping(true);
    const info = await lookupShipping(pincode, city, address, subtotal);
    setShippingInfo(info);
    setLookingUpShipping(false);
  }, [subtotal]);

  useEffect(() => {
    if (formData.pincode.length === 6) {
      doShippingLookup(formData.pincode, formData.city, formData.address);
    } else {
      setShippingInfo({ charge: subtotal >= DEFAULT_FREE_ABOVE ? 0 : DEFAULT_SHIPPING, deliveryDays: null, source: 'default' });
    }
  }, [formData.pincode, formData.city, formData.address, subtotal]);

  const shipping = shippingInfo.charge;
  const total = subtotal + shipping;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (paymentError) setPaymentError('');
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) newErrors.phone = '10-digit number required';
    if (!formData.address.trim()) newErrors.address = 'Required';
    if (!formData.city.trim()) newErrors.city = 'Required';
    if (!formData.state.trim()) newErrors.state = 'Required';
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) newErrors.pincode = '6-digit pincode required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!validate()) {
      showToast('Please fill in all required fields correctly.', 'error');
      return;
    }
    setLoading(true);
    setPaymentError('');

    try {
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey || razorpayKey === 'your-razorpay-key-id-here') {
        const msg = 'Payment gateway is not configured. Please contact support.';
        setPaymentError(msg);
        showToast(msg, 'error');
        setLoading(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        const msg = 'Failed to load payment gateway. Please check your connection and try again.';
        setPaymentError(msg);
        showToast(msg, 'error');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total / 100 }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || 'Failed to initiate payment. Please try again.';
        setPaymentError(msg);
        showToast(msg, 'error');
        setLoading(false);
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: 'PurelyJid',
        description: 'Handcrafted with care & intention',
        image: '/assets/images/app_logo.png',
        order_id: data.orderId,
        handler: (response: RazorpayResponse) => {
          clearCart();
          showToast('Payment successful! Redirecting…', 'success');
          router.push(
            `/order-confirmation?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`
          );
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#C4785A' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showToast('Payment cancelled. Your cart is still saved.', 'info');
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Catch SDK-level errors (invalid key, network issues, etc.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rzp as any).on('payment.failed', (response: any) => {
        const msg = response?.error?.description || 'Payment failed. Please try again.';
        setPaymentError(msg);
        showToast(msg, 'error');
        setLoading(false);
      });

      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setPaymentError(msg);
      showToast(msg, 'error');
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormData) =>
    `w-full h-11 px-4 rounded-xl border ${
      errors[field] ? 'border-red-400 bg-red-50/30' : 'border-[rgba(196,120,90,0.2)] bg-[#FAF6F0]'
    } text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`;

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  ];

  return (
    <main className="bg-[#FAF6F0] min-h-screen overflow-x-hidden">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-10 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/cart"
              className="text-[11px] uppercase tracking-[0.25em] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Icon name="ArrowLeftIcon" size={12} />
              Back to Cart
            </Link>
          </div>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground">
            Checkout
          </h1>
          {!isLoading && itemCount > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · Secure checkout
            </p>
          )}
        </div>
      </section>

      {/* Checkout Content */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-7xl">

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading checkout…</p>
            </div>
          ) : itemCount === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-accent-cream flex items-center justify-center mb-6">
                <Icon name="ShoppingBagIcon" size={32} className="text-primary" />
              </div>
              <h2 className="font-display italic text-2xl font-semibold text-foreground mb-3">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-8">
                Add some products to your cart before checking out.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors duration-300"
              >
                <Icon name="SparklesIcon" size={14} />
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_400px] gap-10">

              {/* Left: Form */}
              <div className="space-y-8">

                {paymentError && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
                    <Icon name="ExclamationCircleIcon" size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Payment Failed</p>
                      <p className="text-xs text-red-600 mt-0.5">{paymentError}</p>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 md:p-8">
                  <h2 className="font-display italic text-xl font-semibold text-foreground mb-6">
                    Contact Information
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Priya" className={inputClass('firstName')} autoComplete="given-name" />
                      {errors.firstName && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Sharma" className={inputClass('lastName')} autoComplete="family-name" />
                      {errors.lastName && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.lastName}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className={inputClass('email')} autoComplete="email" />
                      {errors.email && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit mobile number" className={inputClass('phone')} autoComplete="tel" maxLength={10} />
                      {errors.phone && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 md:p-8">
                  <h2 className="font-display italic text-xl font-semibold text-foreground mb-6">
                    Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                        Street Address <span className="text-red-400">*</span>
                      </label>
                      <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="House no., Street, Area" className={inputClass('address')} autoComplete="street-address" />
                      {errors.address && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.address}</p>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                          City <span className="text-red-400">*</span>
                        </label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai" className={inputClass('city')} autoComplete="address-level2" />
                        {errors.city && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                          Pincode <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="6-digit pincode" className={inputClass('pincode')} autoComplete="postal-code" maxLength={6} />
                          {lookingUpShipping && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        {errors.pincode && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.pincode}</p>}
                        {!errors.pincode && formData.pincode.length === 6 && !lookingUpShipping && (
                          <p className="mt-1.5 text-xs text-primary flex items-center gap-1">
                            <Icon name="CheckCircleIcon" size={12} />
                            {shippingInfo.source === 'pincode' ? 'Pincode-specific rate applied' : shippingInfo.source === 'zone' ? `Zone rate applied${shippingInfo.zoneName ? ` (${shippingInfo.zoneName})` : ''}` : 'Default shipping rate'}
                            {shippingInfo.deliveryDays ? ` · ${shippingInfo.deliveryDays} day${shippingInfo.deliveryDays !== 1 ? 's' : ''} delivery` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                        State <span className="text-red-400">*</span>
                      </label>
                      <select name="state" value={formData.state} onChange={handleChange} className={`${inputClass('state')} cursor-pointer`} autoComplete="address-level1">
                        <option value="">Select your state</option>
                        {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} />{errors.state}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Order Summary */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 sticky top-28">
                  <h2 className="font-display italic text-xl font-semibold text-foreground mb-5">
                    Order Summary
                  </h2>

                  <div className="space-y-4 mb-5">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-accent-cream shrink-0">
                          <AppImage src={item.image} alt={item.alt} width={56} height={56} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.variant}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground shrink-0">
                          ₹{((item.price * item.quantity) / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[rgba(196,120,90,0.1)] pt-4 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold text-foreground">₹{(subtotal / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        Shipping
                        {lookingUpShipping && <span className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin inline-block" />}
                      </span>
                      {shipping === 0 ? (
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">Free</span>
                      ) : (
                        <span className="font-semibold text-foreground">₹{(shipping / 100).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    {shippingInfo.source !== 'default' && (
                      <p className="text-[10px] text-muted-foreground text-right">
                        {shippingInfo.source === 'pincode' ? 'Pincode-specific rate' : `Zone: ${shippingInfo.zoneName || 'Matched zone'}`}
                      </p>
                    )}
                    <div className="flex justify-between pt-2.5 border-t border-[rgba(196,120,90,0.1)]">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-display italic text-xl font-bold text-foreground">
                        ₹{(total / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={loading || lookingUpShipping}
                    className="mt-6 w-full h-13 py-3.5 rounded-full bg-gradient-warm text-[#FAF6F0] text-xs font-bold uppercase tracking-[0.25em] hover:opacity-90 transition-all duration-300 shadow-warm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Icon name="LockClosedIcon" size={14} />
                        Pay ₹{(total / 100).toLocaleString('en-IN')}
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Icon name="LockClosedIcon" size={11} className="text-primary" />
                      Secure Payment
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Icon name="ShieldCheckIcon" size={11} className="text-primary" />
                      SSL Encrypted
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
