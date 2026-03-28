'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const testimonials = [
{
  id: 1,
  name: 'Sumit Jadhav',
  location: 'Pune, India',
  rating: 5,
  text: "I absolutely loved the work! 🌟 The resin clock and the illuminated wedding lamp are both extremely creative and beautifully crafted. The attention to detail—right from the preserved flowers to the embedded pearls and lights—is impressive. It’s clear a lot of love and thought has gone into making these.The clock looks elegant and unique, perfect as a decor piece. And the glowing photo frame is not only visually stunning but also emotionally touching—it truly brings the memory to life! Highly recommended for anyone looking for personalized, and meaningful gifts. Excellent craftsmanship and creativity! 👏",
  avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  product: 'Resin Wall Clock',
  verified: true
},
{
  id: 2,
  name: 'Caroline Joseph',
  location: 'Pune, India',
  rating: 5,
  text: "I had such a lovely experience getting the wedding garland preserved in resin. The consultation felt really easy and comforting, and explaining to us about the after care. Design discussion was so nice, they even incorporated some of the changes I needed and it was done perfectly. The final process was beautiful and elegant. Definitely recommend to get your special moments preserved. Thank you so much Purely Jid 😊😃",
  avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  product: 'Compartment Resin Varmala Frame',
  verified: true
},
{
  id: 3,
  name: 'Neha Nagade',
  location: 'Pune, India',
  rating: 5,
  text: "We had our wedding garlands preserved here, and the results are stunning. She is truly the best at what she does! We are so grateful to have our wedding memories kept alive forever in such a beautiful frame. Thank you so much for this incredible keepsake.",
  avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  product: 'Rectangle Frame',
  verified: true
},
{id: 4,
  name: 'Siddharth Kolap',
  location: 'Pune, India',
  rating: 5,
  text: "I recently got some flowers preserved here, and I’m really happy with how the final product turned out. The resin work is clean, clear, and well-finished, and the flowers have been arranged very neatly. The whole process was smooth, and they handled everything professionally and Kept me updated through every step. If you’re looking to preserve something meaningful, this place does a really good job",
  avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  product: 'Square Frame',
  verified: true}
];


export default function TestimonialsCTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      const gsap = gsapModule?.gsap;
      const ScrollTrigger = stModule?.ScrollTrigger;
      gsap?.registerPlugin(ScrollTrigger);

      gsap?.utils?.toArray<HTMLElement>('.testimonial-card')?.forEach((card, i) => {
        gsap?.fromTo(card,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.9, delay: i * 0.15, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%' }
        }
        );
      });

      gsap?.fromTo('.testi-header',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.testi-header', start: 'top 88%' } }
      );

      if (sectionRef?.current) {
        gsap?.fromTo(sectionRef?.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: sectionRef?.current, start: 'top 80%' } }
        );
      }
    };
    init();
  }, []);

  return (
    <>
      {/* Testimonials */}
      <section className="py-28 px-6 bg-[#FAF6F0]">
        <div className="mx-auto max-w-7xl">
          <div className="testi-header text-center mb-16 space-y-4" style={{ opacity: 0 }}>
            <p className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">What They Say</p>
            <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tighter text-foreground">
              Real People, <span className="font-display italic font-normal text-muted-foreground">Real Joy.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials?.map((t) =>
            <div
              key={t?.id}
              className="testimonial-card p-8 bg-white rounded-2xl border border-[rgba(196,120,90,0.1)] shadow-card hover:shadow-warm transition-all duration-500 space-y-6"
              style={{ opacity: 0 }}>
              
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t?.rating })?.map((_, i) =>
                <span key={i} className="star-filled text-base">★</span>
                )}
                </div>

                {/* Quote */}
                <p className="text-sm text-muted-foreground leading-relaxed">"{t?.text}"</p>

                {/* Product */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Purchased:</span>
                  <span className="text-[9px] text-muted-foreground">{t?.product}</span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-[rgba(196,120,90,0.1)]">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <AppImage src={t?.avatar} alt={t?.avatarAlt} width={40} height={40} className="object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{t?.name}</p>
                      {t?.verified &&
                    <Icon name="CheckBadgeIcon" size={14} variant="solid" className="text-primary" />
                    }
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t?.location}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Dark CTA Section */}
      <section className="py-20 md:py-28 px-6 bg-[#FAF6F0]" id="cta">
        <div className="mx-auto max-w-7xl">
          <div
            ref={sectionRef}
            className="relative overflow-hidden rounded-3xl px-8 py-20 text-center text-white border border-white/10 shadow-warm-lg noise-overlay"
            style={{ background: 'linear-gradient(135deg, #2A1F1A 0%, #3D2E27 100%)', opacity: 0 }}>
            
            <div className="cta-glow" />

            {/* Floating decorative */}
            <div className="absolute top-8 left-12 opacity-20 float-anim hidden lg:block" style={{ animationDelay: '0s' }}>
              <Icon name="SparklesIcon" size={44} className="text-primary" />
            </div>
            <div className="absolute bottom-8 right-16 opacity-15 float-anim hidden lg:block" style={{ animationDelay: '2.5s' }}>
              <Icon name="StarIcon" size={52} className="text-accent-gold" />
            </div>
            <div className="absolute top-16 right-24 opacity-10 float-anim hidden lg:block" style={{ animationDelay: '5s' }}>
              <Icon name="HeartIcon" size={36} className="text-primary" />
            </div>

            <div className="relative z-10 mx-auto max-w-3xl space-y-8">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/60">Workshop spots open</span>
              </div>

              <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
                Ready to create <br />
                <span className="font-display italic font-normal bg-gradient-to-r from-primary to-accent-gold bg-clip-text text-transparent">
                  something beautiful?
                </span>
              </h2>

              <p className="text-lg text-white/50 max-w-xl mx-auto font-light leading-relaxed">
                Join 2,400+ customers who've discovered the magic of resin art — whether you're buying a one-of-a-kind piece or learning to pour your own.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link
                  href="/products"
                  className="group inline-flex h-14 items-center justify-center rounded-full bg-white px-10 text-sm font-bold text-foreground hover:bg-primary hover:text-white transition-all duration-500 uppercase tracking-[0.2em] gap-3">
                  
                  Shop the Collection
                  <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Link>
                <Link
                  href="/homepage#cta"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-white/20 px-10 text-sm font-medium text-white hover:bg-white/10 backdrop-blur-sm transition-all uppercase tracking-[0.2em]">
                  
                  Join a Workshop
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-10 border-t border-white/5 pt-10">
                {[
                { v: '2,400+', l: 'Happy Customers' },
                { v: '4.9 / 5', l: 'Avg. Rating' },
                { v: 'Free', l: 'US Shipping $50+' }]?.
                map((s) =>
                <div key={s?.l} className="text-center">
                    <p className="font-display text-2xl font-bold text-white">{s?.v}</p>
                    <p className="text-[9px] uppercase tracking-widest text-white/40 mt-0.5">{s?.l}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>);

}