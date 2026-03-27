import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import CollectionsBentoSection from './components/CollectionsBentoSection';
import CraftStorySection from './components/CraftStorySection';
import BestsellersSection from './components/BestsellersSection';
import TestimonialsCTASection from './components/TestimonialsCTASection';
import InstagramFeedSection from './components/InstagramFeedSection';

export const dynamic = 'force-dynamic';

export default function HomepagePage() {
  return (
    <main className="bg-[#FAF6F0] overflow-x-hidden">
      <Header />
      <HeroSection />
      <CollectionsBentoSection />
      <CraftStorySection />
      <BestsellersSection />
      <InstagramFeedSection />
      <TestimonialsCTASection />
      <Footer />
    </main>
  );
}