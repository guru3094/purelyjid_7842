'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
  relative_time_description?: string;
}

interface PlaceData {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

const STORAGE_KEY_API = 'gplaces_api_key';
const STORAGE_KEY_PLACE = 'gplaces_place_id';

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={star <= Math.round(rating) ? '#F59E0B' : 'none'}
          stroke={star <= Math.round(rating) ? '#F59E0B' : '#D1D5DB'}
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  );
}

export default function GoogleReviewsSection() {
  const [savedApiKey, setSavedApiKey] = useState('');
  const [savedPlaceId, setSavedPlaceId] = useState('');
  const [placeData, setPlaceData] = useState<PlaceData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY_API) || '';
    const storedPlace = localStorage.getItem(STORAGE_KEY_PLACE) || '';
    setSavedApiKey(storedKey);
    setSavedPlaceId(storedPlace);
  }, []);

  const fetchReviews = useCallback(async (key: string, pid: string) => {
    if (!key || !pid) return;
    setReviewsLoading(true);
    setReviewsError('');
    setPlaceData(null);
    try {
      const res = await fetch(`/api/google-places?apiKey=${encodeURIComponent(key)}&placeId=${encodeURIComponent(pid)}`);
      const data = await res.json();
      if (!res.ok) {
        setReviewsError(data.error || 'Failed to load reviews.');
      } else {
        setPlaceData(data);
      }
    } catch {
      setReviewsError('Network error. Please try again.');
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (savedApiKey && savedPlaceId) {
      fetchReviews(savedApiKey, savedPlaceId);
    }
  }, [savedApiKey, savedPlaceId, fetchReviews]);

  if (!savedApiKey || !savedPlaceId) return null;

  return (
    <section className="pb-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
              <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-3.15c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary">Google Reviews</span>
            </div>
            <h2 className="font-display italic text-3xl font-semibold text-foreground">What Our Customers Say</h2>
            {placeData && (
              <div className="flex items-center gap-3 mt-2">
                <StarRating rating={placeData.rating} size={16} />
                <span className="text-sm font-bold text-foreground">{placeData.rating?.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({placeData.user_ratings_total?.toLocaleString()} reviews)</span>
              </div>
            )}
          </div>
        </div>

        {reviewsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#EDE8E0]" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3.5 w-2/3 bg-[#EDE8E0] rounded mb-1" />
                    <div className="h-3 w-1/3 bg-[#EDE8E0] rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-[#EDE8E0] rounded" />
                  <div className="h-3 w-5/6 bg-[#EDE8E0] rounded" />
                  <div className="h-3 w-4/6 bg-[#EDE8E0] rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {reviewsError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
            <Icon name="ExclamationCircleIcon" size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Failed to load reviews</p>
              <p className="text-xs text-red-600">{reviewsError}</p>
            </div>
          </div>
        )}

        {placeData && placeData.reviews && placeData.reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {placeData.reviews.map((review, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 flex flex-col hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  {review.profile_photo_url ? (
                    <img
                      src={review.profile_photo_url}
                      alt={`${review.author_name} profile photo`}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {review.author_name?.charAt(0)?.toUpperCase() || 'G'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{review.author_name}</p>
                    <p className="text-[10px] text-muted-foreground">{review.relative_time_description || new Date(review.time * 1000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} size={13} />
                {review.text && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-5">
                    {review.text}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-[rgba(196,120,90,0.08)]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[10px] text-muted-foreground font-medium">Google Review</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
