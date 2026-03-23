'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

const collections = [
{
  id: 1,
  title: 'Ocean Wave Jewelry',
  subtitle: 'Wearable Art',
  tag: 'Bestseller',
  tagColor: 'bg-primary text-white',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_17bb190e0-1772159189121.png",
  alt: 'Teal and gold ocean wave resin pendant necklace on marble surface',
  spanClass: 'bento-span-2',
  textSize: 'text-3xl md:text-4xl'
},
{
  id: 2,
  title: 'Geode Coasters',
  subtitle: 'Home Décor',
  tag: 'New',
  tagColor: 'bg-secondary text-white',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1dde700b1-1764988065715.png",
  alt: 'Purple and gold geode-inspired resin coaster set on wooden table',
  spanClass: '',
  textSize: 'text-2xl'
},
{
  id: 3,
  title: 'Resin Earrings',
  subtitle: 'Accessories',
  tag: 'Popular',
  tagColor: 'bg-accent-gold text-white',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_18dbf06a9-1772088171804.png",
  alt: 'Colorful handmade resin drop earrings with floral inclusions',
  spanClass: '',
  textSize: 'text-2xl'
},
{
  id: 4,
  title: 'DIY Craft Kits',
  subtitle: 'Make Your Own',
  tag: 'Gift Idea',
  tagColor: 'bg-primary text-white',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1b291dd70-1767114631691.png",
  alt: 'Resin craft kit with molds, pigments, and tools laid out on white background',
  spanClass: 'bento-span-2',
  textSize: 'text-3xl md:text-4xl'
},
{
  id: 5,
  title: 'Resin Bookmarks',
  subtitle: 'Stationery',
  tag: 'Trending',
  tagColor: 'bg-secondary text-white',
  image: "https://images.unsplash.com/photo-1630724947947-61397446cd1d",
  alt: 'Delicate resin bookmarks with pressed flowers and gold leaf on open book',
  spanClass: '',
  textSize: 'text-2xl'
}];


export default function CollectionsBentoSection() {
  useEffect(() => {
    const init = async () => {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      const gsap = gsapModule?.gsap;
      const ScrollTrigger = stModule?.ScrollTrigger;
      gsap?.registerPlugin(ScrollTrigger);

      gsap?.to('.bento-item', {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: '.bento-grid',
          start: 'top 80%'
        }
      });

      gsap?.fromTo('.bento-section-title',
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.bento-section-title', start: 'top 88%' }
      }
      );
    };
    init();
  }, []);

  return (
    <section className="py-24 md:py-36 px-6 bg-[#F2EBE1]" id="collections">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="bento-section-title mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6" style={{ opacity: 0 }}>
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Our Collections</p>
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-foreground leading-none">
              Crafted for <br />
              <span className="font-display italic font-normal text-muted-foreground">Every Moment.</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-5 text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
            
            View All Products
            <span className="inline-block w-10 h-px bg-primary/40 group-hover:w-16 group-hover:bg-foreground transition-all duration-500" />
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {collections?.map((col) =>
          <div
            key={col?.id}
            className={`bento-item ${col?.spanClass} relative overflow-hidden rounded-2xl group cursor-pointer`}
            style={{ opacity: 0, minHeight: '280px' }}>
            
              <Link href="/products" className="block w-full h-full absolute inset-0 z-10" aria-label={`Shop ${col?.title}`} />
              {/* Image */}
              <div className="absolute inset-0 overflow-hidden">
                <AppImage
                src={col?.image}
                alt={col?.alt}
                fill
                className="object-cover product-card-img saturate-[0.85] group-hover:saturate-100 transition-all duration-1000"
                sizes="(max-width: 768px) 100vw, 50vw" />
              
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A1F1A]/70 via-transparent to-transparent" />
              </div>

              {/* Tag */}
              <div className="absolute top-4 left-4 z-20">
                <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] ${col?.tagColor}`}>
                  {col?.tag}
                </span>
              </div>

              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <p className="text-[9px] uppercase tracking-[0.35em] text-white/60 mb-1">{col?.subtitle}</p>
                <h3 className={`font-display font-bold text-white tracking-tight ${col?.textSize}`}>{col?.title}</h3>
              </div>

              {/* Hover arrow */}
              <div className="product-card-overlay absolute bottom-6 right-6 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                →
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}