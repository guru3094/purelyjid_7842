'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_CONTENT = `Acceptance of Terms
By accessing or using the PurelyJid website and placing an order, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our website.

Products
All products sold by PurelyJid are handcrafted and made to order. As each piece is unique, slight variations in color, texture, and design from product images are natural and expected. These variations are a hallmark of handmade artistry and are not considered defects.

Ordering & Payment
By placing an order, you confirm that all information provided is accurate and complete. We reserve the right to cancel orders in the event of pricing errors, stock unavailability, or suspected fraudulent activity.

All payments are processed securely through Razorpay. We accept UPI, credit/debit cards, net banking, and other supported payment methods. Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes.

Returns & Refunds
Since all items are made to order, we do not accept returns or exchanges unless the product is damaged or defective upon arrival. If you receive a damaged item, please contact us at Info@purelyjid.in within 48 hours of delivery with photographic evidence.

Approved refunds will be processed within 7–10 business days to the original payment method.

Cancellations
Orders can be cancelled within 24 hours of placement. After this window, production may have already begun and cancellations cannot be guaranteed. To request a cancellation, please contact us immediately at Info@purelyjid.in.

Intellectual Property
All content on this website, including images, designs, logos, and text, is the intellectual property of PurelyJid and is protected by applicable copyright laws. You may not reproduce, distribute, or use any content without our prior written consent.

Limitation of Liability
PurelyJid shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our total liability shall not exceed the amount paid for the specific order in question.

Governing Law
These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.

Changes to Terms
We reserve the right to update these Terms & Conditions at any time. Changes will be posted on this page with an updated date. Continued use of our website after changes constitutes acceptance of the revised terms.

Contact Us
For any questions regarding these Terms & Conditions, please contact us at Info@purelyjid.in.`;

export default function TermsPage() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase?.from('story_content')?.select('body')?.eq('section_key', 'terms_conditions')?.single();
        setContent(data?.body || null);
      } catch {
        setContent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const displayContent = content || DEFAULT_CONTENT;

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

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4]?.map((i) => (
                <div key={i} className="h-4 bg-[rgba(196,120,90,0.1)] rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-[15px] text-muted-foreground leading-relaxed">
              {displayContent}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
