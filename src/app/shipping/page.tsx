'use client';
import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <Header />
      <div className="pt-28 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link href="/homepage" className="hover:text-primary transition-colors">Home</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-foreground font-medium">Shipping Policy</span>
          </div>

          <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Shipping Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated: March 2026</p>

          <div className="space-y-10 text-[15px] text-foreground leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Processing Time</h2>
              <p className="text-muted-foreground">
                All PurelyJid products are handcrafted to order. Please allow <strong className="text-foreground">3–7 business days</strong> for your order to be prepared and dispatched. During peak seasons or sale periods, processing may take up to 10 business days. You will receive an email notification once your order has been shipped.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Shipping Destinations</h2>
              <p className="text-muted-foreground mb-4">
                We currently ship across <strong className="text-foreground">India</strong>. International shipping is not available at this time but we are working on expanding our reach.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Estimated Delivery Times</h2>
              <div className="overflow-hidden rounded-2xl border border-[rgba(196,120,90,0.15)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[rgba(196,120,90,0.08)]">
                      <th className="text-left px-5 py-3 font-semibold text-foreground">Location</th>
                      <th className="text-left px-5 py-3 font-semibold text-foreground">Estimated Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { location: 'Metro Cities (Mumbai, Delhi, Bangalore, etc.)', time: '4–7 business days' },
                      { location: 'Tier 2 & Tier 3 Cities', time: '6–10 business days' },
                      { location: 'Remote / Rural Areas', time: '8–14 business days' },
                    ]?.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF6F0]'}>
                        <td className="px-5 py-3 text-muted-foreground">{row?.location}</td>
                        <td className="px-5 py-3 text-muted-foreground">{row?.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Delivery times are estimates and may vary due to courier delays, public holidays, or unforeseen circumstances.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Shipping Charges</h2>
              <p className="text-muted-foreground mb-3">
                Shipping charges are calculated at checkout based on your delivery location and order weight. We offer <strong className="text-foreground">free shipping on orders above ₹999</strong>.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Order Tracking</h2>
              <p className="text-muted-foreground">
                Once your order is dispatched, you will receive a tracking number via email. You can use this number to track your shipment on the courier partner's website. If you do not receive tracking information within 7 business days of placing your order, please contact us.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Damaged or Lost Shipments</h2>
              <p className="text-muted-foreground">
                We take great care in packaging each item. However, if your order arrives damaged or is lost in transit, please contact us at <a href="mailto:Info@purelyjid.in" className="text-primary hover:underline font-medium">Info@purelyjid.in</a> within <strong className="text-foreground">48 hours</strong> of delivery with photos of the damaged item and packaging. We will work with you to resolve the issue promptly.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                For any shipping-related queries, please reach out to us at{' '}
                <a href="mailto:Info@purelyjid.in" className="text-primary hover:underline font-medium">Info@purelyjid.in</a>.
                We aim to respond within 1–2 business days.
              </p>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
