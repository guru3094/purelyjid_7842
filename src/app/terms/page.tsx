import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    body: 'By accessing or using the PurelyJid website and placing an order, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our website.',
  },
  {
    title: 'Products',
    body: 'All products sold by PurelyJid are handcrafted and made to order. As each piece is unique, slight variations in color, texture, and design from product images are natural and expected. These variations are a hallmark of handmade artistry and are not considered defects.',
  },
  {
    title: 'Ordering & Payment',
    body: 'By placing an order, you confirm that all information provided is accurate and complete. We reserve the right to cancel orders in the event of pricing errors, stock unavailability, or suspected fraudulent activity.\n\nAll payments are processed securely through Razorpay. We accept UPI, credit/debit cards, net banking, and other supported payment methods. Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes.',
  },
  {
    title: 'Returns & Refunds',
    body: 'Since all items are made to order, we do not accept returns or exchanges unless the product is damaged or defective upon arrival. If you receive a damaged item, please contact us at Info@purelyjid.in within 48 hours of delivery with photographic evidence.\n\nApproved refunds will be processed within 7–10 business days to the original payment method.',
  },
  {
    title: 'Cancellations',
    body: 'Orders can be cancelled within 24 hours of placement. After this window, production may have already begun and cancellations cannot be guaranteed. To request a cancellation, please contact us immediately at Info@purelyjid.in.',
  },
  {
    title: 'Intellectual Property',
    body: 'All content on this website, including images, designs, logos, and text, is the intellectual property of PurelyJid and is protected by applicable copyright laws. You may not reproduce, distribute, or use any content without our prior written consent.',
  },
  {
    title: 'Limitation of Liability',
    body: 'PurelyJid shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our total liability shall not exceed the amount paid for the specific order in question.',
  },
  {
    title: 'Governing Law',
    body: 'These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.',
  },
  {
    title: 'Changes to Terms',
    body: 'We reserve the right to update these Terms & Conditions at any time. Changes will be posted on this page with an updated date. Continued use of our website after changes constitutes acceptance of the revised terms.',
  },
  {
    title: 'Contact Us',
    body: 'For any questions regarding these Terms & Conditions, please contact us at Info@purelyjid.in.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <Header />
      <div className="pt-28 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link href="/homepage" className="hover:text-primary transition-colors">Home</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-foreground font-medium">Terms &amp; Conditions</span>
          </div>

          <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated: March 2026</p>

          <div className="space-y-8">
            {SECTIONS?.map((section) => (
              <div key={section?.title}>
                <h2 className="text-lg font-semibold text-foreground mb-2">{section?.title}</h2>
                <p className="whitespace-pre-wrap text-[15px] text-muted-foreground leading-relaxed">{section?.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
