'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface WorkshopCatalogue {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  thumbnail_url: string | null;
  download_count: number;
  created_at: string;
  is_active: boolean;
}

interface Workshop {
  id: string;
  title: string;
  description: string;
  instructor: string;
  location: string;
  workshop_date: string | null;
  duration: string;
  price: number;
  max_participants: number | null;
  is_active: boolean;
}

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

// Static fallback catalogues — only used if Supabase is unreachable
const STATIC_CATALOGUES: WorkshopCatalogue[] = [
{
  id: '1',
  title: 'Beginner Resin Pouring',
  description: 'Learn the basics of resin art — mixing ratios, color blending, and creating your first coaster set. Perfect for complete beginners. All materials provided.',
  file_url: '#',
  file_name: 'Beginner-Resin-Workshop.pdf',
  file_size: 2400000,
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1caf29658-1765028281978.png",
  download_count: 142,
  created_at: '2026-01-15T10:00:00Z',
  is_active: true,
},
{
  id: '2',
  title: 'Floral Preservation in Resin',
  description: 'Preserve your precious flowers — wedding bouquets, gifted blooms, or garden favorites — in crystal-clear resin. Create pendants, paperweights, and frames.',
  file_url: '#',
  file_name: 'Floral-Preservation-Workshop.pdf',
  file_size: 3100000,
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1c709ac32-1772255564482.png",
  download_count: 98,
  created_at: '2026-01-20T10:00:00Z',
  is_active: true,
},
{
  id: '3',
  title: 'Advanced Geode & Ocean Art',
  description: 'Master the stunning geode and ocean wave techniques using pigments, inks, and metallic powders. Create large-scale statement pieces for your home.',
  file_url: '#',
  file_name: 'Advanced-Geode-Workshop.pdf',
  file_size: 4200000,
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_11d21480a-1766821759180.png",
  download_count: 67,
  created_at: '2026-02-01T10:00:00Z',
  is_active: true,
},
{
  id: '4',
  title: 'Resin Jewellery Making',
  description: 'Craft wearable resin art — rings, earrings, and pendants with embedded botanicals and glitter. Learn mold techniques and finishing for professional results.',
  file_url: '#',
  file_name: 'Resin-Jewellery-Workshop.pdf',
  file_size: 2800000,
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_131e1516a-1771900598704.png",
  download_count: 115,
  created_at: '2026-02-10T10:00:00Z',
  is_active: true,
},
{
  id: '5',
  title: 'Corporate Group Sessions',
  description: 'Team-building resin art workshops for offices and corporate events. Customized for groups of 10–30 participants. Includes all materials and take-home pieces.',
  file_url: '#',
  file_name: 'Corporate-Workshop-Brochure.pdf',
  file_size: 1900000,
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1a90d3520-1767203344847.png",
  download_count: 44,
  created_at: '2026-02-15T10:00:00Z',
  is_active: true,
},
{
  id: '6',
  title: 'Kids Resin Art (Age 8+)',
  description: 'A safe, supervised resin art session designed for children aged 8 and above. Non-toxic materials, fun molds, and colorful pigments for a creative afternoon.',
  file_url: '#',
  file_name: 'Kids-Resin-Workshop.pdf',
  file_size: 2100000,
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1f6f366b7-1774462355782.png",
  download_count: 89,
  created_at: '2026-02-20T10:00:00Z',
  is_active: true,
}];


function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StarRating({ rating, size = 14 }: {rating: number;size?: number;}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) =>
      <svg
        key={star}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={star <= Math.round(rating) ? '#C9963A' : 'none'}
        stroke={star <= Math.round(rating) ? '#C9963A' : '#D1D5DB'}
        strokeWidth="1.5">
        
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      )}
    </div>);

}

