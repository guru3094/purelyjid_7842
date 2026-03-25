'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_CONTENT = `Introduction
PurelyJid ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or make a purchase from us.

Information We Collect
We collect information you provide directly to us, including:
- Name, email address, and phone number when you place an order
- Shipping and billing address for order fulfillment
- Payment information (processed securely via Razorpay — we do not store card details)
- Order history and preferences
- Communications you send us (emails, messages)

How We Use Your Information
We use the information we collect to:
- Process and fulfill your orders
- Send order confirmations and shipping updates
- Respond to your inquiries and provide customer support
- Improve our products and website experience
- Send promotional communications (only with your consent)
- Comply with legal obligations

Sharing Your Information
We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website and fulfilling orders (such as courier partners and payment processors), subject to strict confidentiality agreements.

Cookies
Our website uses cookies to enhance your browsing experience, remember your cart, and analyze site traffic. You can choose to disable cookies through your browser settings, though this may affect certain features of the website.

Data Security
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment transactions are encrypted and processed through Razorpay's secure payment gateway.

Your Rights
You have the right to:
- Access the personal information we hold about you
- Request correction of inaccurate data
- Request deletion of your personal data
- Opt out of marketing communications at any time
- Lodge a complaint with a supervisory authority

Contact Us
If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us at Info@purelyjid.in.`;

export default function PrivacyPage() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase?.from('story_content')?.select('body')?.eq('section_key', 'privacy_policy')?.single();
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
            <span className="text-foreground font-medium">Privacy Policy</span>
          </div>

          <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Privacy Policy
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
