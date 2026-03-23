import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(196,120,90,0.12)] py-16 bg-[#FAF6F0]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          {/* Left: Logo + tagline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AppLogo size={44} />
            </div>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              Handcrafted resin art, made with love.
            </p>
          </div>

          {/* Center: Links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              { label: 'Shop', href: '/products' },
              { label: 'Collections', href: '/products' },
              { label: 'Our Story', href: '/homepage#story' },
              { label: 'Workshops', href: '/homepage#cta' },
              { label: 'Privacy', href: '/homepage' },
              { label: 'Terms', href: '/homepage' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Social + Copyright */}
          <div className="flex flex-col items-start md:items-end gap-4">
            <div className="flex gap-4">
              {[
                { icon: 'HeartIcon', label: 'Instagram' },
                { icon: 'StarIcon', label: 'Pinterest' },
                { icon: 'ChatBubbleLeftIcon', label: 'TikTok' },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300"
                >
                  <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={15} />
                </a>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              © 2026 PurelyJid. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}