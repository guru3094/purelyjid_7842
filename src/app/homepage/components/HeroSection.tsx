'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

export default function HeroSection() {
  const heroImgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let gsap: typeof import('gsap').gsap;
    let ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;

    const init = async () => {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      gsap = gsapModule.gsap;
      ScrollTrigger = stModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      // Parallax on bg image
      if (heroImgRef.current) {
        gsap.to(heroImgRef.current, {
          yPercent: 25,
          ease: 'none',
          scrollTrigger: {
            trigger: heroImgRef.current.parentElement,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      // Badge entrance
      if (badgeRef.current) {
        gsap.fromTo(badgeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 0.3, ease: 'power3.out' }
        );
      }

      // Title word-by-word reveal
      if (titleRef.current) {
        const words = titleRef.current.querySelectorAll<HTMLElement>('.hero-word');
        gsap.fromTo(words,
        { opacity: 0, y: 60, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.12, delay: 0.5, ease: 'power4.out' }
        );
      }

      // Sub content
      if (subRef.current) {
        gsap.fromTo(subRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 1.2, ease: 'power3.out' }
        );
      }
    };

    init();
    return () => {

      // cleanup handled by GSAP
    };}, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#FAF6F0]">
      {/* Parallax Background */}
      <div ref={heroImgRef} className="absolute inset-0 z-0 scale-110 will-change-transform">
        <AppImage
          src="https://images.unsplash.com/photo-1554883732-e7a4a84d09b5"
          alt="Colorful handcrafted resin art pieces with vibrant swirling patterns"
          fill
          priority
          className="object-cover opacity-20 saturate-[0.6] sepia-[0.2]"
          sizes="100vw" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F0]/10 via-transparent to-[#FAF6F0]/90" />
      </div>

      {/* Floating decorative blobs */}
      <div className="absolute top-1/4 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl float-anim" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/3 right-16 w-48 h-48 rounded-full bg-secondary/10 blur-3xl float-anim" style={{ animationDelay: '3s' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6 space-y-10 pt-24">
        {/* Badge */}
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-white/60 backdrop-blur-md text-[10px] uppercase tracking-[0.45em] text-primary font-bold"
          style={{ opacity: 0 }}>
          
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Handcrafted with Love · Resin Art Studio
        </div>

        {/* Headline */}
        <h1
          ref={titleRef}
          className="font-display font-bold leading-[0.88] tracking-tighter"
          style={{ fontSize: 'clamp(4rem, 14vw, 14rem)' }}>
          
          <span className="hero-word block text-foreground" style={{ opacity: 0 }}>PURELY</span>
          <span className="hero-word block font-display italic font-normal text-muted-foreground opacity-60" style={{ opacity: 0 }}>
            JID.
          </span>
        </h1>

        {/* Sub content */}
        <div
          ref={subRef}
          className="flex flex-col md:flex-row items-center justify-center gap-10 pt-4"
          style={{ opacity: 0 }}>
          
          <p className="max-w-[300px] text-muted-foreground text-xs uppercase tracking-widest leading-relaxed text-left border-l-2 border-primary/30 pl-5">
            Where every pour tells a story. Unique resin art jewelry, home décor, and DIY supplies — no two pieces alike.
          </p>
          <div className="flex gap-4">
            <Link
              href="/products"
              className="group h-14 px-8 rounded-full bg-foreground text-[#FAF6F0] text-xs font-bold uppercase tracking-[0.3em] hover:bg-primary transition-all duration-500 flex items-center gap-3">
              
              Shop Now
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Link>
            <Link
              href="/homepage#story"
              className="h-14 w-14 rounded-full border border-primary/30 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 text-foreground text-lg"
              aria-label="Scroll to learn more">
              
              ↓
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 mt-20 w-full max-w-3xl mx-auto px-6">
        <div className="glass-card rounded-2xl px-8 py-5 flex flex-wrap items-center justify-center gap-8">
          {[
          { value: '2,400+', label: 'Happy Customers' },
          { value: '4.9★', label: 'Average Rating' },
          { value: '180+', label: 'Unique Designs' },
          { value: '100%', label: 'Handcrafted' }].
          map((stat) =>
          <div key={stat.label} className="text-center">
              <p className="font-display text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          )}
        </div>
      </div>
    </section>);

}