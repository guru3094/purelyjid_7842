'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useCart } from '@/contexts/CartContext';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, itemCount, subtotal } = useCart();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate brief loading state for hydration
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const shipping = subtotal >= 125000 ? 0 : 999;
  const total = subtotal + shipping;

  return (
    <main className="bg-[#FAF6F0] min-h-screen overflow-x-hidden">
      <Header />
      {/* Page Header */}
      <section className="pt-32 pb-10 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/products"
              className="text-[11px] uppercase tracking-[0.25em] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Icon name="ArrowLeftIcon" size={12} />
              Continue Shopping
            </Link>
          </div>
          <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground">
            Your Cart
          </h1>
          {!isLoading && itemCount > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
          )}
        </div>
      </section>
      {/* Cart Content */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-7xl">

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your cart…</p>
            </div>
          ) : cartItems?.length === 0 ? (
            /* Empty State */
            (<div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-accent-cream flex items-center justify-center mb-6">
                <Icon name="ShoppingBagIcon" size={32} className="text-primary" />
              </div>
              <h2 className="font-display italic text-2xl font-semibold text-foreground mb-3">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mb-8">
                Discover our handcrafted resin art collection and find something you love.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors duration-300"
              >
                <Icon name="SparklesIcon" size={14} />
                Shop Now
              </Link>
            </div>)
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
              {/* Product List */}
              <div className="space-y-4">
                {/* Free shipping banner */}
                {subtotal < 125000 ? (
                  <div className="rounded-xl bg-accent-cream border border-[rgba(196,120,90,0.15)] px-5 py-3.5 flex items-center gap-3">
                    <Icon name="TruckIcon" size={16} className="text-primary flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Add{' '}
                      <span className="font-semibold text-foreground">₹{((125000 - subtotal) / 100)?.toFixed(0)}</span>{' '}
                      more for <span className="font-semibold text-primary">free shipping</span>
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-accent-cream border border-[rgba(196,120,90,0.15)] px-5 py-3.5 flex items-center gap-3">
                    <Icon name="CheckCircleIcon" size={16} className="text-primary flex-shrink-0" />
                    <p className="text-xs font-semibold text-primary">
                      You&apos;ve unlocked free shipping! 🎉
                    </p>
                  </div>
                )}

                {/* Cart Items */}
                <div className="divide-y divide-[rgba(196,120,90,0.1)] rounded-2xl border border-[rgba(196,120,90,0.12)] bg-white overflow-hidden shadow-card">
                  {cartItems?.map((item) => (
                    <div key={item?.id} className="flex gap-5 p-5 sm:p-6 group">
                      <Link href="/products" className="flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-accent-cream">
                          <AppImage
                            src={item?.image}
                            alt={item?.alt}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-muted-foreground mb-0.5">
                              {item?.category}
                            </p>
                            <h3 className="font-display italic text-base sm:text-lg font-semibold text-foreground leading-tight">
                              {item?.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">{item?.variant}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item?.id)}
                            aria-label={`Remove ${item?.name} from cart`}
                            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-accent-cream transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Icon name="XMarkIcon" size={14} className="text-muted-foreground" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-0 rounded-full border border-[rgba(196,120,90,0.2)] overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item?.id, -1)}
                              aria-label={`Decrease quantity of ${item?.name}`}
                              className="w-8 h-8 flex items-center justify-center hover:bg-accent-cream transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <Icon name="MinusIcon" size={12} />
                            </button>
                            <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-foreground border-x border-[rgba(196,120,90,0.2)]">
                              {item?.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item?.id, 1)}
                              aria-label={`Increase quantity of ${item?.name}`}
                              className="w-8 h-8 flex items-center justify-center hover:bg-accent-cream transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <Icon name="PlusIcon" size={12} />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-foreground text-base">
                              ₹{((item?.price * item?.quantity) / 100)?.toFixed(2)}
                            </p>
                            {item?.quantity > 1 && (
                              <p className="text-xs text-muted-foreground">
                                ₹{(item?.price / 100)?.toFixed(2)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-28">
                <div className="rounded-2xl border border-[rgba(196,120,90,0.12)] bg-white shadow-card overflow-hidden">
                  <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.1)]">
                    <h2 className="font-display italic text-xl font-semibold text-foreground">
                      Order Summary
                    </h2>
                  </div>

                  <div className="px-6 py-5 space-y-3.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                      </span>
                      <span className="font-semibold text-foreground">₹{(subtotal / 100)?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      {shipping === 0 ? (
                        <span className="font-semibold text-primary text-xs uppercase tracking-wide">Free</span>
                      ) : (
                        <span className="font-semibold text-foreground">₹{(shipping / 100)?.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Taxes</span>
                      <span className="text-xs text-muted-foreground">Calculated at checkout</span>
                    </div>

                    <div className="border-t border-[rgba(196,120,90,0.1)] pt-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Estimated Total</span>
                        <span className="font-display italic text-2xl font-semibold text-foreground">
                          ₹{(total / 100)?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 space-y-3">
                    <Link
                      href="/checkout"
                      className="w-full h-13 py-3.5 rounded-full bg-gradient-warm text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 shadow-warm"
                    >
                      <Icon name="LockClosedIcon" size={13} />
                      Proceed to Checkout
                    </Link>
                    <Link
                      href="/products"
                      className="w-full h-11 rounded-full border border-[rgba(196,120,90,0.25)] text-foreground text-xs font-semibold uppercase tracking-[0.2em] hover:bg-accent-cream transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  <div className="px-6 pb-6 pt-1">
                    <div className="rounded-xl bg-[#FAF6F0] p-4 space-y-2.5">
                      {[
                        { icon: 'ShieldCheckIcon', text: 'Secure checkout with SSL encryption' },
                        { icon: 'ArrowPathIcon', text: 'Free returns within 30 days' },
                        { icon: 'SparklesIcon', text: 'Handcrafted with care & intention' }
                      ]?.map((badge) => (
                        <div key={badge?.text} className="flex items-center gap-2.5">
                          <Icon name={badge?.icon} size={13} className="text-primary flex-shrink-0" />
                          <span className="text-[11px] text-muted-foreground">{badge?.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="mt-4 rounded-2xl border border-[rgba(196,120,90,0.12)] bg-white shadow-card px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                    Promo Code
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="flex-1 h-10 px-4 rounded-full border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <button className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors duration-300">
                      Apply
                    </button>
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
