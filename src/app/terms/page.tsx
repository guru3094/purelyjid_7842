'use client';
import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <Header />
      <div className="pt-28 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link href="/homepage" className="hover:text-primary transition-colors">Home</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-foreground font-medium">Terms & Conditions</span>
          </div>

          <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated: March 2026</p>

          <div className="space-y-10 text-[15px] text-foreground leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using the PurelyJid website and placing an order, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our website.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Products</h2>
              <p className="text-muted-foreground">
                All products sold by PurelyJid are handcrafted and made to order. As each piece is unique, slight variations in color, texture, and design from product images are natural and expected. These variations are a hallmark of handmade artistry and are not considered defects.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Ordering & Payment</h2>
              <p className="text-muted-foreground mb-3">
                By placing an order, you confirm that all information provided is accurate and complete. We reserve the right to cancel orders in the event of pricing errors, stock unavailability, or suspected fraudulent activity.
              </p>
              <p className="text-muted-foreground">
                All payments are processed securely through Razorpay. We accept UPI, credit/debit cards, net banking, and other supported payment methods. Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Returns & Refunds</h2>
              <p className="text-muted-foreground mb-3">
                Since all items are made to order, we do not accept returns or exchanges unless the product is damaged or defective upon arrival. If you receive a damaged item, please contact us at{' '}
                <a href="mailto:Info@purelyjid.in" className="text-primary hover:underline font-medium">Info@purelyjid.in</a>{' '}
                within <strong className="text-foreground">48 hours</strong> of delivery with photographic evidence.
              </p>
              <p className="text-muted-foreground">
                Approved refunds will be processed within 7–10 business days to the original payment method.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Cancellations</h2>
              <p className="text-muted-foreground">
                Orders can be cancelled within <strong className="text-foreground">24 hours</strong> of placement. After this window, production may have already begun and cancellations cannot be guaranteed. To request a cancellation, please contact us immediately at{' '}
                <a href="mailto:Info@purelyjid.in" className="text-primary hover:underline font-medium">Info@purelyjid.in</a>.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content on this website, including images, designs, logos, and text, is the intellectual property of PurelyJid and is protected by applicable copyright laws. You may not reproduce, distribute, or use any content without our prior written consent.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                PurelyJid shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our total liability shall not exceed the amount paid for the specific order in question.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to update these Terms & Conditions at any time. Changes will be posted on this page with an updated date. Continued use of our website after changes constitutes acceptance of the revised terms.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                For any questions regarding these Terms & Conditions, please contact us at{' '}
                <a href="mailto:Info@purelyjid.in" className="text-primary hover:underline font-medium">Info@purelyjid.in</a>.
              </p>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
