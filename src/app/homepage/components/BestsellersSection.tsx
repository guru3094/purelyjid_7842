'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const bestsellers = [
{
  id: 1,
  name: 'Aurora Resin Pendant',
  category: 'Jewelry',
  price: '$38.00',
  originalPrice: '$48.00',
  rating: 4.9,
  reviews: 214,
  badge: 'Bestseller',
  badgeColor: 'bg-primary',
  image: "https://images.unsplash.com/photo-1676157211877-760c3d400217",
  alt: 'Aurora-colored resin pendant with purple and teal swirls on silver chain'
},
{
  id: 2,
  name: 'Galaxy Geode Tray',
  category: 'Home Décor',
  price: '$64.00',
  originalPrice: null,
  rating: 5.0,
  reviews: 89,
  badge: 'New',
  badgeColor: 'bg-secondary',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1545b4ef2-1771900598709.png",
  alt: 'Oval resin serving tray with deep blue and gold galaxy pattern'
},
{
  id: 3,
  name: 'Floral Resin Earrings',
  category: 'Jewelry',
  price: '$24.00',
  originalPrice: null,
  rating: 4.8,
  reviews: 341,
  badge: 'Popular',
  badgeColor: 'bg-accent-gold',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1bb068302-1772088252319.png",
  alt: 'Translucent resin earrings with real dried flower inclusions in teardrop shape'
},
{
  id: 4,
  name: 'Complete Starter Kit',
  category: 'DIY Supplies',
  price: '$52.00',
  originalPrice: '$68.00',
  rating: 4.9,
  reviews: 156,
  badge: 'Gift Idea',
  badgeColor: 'bg-primary',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_130a82f81-1772220075768.png",
  alt: 'Resin art starter kit with clear resin bottles, silicone molds, and color pigments'
},
{
  id: 5,
  name: 'Ocean Wave Coaster',
  category: 'Home Décor',
  price: '$42.00',
  originalPrice: null,
  rating: 5.0,
  reviews: 72,
  badge: 'New',
  badgeColor: 'bg-secondary',
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1545b4ef2-1771900598709.png",
  alt: 'Round resin coaster with ocean wave pattern in blues and white on marble'
}];


export default function BestsellersSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      const gsap = gsapModule?.gsap;
      const ScrollTrigger = stModule?.ScrollTrigger;
      gsap?.registerPlugin(ScrollTrigger);

      // Section header
      gsap?.fromTo('.bs-header',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.bs-header', start: 'top 88%' } }
      );

      // Horizontal scroll pinned
      if (trackRef?.current) {
        const track = trackRef?.current;
        const scrollWidth = track?.scrollWidth - window.innerWidth + 120;

        gsap?.to(track, {
          x: -scrollWidth,
          ease: 'none',
          scrollTrigger: {
            trigger: '#bestsellers-pin',
            start: 'top top',
            end: () => `+=${scrollWidth}`,
            scrub: 1.2,
            pin: true,
            invalidateOnRefresh: true,
            anticipatePin: 1
          }
        });
      }
    };
    init();
  }, []);

  return (
    <section className="bg-[#F2EBE1]" id="bestsellers">
      <div className="pt-24 pb-10 max-w-7xl mx-auto px-6">
        <div className="bs-header flex flex-col md:flex-row justify-between items-end gap-8 mb-12" style={{ opacity: 0 }}>
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Most Loved</p>
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter text-foreground leading-none">
              Bestsellers{' '}
              <span className="font-display italic font-normal text-muted-foreground">Archives.</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-5 text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
            
            Full Shop
            <span className="inline-block w-10 h-px bg-primary/40 group-hover:w-16 group-hover:bg-foreground transition-all duration-500" />
          </Link>
        </div>
      </div>
      <div id="bestsellers-pin" className="overflow-hidden">
        <div className="px-6 pb-24">
          <div ref={trackRef} className="h-scroll-track gap-8">
            {bestsellers?.map((product, index) =>
            <div
              key={product?.id}
              className={`w-[280px] md:w-[360px] shrink-0 product-card group ${index % 2 === 1 ? 'mt-16' : ''}`}>
              
                <Link href="/products" className="block space-y-5">
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-white shadow-card">
                    <AppImage
                    src={product?.image}
                    alt={product?.alt}
                    fill
                    className="object-cover product-card-img saturate-[0.85] group-hover:saturate-100 transition-all duration-1000"
                    sizes="(max-width: 768px) 280px, 360px" />
                  
                    {/* Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-white ${product?.badgeColor}`}>
                        {product?.badge}
                      </span>
                    </div>
                    {/* Quick add overlay */}
                    <div className="product-card-overlay absolute inset-0 bg-foreground/20 backdrop-blur-[2px] flex items-end justify-center pb-6">
                      <button className="px-6 py-3 rounded-full bg-white text-foreground text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-colors">
                        Quick Add
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 px-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{product?.category}</p>
                        <h3 className="font-display text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {product?.name}
                        </h3>
                      </div>
                      <button
                      aria-label={`Add ${product?.name} to wishlist`}
                      className="mt-1 w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center hover:bg-primary hover:border-primary transition-all flex-shrink-0"
                      onClick={(e) => e?.preventDefault()}>
                      
                        <Icon name="HeartIcon" size={14} className="text-primary hover:text-white" />
                      </button>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 })?.map((_, i) =>
                      <span key={i} className={i < Math.floor(product?.rating) ? 'star-filled text-sm' : 'text-muted-foreground text-sm'}>
                            ★
                          </span>
                      )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">({product?.reviews})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl font-bold text-primary">{product?.price}</span>
                      {product?.originalPrice &&
                    <span className="text-sm text-muted-foreground line-through">{product?.originalPrice}</span>
                    }
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

}