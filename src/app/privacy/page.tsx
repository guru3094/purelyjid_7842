'use client';
import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <Header />
      <div className="pt-28 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link href="/homepage" className="hover:text-primary transition-colors">Home</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-foreground font-medium">Privacy Policy</span>
          </div>

          <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated: March 2026</p>

          <div className="space-y-10 text-[15px] text-foreground leading-relaxed">

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Introduction</h2>
              <p className="text-muted-foreground">
                PurelyJid ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or make a purchase from us.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Information We Collect</h2>
              <p className="text-muted-foreground mb-3">We collect information you provide directly to us, including:</p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  'Name, email address, and phone number when you place an order',
                  'Shipping and billing address for order fulfillment',
                  'Payment information (processed securely via Razorpay — we do not store card details)',
                  'Order history and preferences',
                  'Communications you send us (emails, messages)',
                ]?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-3">We use the information we collect to:</p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  'Process and fulfill your orders',
                  'Send order confirmations and shipping updates',
                  'Respond to your inquiries and provide customer support',
                  'Improve our products and website experience',
                  'Send promotional communications (only with your consent)',
                  'Comply with legal obligations',
                ]?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Sharing Your Information</h2>
              <p className="text-muted-foreground">
                We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website and fulfilling orders (such as courier partners and payment processors), subject to strict confidentiality agreements.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Cookies</h2>
              <p className="text-muted-foreground">
                Our website uses cookies to enhance your browsing experience, remember your cart, and analyze site traffic. You can choose to disable cookies through your browser settings, though this may affect certain features of the website.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment transactions are encrypted and processed through Razorpay's secure payment gateway.
              </p>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Your Rights</h2>
              <p className="text-muted-foreground mb-3">You have the right to:</p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  'Access the personal information we hold about you',
                  'Request correction of inaccurate data',
                  'Request deletion of your personal data',
                  'Opt out of marketing communications at any time',
                  'Lodge a complaint with a supervisory authority',
                ]?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <div className="border-t border-[rgba(196,120,90,0.12)]" />

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us at{' '}
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
