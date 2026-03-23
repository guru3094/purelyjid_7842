'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { sendWelcomeEmail } from '@/lib/email';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!formData.fullName.trim()) return 'Full name is required.';
    if (formData.fullName.trim().length < 2) return 'Full name must be at least 2 characters.';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'A valid email address is required.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(formData.email.trim(), formData.password, { fullName: formData.fullName.trim() });
      // Send welcome email (non-blocking)
      sendWelcomeEmail({ to: formData.email.trim(), customerName: formData.fullName.trim() });
      showToast(`Welcome to PurelyJid, ${formData.fullName.split(' ')[0]}!`, 'success');
      router.push('/homepage');
      router.refresh();
    } catch (err: any) {
      const rawMsg = err?.message || '';
      const msg = rawMsg.toLowerCase().includes('rate limit')
        ? 'Too many sign-up attempts. Please wait a few minutes before trying again.' : rawMsg ||'Registration failed. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full h-11 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`;

  const passwordStrength = (() => {
    const p = formData.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-400', width: '25%' };
    if (p.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: '50%' };
    if (p.length < 12 || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Good', color: 'bg-amber-400', width: '75%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  })();

  return (
    <main className="min-h-screen bg-[#FAF6F0] flex overflow-hidden">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-warm relative flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-1/4 -left-16 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5" />

        <div className="relative z-10 text-center space-y-6 max-w-xs">
          <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
            <AppLogo size={80} />
          </div>
          <h2 className="font-display italic text-4xl font-semibold text-white leading-tight">
            Join the<br />Community
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Create your account to place orders, track purchases, and leave reviews on our handcrafted collection.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            {[
              { icon: 'ShoppingBagIcon', text: 'Easy order tracking' },
              { icon: 'StarIcon', text: 'Leave product reviews' },
              { icon: 'BellIcon', text: 'Order confirmation emails' },
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

        <div className="w-full max-w-md bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] shadow-card p-8 md:p-10">
          <h1 className="font-display italic text-3xl font-semibold text-foreground mb-1">
            Create account
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Join PurelyJid to place orders and save your favourites.
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
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Priya Sharma"
                className={inputClass}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className={`${inputClass} pr-11`}
                  autoComplete="new-password"
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
              {/* Password strength indicator */}
              {passwordStrength && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 bg-accent-cream rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{passwordStrength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                className={`${inputClass} ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-300'
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-400' :''
                }`}
                autoComplete="new-password"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <Icon name="UserPlusIcon" size={15} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Just browsing?{' '}
            <Link href="/products" className="font-semibold text-foreground hover:text-primary transition-colors">
              Continue as guest →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
