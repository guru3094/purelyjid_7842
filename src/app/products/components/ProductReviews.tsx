'use client';
import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';

interface Review {
  id: string;
  user_id: string;
  product_id: number;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  user_profiles?: { full_name: string };
}

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <svg
            className={`w-4 h-4 transition-colors ${(hovered || value) >= star ? 'text-amber-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({ rating: 5, title: '', body: '' });
  const [formError, setFormError] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*, user_profiles(full_name)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setReviews(data);
        if (user) {
          const mine = data.find((r) => r.user_id === user.id) || null;
          setUserReview(mine);
          if (mine) {
            setFormData({ rating: mine.rating, title: mine.title, body: mine.body });
          }
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to load reviews.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, user]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { setFormError('Please add a title for your review.'); return; }
    if (!formData.body.trim()) { setFormError('Please write your review.'); return; }
    if (formData.body.trim().length < 10) { setFormError('Review must be at least 10 characters.'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      const supabase = createClient();
      if (userReview) {
        const { error } = await supabase
          .from('product_reviews')
          .update({ rating: formData.rating, title: formData.title.trim(), body: formData.body.trim() })
          .eq('id', userReview.id);
        if (error) throw error;
        showToast('Your review has been updated!', 'success');
      } else {
        const { error } = await supabase
          .from('product_reviews')
          .insert({ user_id: user!.id, product_id: productId, rating: formData.rating, title: formData.title.trim(), body: formData.body.trim() });
        if (error) throw error;
        showToast('Review submitted! Thank you for your feedback.', 'success');
      }
      setShowForm(false);
      await fetchReviews();
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit review. Please try again.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userReview) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('product_reviews').delete().eq('id', userReview.id);
      if (error) throw error;
      setUserReview(null);
      setFormData({ rating: 5, title: '', body: '' });
      showToast('Your review has been removed.', 'info');
      await fetchReviews();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete review.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="py-16 px-6 border-t border-[rgba(196,120,90,0.12)]">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
          <div>
            <h2 className="font-display italic text-3xl font-semibold text-foreground">
              Customer Reviews
            </h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                <StarRating value={Math.round(avgRating)} readonly />
                <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>

          {user ? (
            !userReview && !showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors"
              >
                Write a Review
              </button>
            ) : userReview && !showForm ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="h-10 px-5 rounded-full border border-primary text-primary text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary hover:text-white transition-colors"
                >
                  Edit Review
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-10 px-5 rounded-full border border-red-300 text-red-500 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? (
                    <div className="w-3 h-3 border border-red-300 border-t-red-500 rounded-full animate-spin" />
                  ) : null}
                  Delete
                </button>
              </div>
            ) : null
          ) : null}
        </div>

        {/* Rating Distribution (shown when there are reviews) */}
        {reviews.length >= 3 && (
          <div className="mb-10 bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
            <div className="grid sm:grid-cols-2 gap-6 items-center">
              <div className="text-center">
                <p className="font-display text-6xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                <StarRating value={Math.round(avgRating)} readonly />
                <p className="text-xs text-muted-foreground mt-2">{reviews.length} reviews</p>
              </div>
              <div className="space-y-2">
                {ratingDistribution.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{star}</span>
                    <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 h-1.5 bg-accent-cream rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        {showForm && (
          <div className="mb-10 bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 shadow-sm">
            <h3 className="font-display italic text-xl font-semibold text-foreground mb-5">
              {userReview ? 'Edit Your Review' : `Review ${productName}`}
            </h3>
            {formError && (
              <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
                <Icon name="ExclamationCircleIcon" size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">{formError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-3">
                  <StarRating value={formData.rating} onChange={(v) => setFormData((p) => ({ ...p, rating: v }))} />
                  <span className="text-sm font-semibold text-foreground">{formData.rating}/5</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                  Review Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => { setFormData((p) => ({ ...p, title: e.target.value })); if (formError) setFormError(''); }}
                  placeholder="Summarise your experience"
                  className="w-full h-11 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] font-semibold text-foreground mb-2">
                  Your Review <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => { setFormData((p) => ({ ...p, body: e.target.value })); if (formError) setFormError(''); }}
                  placeholder="Share your thoughts about this product…"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  maxLength={500}
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{formData.body.length}/500</p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-7 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                  ) : (userReview ? 'Update Review' : 'Submit Review')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-muted-foreground text-xs font-semibold uppercase tracking-[0.15em] hover:border-primary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Loading reviews…</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-full bg-accent-cream flex items-center justify-center mx-auto">
              <Icon name="ChatBubbleLeftEllipsisIcon" size={24} className="text-primary" />
            </div>
            <p className="font-display italic text-xl font-semibold text-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground">Be the first to share your experience with {productName}!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews?.map((review) => (
              <div
                key={review?.id}
                className={`bg-white rounded-2xl border p-6 transition-all ${
                  review?.user_id === user?.id
                    ? 'border-primary/20 shadow-sm'
                    : 'border-[rgba(196,120,90,0.1)]'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating value={review?.rating} readonly />
                      <span className="text-xs font-bold text-foreground">{review?.rating}/5</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">{review?.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2 justify-end mb-0.5">
                      <p className="text-xs font-semibold text-foreground">{review?.user_profiles?.full_name || 'Customer'}</p>
                      {review?.user_id === user?.id && (
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(review?.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{review?.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
