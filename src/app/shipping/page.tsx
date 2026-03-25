'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_CONTENT = `Processing Time
All PurelyJid products are handcrafted to order. Please allow 3–7 business days for your order to be prepared and dispatched. During peak seasons or sale periods, processing may take up to 10 business days. You will receive an email notification once your order has been shipped.

Shipping Destinations
We currently ship across India. International shipping is not available at this time but we are working on expanding our reach.

Estimated Delivery Times
Metro Cities (Mumbai, Delhi, Bangalore, etc.): 4–7 business days
Tier 2 & Tier 3 Cities: 6–10 business days
Remote / Rural Areas: 8–14 business days

Shipping Charges
Shipping charges are calculated at checkout based on your delivery location and order weight. We offer free shipping on orders above ₹999.

Order Tracking
Once your order is dispatched, you will receive a tracking number via email. You can use this number to track your shipment on the courier partner's website. If you do not receive tracking information within 7 business days of placing your order, please contact us.

Damaged or Lost Shipments
We take great care in packaging each item. However, if your order arrives damaged or is lost in transit, please contact us at Info@purelyjid.in within 48 hours of delivery with photos of the damaged item and packaging. We will work with you to resolve the issue promptly.

Contact Us
For any shipping-related queries, please reach out to us at Info@purelyjid.in. We aim to respond within 1–2 business days.`;

export default function ShippingPage() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase?.from('story_content')?.select('body')?.eq('section_key', 'shipping_policy')?.single();
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
            <span className="text-foreground font-medium">Shipping Policy</span>
          </div>

          <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Shipping Policy
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
