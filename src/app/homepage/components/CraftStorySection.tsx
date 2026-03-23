'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface StoryFeature {
  icon: string;
  title: string;
  desc: string;
}

interface StoryContent {
  title: string;
  subtitle: string;
  body: string;
  image_url: string;
  image_alt: string;
  quote: string;
  quote_author: string;
  extra_data: {
    founder_image?: string;
    founder_image_alt?: string;
    founder_title?: string;
    features?: StoryFeature[];
  };
}

const DEFAULT_STORY: StoryContent = {
  title: 'Art born from Pure Intention.',
  subtitle: 'The Perspective',
  body: 'PurelyJid started in a small Dallas kitchen in 2021. Jida Al-Rashid, a self-taught resin artist, began pouring her creativity into custom pieces for friends — and never stopped. Today, every item ships directly from her studio, still made by hand.',
  image_url: 'https://img.rocket.new/generatedImages/rocket_gen_img_131e1516a-1771900598704.png',
  image_alt: 'Artisan hands carefully pouring tinted resin into a circular mold with gold leaf',
  quote: 'Every piece holds the exact moment I poured it — no two will ever be the same.',
  quote_author: 'Jida Al-Rashid',
  extra_data: {
    founder_image: 'https://img.rocket.new/generatedImages/rocket_gen_img_175a7bad5-1772144105475.png',
    founder_image_alt: 'Jida, founder of PurelyJid, smiling woman with warm expression',
    founder_title: 'Founder, PurelyJid',
    features: [
      { icon: 'SparklesIcon', title: 'Hand-Poured', desc: 'Every piece made in small batches — never mass produced.' },
      { icon: 'GlobeAltIcon', title: 'Eco Pigments', desc: 'Non-toxic, skin-safe resin and natural mineral pigments.' },
      { icon: 'HeartIcon', title: 'Gift Ready', desc: 'Arrives in a signature PurelyJid keepsake box.' },
      { icon: 'StarIcon', title: '5-Star Studio', desc: 'Rated 4.9 across 2,400+ verified purchases.' },
    ],
  },
};

export default function CraftStorySection() {
  const imgRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const [story, setStory] = useState<StoryContent>(DEFAULT_STORY);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('story_content')
          .select('*')
          .eq('section_key', 'our_story')
          .single();
        if (data) {
          setStory({
            title: data.title || DEFAULT_STORY.title,
            subtitle: data.subtitle || DEFAULT_STORY.subtitle,
            body: data.body || DEFAULT_STORY.body,
            image_url: data.image_url || DEFAULT_STORY.image_url,
            image_alt: data.image_alt || DEFAULT_STORY.image_alt,
            quote: data.quote || DEFAULT_STORY.quote,
            quote_author: data.quote_author || DEFAULT_STORY.quote_author,
            extra_data: data.extra_data || DEFAULT_STORY.extra_data,
          });
        }
      } catch {
        // Use defaults on error
      }
    };
    fetchStory();
  }, []);

  useEffect(() => {
    const init = async () => {
      const gsapModule = await import('gsap');
      const stModule = await import('gsap/ScrollTrigger');
      const gsap = gsapModule.gsap;
      const ScrollTrigger = stModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      if (imgRef.current) {
        gsap.fromTo(imgRef.current,
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            duration: 1.6,
            ease: 'power4.inOut',
            scrollTrigger: { trigger: imgRef.current, start: 'top 70%' }
          }
        );
      }

      if (quoteRef.current) {
        gsap.fromTo(quoteRef.current,
          { opacity: 0, x: 40, y: 20 },
          {
            opacity: 1, x: 0, y: 0, duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: quoteRef.current, start: 'top 80%' }
          }
        );
      }

      gsap.utils.toArray<HTMLElement>('.story-reveal').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 1, delay: i * 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' }
          }
        );
      });
    };
    init();
  }, []);

  const features = story.extra_data?.features || DEFAULT_STORY.extra_data.features || [];

  return (
    <section className="py-32 md:py-48 px-6 relative overflow-hidden" id="story">
      <div className="absolute -top-4 -left-4 opacity-[0.03] font-display italic font-normal text-primary leading-none pointer-events-none select-none tracking-tighter z-0"
        style={{ fontSize: '22vw' }}>
        Story.
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left: Image + Quote */}
          <div className="lg:col-span-7 relative">
            <div ref={imgRef} className="aspect-[16/10] rounded-sm overflow-hidden shadow-warm" style={{ clipPath: 'inset(0 100% 0 0)' }}>
              <AppImage
                src={story.image_url}
                alt={story.image_alt}
                fill
                className="object-cover saturate-[0.7] sepia-[0.15] hover:saturate-100 hover:sepia-0 transition-all duration-1000"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>

            <div
              ref={quoteRef}
              className="absolute -bottom-12 md:-bottom-8 right-0 md:right-12 glass-card p-8 md:p-10 rounded-xl max-w-xs shadow-warm-lg"
              style={{ opacity: 0 }}>
              <span className="font-display italic text-5xl text-primary/10 absolute top-4 left-5 leading-none select-none">"</span>
              <p className="font-display italic text-xl md:text-2xl text-foreground leading-snug relative z-10 pt-4">
                &ldquo;{story.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                {story.extra_data?.founder_image && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <AppImage
                      src={story.extra_data.founder_image}
                      alt={story.extra_data.founder_image_alt || story.quote_author}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-foreground">{story.quote_author}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{story.extra_data?.founder_title || 'Founder, PurelyJid'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Story Content */}
          <div className="lg:col-span-5 lg:pl-10 pt-20 lg:pt-0 space-y-14">
            <div className="space-y-6 story-reveal" style={{ opacity: 0 }}>
              <p className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold flex items-center gap-3">
                <span className="inline-block w-6 h-px bg-primary" />
                {story.subtitle}
              </p>
              <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tighter leading-[0.9] text-foreground">
                {story.title.includes('Pure Intention') ? (
                  <>
                    Art born from<br />
                    <span className="font-display italic font-normal text-muted-foreground">Pure Intention.</span>
                  </>
                ) : story.title}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                {story.body}
              </p>
            </div>

            {features.length > 0 && (
              <div className="grid grid-cols-2 gap-10 story-reveal" style={{ opacity: 0 }}>
                {features.map((item) => (
                  <div key={item.title} className="group space-y-3">
                    <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                      <Icon name={item.icon as Parameters<typeof Icon>[0]['name']} size={18} className="text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="story-reveal" style={{ opacity: 0 }}>
              <Link
                href="/products"
                className="inline-flex items-center gap-4 px-8 py-4 rounded-full bg-foreground text-[#FAF6F0] text-xs font-bold uppercase tracking-[0.3em] hover:bg-primary transition-all duration-500 group">
                Explore the Studio
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
