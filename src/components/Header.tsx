'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut, loading } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) setUserMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      router.push('/homepage');
      router.refresh();
    } catch {}
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    setSearchQuery('');
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#FAF6F0]/90 backdrop-blur-xl py-3 shadow-sm border-b border-[rgba(196,120,90,0.12)]'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/homepage" className="flex items-center gap-2 group">
          <AppLogo size={40} />
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            { label: 'Shop', href: '/products' },
            { label: 'Collections', href: '/products' },
            { label: 'Custom', href: '/custom-products' },
            { label: 'Workshops', href: '/workshops' },
            { label: 'Our Story', href: '/homepage#story' },
          ]?.map((item) => (
            <Link
              key={item?.label}
              href={item?.href}
              className="text-[11px] uppercase tracking-[0.3em] font-semibold text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              {item?.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="h-9 w-44 sm:w-56 px-4 rounded-full border border-[rgba(196,120,90,0.3)] bg-white/90 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                aria-label="Search products"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <Icon name="MagnifyingGlassIcon" size={16} />
              </button>
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                aria-label="Close search"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent-cream transition-colors"
              >
                <Icon name="XMarkIcon" size={16} className="text-foreground" />
              </button>
            </form>
          ) : (
            <button
              aria-label="Search products"
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent-cream transition-colors"
            >
              <Icon name="MagnifyingGlassIcon" size={18} className="text-foreground" />
            </button>
          )}

          <Link
            href="/cart"
            aria-label={`Cart with ${itemCount} items`}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent-cream transition-colors"
          >
            <Icon name="ShoppingBagIcon" size={18} className="text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Auth Area */}
          {!loading && (
            user ? (
              <div className="relative hidden sm:block" data-user-menu>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 h-9 px-4 rounded-full border border-[rgba(196,120,90,0.2)] hover:border-primary transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon name="UserIcon" size={12} className="text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground max-w-[80px] truncate">{displayName}</span>
                  <Icon name="ChevronDownIcon" size={12} className="text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] shadow-lg py-2 z-50">
                    <Link
                      href="/order-history"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-[#FAF6F0] transition-colors"
                    >
                      <Icon name="ClipboardDocumentListIcon" size={15} className="text-muted-foreground" />
                      Order History
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-[#FAF6F0] transition-colors"
                    >
                      <Icon name="HeartIcon" size={15} className="text-muted-foreground" />
                      Wishlist
                    </Link>
                    <Link
                      href="/notification-preferences"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-[#FAF6F0] transition-colors"
                    >
                      <Icon name="BellIcon" size={15} className="text-muted-foreground" />
                      Notifications
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-[#FAF6F0] transition-colors"
                      >
                        <Icon name="Cog6ToothIcon" size={15} className="text-muted-foreground" />
                        Admin Panel
                      </Link>
                    )}
                    <div className="my-1 border-t border-[rgba(196,120,90,0.1)]" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Icon name="ArrowRightOnRectangleIcon" size={15} className="text-red-400" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-2 h-9 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors duration-300"
              >
                Sign In
              </Link>
            )
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden flex flex-col justify-center items-end gap-1.5 w-9 h-9 group"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`h-[1.5px] bg-foreground transition-all duration-300 ${menuOpen ? 'w-6 rotate-45 translate-y-1.5' : 'w-6'}`} />
            <span className={`h-[1.5px] bg-foreground transition-all duration-300 ${menuOpen ? 'opacity-0 w-4' : 'w-4'}`} />
            <span className={`h-[1.5px] bg-foreground transition-all duration-300 ${menuOpen ? 'w-6 -rotate-45 -translate-y-1.5' : 'w-6'}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-[#FAF6F0]/95 backdrop-blur-xl border-t border-[rgba(196,120,90,0.12)] px-6 py-6 space-y-5">
          {[
            { label: 'Shop All', href: '/products' },
            { label: 'Collections', href: '/products' },
            { label: 'Custom Products', href: '/custom-products' },
            { label: 'Workshops', href: '/workshops' },
            { label: 'Our Story', href: '/homepage#story' },
            { label: 'Cart', href: '/cart' },
          ]?.map((item) => (
            <Link
              key={item?.label}
              href={item?.href}
              className="block text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {item?.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[rgba(196,120,90,0.12)] space-y-4">
            {user ? (
              <>
                <Link
                  href="/order-history"
                  className="block text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Order History
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="block text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  className="block text-sm font-semibold uppercase tracking-[0.25em] text-red-500 hover:text-red-600 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}