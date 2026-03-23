'use client';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/homepage';
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      showToast('Welcome back!', 'success');
      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      const rawMsg = err?.message || '';
      const msg = rawMsg.toLowerCase().includes('rate limit')
        ? 'Too many attempts. Please wait a few minutes before trying again.' : rawMsg ||'Invalid email or password. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full h-11 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`;

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] shadow-card p-8 md:p-10">
      <h1 className="font-display italic text-3xl font-semibold text-foreground mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Sign in to place orders and track your purchases.
      </p>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
          <Icon name="ExclamationCircleIcon" size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
            placeholder="you@example.com"
            className={inputClass}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
              placeholder="Your password"
              className={`${inputClass} pr-11`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <Icon name="ArrowRightOnRectangleIcon" size={15} />
              Sign In
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href={`/register${redirect !== '/homepage' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>

      {redirect === '/checkout' && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Login required to checkout.</span>{' '}
            New here?{' '}
            <Link href="/register?redirect=/checkout" className="font-bold text-amber-800 hover:underline">
              Register for free
            </Link>{' '}
            — it only takes a moment.
          </p>
        </div>
      )}

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Just browsing?{' '}
        <Link href="/products" className="font-semibold text-foreground hover:text-primary transition-colors">
          Continue as guest →
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#FAF6F0] flex overflow-hidden">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-warm relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-1/4 -left-16 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5" />

        <div className="relative z-10 text-center space-y-6 max-w-xs">
          <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
            <AppLogo size={80} />
          </div>
          <h2 className="font-display italic text-4xl font-semibold text-white leading-tight">
            Handcrafted<br />with Love
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Where every pour tells a story. Unique resin art jewelry, home décor, and DIY supplies — no two pieces alike.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            {[
              { icon: 'SparklesIcon', text: '180+ Unique Designs' },
              { icon: 'StarIcon', text: '4.9★ Average Rating' },
              { icon: 'HeartIcon', text: '2,400+ Happy Customers' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white/70 text-sm">
                <Icon name={item.icon} size={15} className="text-accent-gold shrink-0" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <Link href="/homepage" className="flex items-center gap-2 mb-10 group lg:hidden">
          <AppLogo size={48} />
        </Link>
        <Suspense fallback={<div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
