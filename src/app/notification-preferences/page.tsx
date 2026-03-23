'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';

interface NotificationPrefs {
  order_updates: boolean;
  promotional_emails: boolean;
  new_arrivals: boolean;
  review_responses: boolean;
  weekly_digest: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  order_updates: true,
  promotional_emails: true,
  new_arrivals: false,
  review_responses: true,
  weekly_digest: false,
  sms_notifications: false,
  push_notifications: false,
};

const PREF_GROUPS = [
  {
    title: 'Order & Account',
    icon: 'ShoppingBagIcon',
    items: [
      { key: 'order_updates', label: 'Order Updates', description: 'Get notified when your order status changes — shipped, delivered, etc.' },
      { key: 'review_responses', label: 'Review Responses', description: 'Receive alerts when someone responds to your product reviews.' },
    ],
  },
  {
    title: 'Marketing & Promotions',
    icon: 'TagIcon',
    items: [
      { key: 'promotional_emails', label: 'Promotional Emails', description: 'Exclusive discounts, flash sales, and special offers.' },
      { key: 'new_arrivals', label: 'New Arrivals', description: 'Be the first to know when new products are added to the store.' },
      { key: 'weekly_digest', label: 'Weekly Digest', description: 'A curated weekly summary of new products and inspiration.' },
    ],
  },
  {
    title: 'Other Channels',
    icon: 'DevicePhoneMobileIcon',
    items: [
      { key: 'sms_notifications', label: 'SMS Notifications', description: 'Receive important updates via text message.' },
      { key: 'push_notifications', label: 'Push Notifications', description: 'Browser push notifications for real-time updates.' },
    ],
  },
];

export default function NotificationPreferencesPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/notification-preferences');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchPrefs = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          setPrefs({
            order_updates: data.order_updates,
            promotional_emails: data.promotional_emails,
            new_arrivals: data.new_arrivals,
            review_responses: data.review_responses,
            weekly_digest: data.weekly_digest,
            sms_notifications: data.sms_notifications,
            push_notifications: data.push_notifications,
          });
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to load preferences.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, [user]);

  const handleToggle = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      showToast('Notification preferences saved!', 'success');
      setHasChanges(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = () => {
    setPrefs({
      order_updates: false,
      promotional_emails: false,
      new_arrivals: false,
      review_responses: false,
      weekly_digest: false,
      sms_notifications: false,
      push_notifications: false,
    });
    setHasChanges(true);
  };

  if (authLoading || loading) {
    return (
      <main className="bg-[#FAF6F0] min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading preferences…</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="bg-[#FAF6F0] min-h-screen overflow-x-hidden">
      <Header />

      <section className="pt-32 pb-8 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/homepage"
              className="text-[11px] uppercase tracking-[0.25em] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Icon name="ArrowLeftIcon" size={12} />
              Back to Home
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
              <Icon name="BellIcon" size={18} className="text-white" />
            </div>
            <h1 className="font-display italic text-4xl font-semibold text-foreground">
              Notifications
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose what updates you'd like to receive from PurelyJid.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {PREF_GROUPS.map((group) => (
            <div key={group.title} className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name={group.icon} size={15} className="text-primary" />
                </div>
                <h2 className="font-display italic text-base font-semibold text-foreground">{group.title}</h2>
              </div>
              <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                {group.items.map((item) => {
                  const key = item.key as keyof NotificationPrefs;
                  const enabled = prefs[key];
                  return (
                    <div key={item.key} className="flex items-start justify-between gap-4 px-6 py-5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(key)}
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`Toggle ${item.label}`}
                        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                          enabled ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                            enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={handleUnsubscribeAll}
              className="text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors underline underline-offset-2"
            >
              Unsubscribe from all
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="h-11 px-8 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Icon name="CheckIcon" size={14} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
