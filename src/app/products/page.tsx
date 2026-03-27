import React, { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsHero from './components/ProductsHero';
import ProductsGrid from './components/ProductsGrid';
import GoogleReviewsSection from './components/GoogleReviewsSection';

export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  return (
    <main className="bg-[#FAF6F0] overflow-x-hidden">
      <Header />
      <ProductsHero />
      <Suspense fallback={<div className="py-24 flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>}>
        <ProductsGrid />
      </Suspense>
      <GoogleReviewsSection />
      <Footer />
    </main>
  );
}