export default function WorkshopsPage() {
  const [catalogues, setCatalogues] = useState<WorkshopCatalogue[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});

  // Google Reviews state
  const [savedApiKey, setSavedApiKey] = useState('');
  const [savedPlaceId, setSavedPlaceId] = useState('');
  const [placeData, setPlaceData] = useState<PlaceData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const [cataloguesRes, workshopsRes] = await Promise.all([
          supabase.from('workshop_catalogues').select('*').eq('is_active', true).order('created_at', { ascending: false }),
          supabase.from('workshops').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        ]);

        if (cataloguesRes.error) {
          // Network error — use fallback
          setCatalogues(STATIC_CATALOGUES);
          setDownloadCounts(Object.fromEntries(STATIC_CATALOGUES.map((c) => [c.id, c.download_count])));
        } else if (!cataloguesRes.data || cataloguesRes.data.length === 0) {
          // DB reachable but empty — show fallback
          setCatalogues(STATIC_CATALOGUES);
          setDownloadCounts(Object.fromEntries(STATIC_CATALOGUES.map((c) => [c.id, c.download_count])));
        } else {
          setCatalogues(cataloguesRes.data);
          setDownloadCounts(Object.fromEntries(cataloguesRes.data.map((c: WorkshopCatalogue) => [c.id, c.download_count])));
        }

        if (workshopsRes.data && workshopsRes.data.length > 0) {
          setWorkshops(workshopsRes.data);
        }
      } catch {
        setCatalogues(STATIC_CATALOGUES);
        setDownloadCounts(Object.fromEntries(STATIC_CATALOGUES.map((c) => [c.id, c.download_count])));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const handleDownload = async (catalogue: WorkshopCatalogue) => {
    setDownloading(catalogue.id);

    // Increment download count in DB
    try {
      const supabase = createClient();
      await supabase.from('workshop_catalogues').update({ download_count: (catalogue.download_count || 0) + 1 }).eq('id', catalogue.id);
    } catch {
      // ignore
    }

    await new Promise((r) => setTimeout(r, 600));

    if (catalogue.file_url && catalogue.file_url !== '#') {
      const link = document.createElement('a');
      link.href = catalogue.file_url;
      link.download = catalogue.file_name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // No file yet — redirect to WhatsApp to request it
      const msg = encodeURIComponent(
        `Hi PurelyJid! 👋 I'd like to download the *${catalogue.title}* workshop catalogue. Could you send it to me? 🌸`
      );
      window.open(`https://wa.me/919518770073?text=${msg}`, '_blank');
    }

    setDownloadCounts((prev) => ({ ...prev, [catalogue.id]: (prev[catalogue.id] || 0) + 1 }));
    setDownloading(null);
  };

  return (
    <main className="bg-[#FBF7F2] min-h-screen overflow-x-hidden">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Icon name="AcademicCapIcon" size={14} className="text-primary" />
            <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary">Workshops</span>
          </div>
          <h1 className="font-display italic text-5xl md:text-6xl font-semibold text-foreground mb-4">
            Learn the Art of Resin
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Download our workshop catalogues to explore upcoming sessions, pricing, and what you'll create. From beginner pours to advanced techniques.
          </p>
        </div>
      </section>

      {/* Upcoming Workshops */}
      {workshops.length > 0 && (
        <section className="pb-16 px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display italic text-3xl font-semibold text-foreground mb-8 text-center">Upcoming Workshops</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map((w) => (
                <div key={w.id} className="bg-white rounded-3xl border border-[rgba(184,92,56,0.12)] p-6 hover:shadow-card transition-shadow">
                  <h3 className="font-semibold text-foreground text-lg mb-2">{w.title}</h3>
                  {w.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{w.description}</p>}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {w.instructor && <div className="flex items-center gap-2"><Icon name="UserIcon" size={12} /><span>{w.instructor}</span></div>}
                    {w.location && <div className="flex items-center gap-2"><Icon name="MapPinIcon" size={12} /><span>{w.location}</span></div>}
                    {w.workshop_date && <div className="flex items-center gap-2"><Icon name="CalendarIcon" size={12} /><span>{new Date(w.workshop_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>}
                    {w.duration && <div className="flex items-center gap-2"><Icon name="ClockIcon" size={12} /><span>{w.duration}</span></div>}
                  </div>
                  {w.price > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-semibold text-foreground">₹{w.price.toLocaleString('en-IN')}</span>
                      <a
                        href={`https://wa.me/919518770073?text=${encodeURIComponent(`Hi PurelyJid! I'd like to register for the *${w.title}* workshop. 🌸`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-4 rounded-full bg-green-500 text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-green-600 transition-colors flex items-center gap-1.5"
                      >
                        Register
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Catalogues Grid */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-[rgba(184,92,56,0.12)] overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-100" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalogues.map((cat) =>
              <div key={cat.id} className="bg-white rounded-3xl border border-[rgba(184,92,56,0.12)] overflow-hidden hover:shadow-card transition-shadow group">
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-[#FBF7F2] to-[#EDE4D8] flex items-center justify-center overflow-hidden">
                    {cat.thumbnail_url ?
                  <img
                    src={cat.thumbnail_url}
                    alt={`${cat.title} workshop catalogue thumbnail`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> :


                  <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Icon name="DocumentArrowDownIcon" size={28} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">PDF Catalogue</span>
                      </div>
                  }
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                      <Icon name="ArrowDownTrayIcon" size={12} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground">{downloadCounts[cat.id] ?? cat.download_count}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-semibold text-foreground text-lg mb-2 leading-snug">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">{cat.description}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-5">
                      <span>{cat.file_name}</span>
                      <span>{formatFileSize(cat.file_size)}</span>
                    </div>

                    <button
                      onClick={() => handleDownload(cat)}
                      disabled={downloading === cat.id}
                      className="w-full h-11 rounded-full bg-foreground text-[#FAF6F0] text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {downloading === cat.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Preparing…
                        </>
                      ) : (
                        <>
                          <Icon name="ArrowDownTrayIcon" size={14} />
                          Download Catalogue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Google Reviews */}
      {(reviewsLoading || placeData) && (
        <section className="pb-24 px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display italic text-3xl font-semibold text-foreground mb-8 text-center">What Our Students Say</h2>
            {reviewsLoading && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
            {reviewsError && <p className="text-center text-sm text-red-500">{reviewsError}</p>}
            {placeData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {placeData.reviews?.slice(0, 6).map((review, i) => (
                  <div key={i} className="bg-white rounded-3xl border border-[rgba(184,92,56,0.12)] p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {review.profile_photo_url && (
                        <img src={review.profile_photo_url} alt={review.author_name} className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div>
                        <p className="font-semibold text-sm text-foreground">{review.author_name}</p>
                        <StarRating rating={review.rating} size={12} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{review.text}</p>
                    {review.relative_time_description && (
                      <p className="text-xs text-muted-foreground/60 mt-3">{review.relative_time_description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
