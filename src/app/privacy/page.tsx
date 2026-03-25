import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';

const SECTIONS = [
  {
    title: 'Introduction',
    body: 'PurelyJid ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or make a purchase from us.',
  },
  {
    title: 'Information We Collect',
    body: 'We collect information you provide directly to us, including:',
    list: [
      'Name, email address, and phone number when you place an order',
      'Shipping and billing address for order fulfillment',
      'Payment information (processed securely via Razorpay — we do not store card details)',
      'Order history and preferences',
      'Communications you send us (emails, messages)',
    ],
  },
  {
    title: 'How We Use Your Information',
    body: 'We use the information we collect to:',
    list: [
      'Process and fulfill your orders',
      'Send order confirmations and shipping updates',
      'Respond to your inquiries and provide customer support',
      'Improve our products and website experience',
      'Send promotional communications (only with your consent)',
      'Comply with legal obligations',
    ],
  },
  {
    title: 'Sharing Your Information',
    body: 'We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website and fulfilling orders (such as courier partners and payment processors), subject to strict confidentiality agreements.',
  },
  {
    title: 'Cookies',
    body: 'Our website uses cookies to enhance your browsing experience, remember your cart, and analyze site traffic. You can choose to disable cookies through your browser settings, though this may affect certain features of the website.',
  },
  {
    title: 'Data Security',
    body: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment transactions are encrypted and processed through Razorpay\'s secure payment gateway.',
  },
  {
    title: 'Your Rights',
    body: 'You have the right to:',
    list: [
      'Access the personal information we hold about you',
      'Request correction of inaccurate data',
      'Request deletion of your personal data',
      'Opt out of marketing communications at any time',
      'Lodge a complaint with a supervisory authority',
    ],
  },
  {
    title: 'Contact Us',
    body: 'If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us at Info@purelyjid.in.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <Header />
      <div className="pt-28 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link href="/homepage" className="hover:text-primary transition-colors">Home</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-foreground font-medium">Privacy Policy</span>
          </div>

          <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated: March 2026</p>

          <div className="space-y-8">
            {SECTIONS?.map((section) => (
              <div key={section?.title}>
                <h2 className="text-lg font-semibold text-foreground mb-2">{section?.title}</h2>
                {section?.body && (
                  <p className="text-[15px] text-muted-foreground leading-relaxed mb-2">{section?.body}</p>
                )}
                {section?.list && (
                  <ul className="list-disc list-inside space-y-1 text-[15px] text-muted-foreground leading-relaxed">
                    {section?.list?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
