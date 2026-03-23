'use client';
import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';

export default function ProductsHero() {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      const gsap = gsapModule?.gsap;
      const ScrollTrigger = stModule?.ScrollTrigger;
      gsap?.registerPlugin(ScrollTrigger);

      if (imgRef?.current) {
        gsap?.to(imgRef?.current, {
          yPercent: 20,
          ease: 'none',
          scrollTrigger: {
            trigger: imgRef?.current?.parentElement,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      gsap?.fromTo('.ph-title',
      { opacity: 0, y: 50, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, delay: 0.3, ease: 'power4.out' }
      );
      gsap?.fromTo('.ph-sub',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, delay: 0.7, ease: 'power3.out' }
      );
    };
    init();
  }, []);

  return (
    <section className="relative h-[50vh] min-h-[380px] flex items-end overflow-hidden">
      {/* Parallax bg */}
      <div ref={imgRef} className="absolute inset-0 scale-110 will-change-transform z-0">
        <AppImage
          src="https://images.unsplash.com/photo-1554883732-e7a4a84d09b5"
          alt="Assorted handcrafted resin art pieces with vibrant colors arranged on cream surface"
          fill
          priority
          className="object-cover opacity-25 saturate-[0.7] sepia-[0.2]"
          sizes="100vw" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6F0] via-[#FAF6F0]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 pt-32 w-full">
        <p className="ph-sub text-[10px] uppercase tracking-[0.5em] text-primary font-bold mb-4" style={{ opacity: 0 }}>
          All Products
        </p>
        <h1 className="ph-title font-display text-6xl md:text-8xl font-bold tracking-tighter text-foreground leading-none" style={{ opacity: 0 }}>
          The Full <span className="font-display italic font-normal text-muted-foreground">Collection.</span>
        </h1>
      </div>
    </section>);

}