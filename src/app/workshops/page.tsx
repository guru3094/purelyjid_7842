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
}

interface StaticWorkshop {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  price: string;
  spots: string;
  thumbnail_url: string;
  topics: string[];
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

// Static fallback workshops — shown when DB has no catalogues yet
const STATIC_WORKSHOPS: StaticWorkshop[] = [
{
  id: 'ws-1',
  title: 'Beginner Resin Pour Workshop',
  description: 'Learn the fundamentals of resin art in this hands-on session. You\'ll create your own coaster set and take home your masterpiece.',
  duration: '3 Hours',
  level: 'Beginner',
  price: '₹1,800 per person',
  spots: 'Limited to 8 spots',
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_149372eee-1769491074797.png",
  topics: ['Resin basics & safety', 'Color mixing techniques', 'Creating coasters', 'Finishing & sealing']
},
{
  id: 'ws-2',
  title: 'Floral Preservation Masterclass',
  description: 'Preserve your precious flowers — wedding bouquets, gifted blooms — in stunning resin frames and jewellery pieces.',
  duration: '4 Hours',
  level: 'Intermediate',
  price: '₹2,500 per person',
  spots: 'Limited to 6 spots',
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_184aefc71-1772088719178.png",
  topics: ['Flower drying methods', 'Resin casting with botanicals', 'Frame & jewellery making', 'Care & maintenance']
},
{
  id: 'ws-3',
  title: 'Advanced Resin Art Techniques',
  description: 'Take your resin skills to the next level with geode art, ocean pours, and large-format canvas pieces.',
  duration: '5 Hours',
  level: 'Advanced',
  price: '₹3,200 per person',
  spots: 'Limited to 5 spots',
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1230b9326-1774462241981.png",
  topics: ['Geode & crystal effects', 'Ocean pour techniques', 'Large canvas work', 'Professional finishing']
},
{
  id: 'ws-4',
  title: 'Kids Resin Art (Age 8–14)',
  description: 'A fun, safe, and creative session designed for young artists. Kids create their own resin bookmarks and keychains.',
  duration: '2 Hours',
  level: 'Kids',
  price: '₹1,200 per child',
  spots: 'Limited to 10 spots',
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_100a09069-1774462245524.png",
  topics: ['Safe resin for kids', 'Bookmark making', 'Keychain casting', 'Take-home kit']
},
{
  id: 'ws-5',
  title: 'Corporate Team Building Workshop',
  description: 'A unique team-building experience where colleagues create resin art together. Perfect for office events and team outings.',
  duration: '3–4 Hours',
  level: 'All Levels',
  price: 'Custom pricing',
  spots: 'Groups of 10–30',
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_1e3f1df92-1774462246454.png",
  topics: ['Team collaboration', 'Creative expression', 'Customized themes', 'Take-home artwork']
},
{
  id: 'ws-6',
  title: 'Private One-on-One Session',
  description: 'A personalized workshop tailored entirely to your goals. Learn at your own pace with dedicated guidance from our artisan.',
  duration: 'Flexible',
  level: 'Any Level',
  price: '₹4,000 per session',
  spots: '1–2 people',
  thumbnail_url: "https://img.rocket.new/generatedImages/rocket_gen_img_11e032ba4-1769463953984.png",
  topics: ['Custom curriculum', 'Your choice of project', 'Flexible scheduling', 'All materials included']
}];


const LEVEL_COLORS: Record<string, string> = {
  'Beginner': 'bg-green-100 text-green-700',
  'Intermediate': 'bg-blue-100 text-blue-700',
  'Advanced': 'bg-purple-100 text-purple-700',
  'Kids': 'bg-yellow-100 text-yellow-700',
  'All Levels': 'bg-primary/10 text-primary',
  'Any Level': 'bg-primary/10 text-primary'
};

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
        fill={star <= Math.round(rating) ? '#F59E0B' : 'none'}
        stroke={star <= Math.round(rating) ? '#F59E0B' : '#D1D5DB'}
        strokeWidth="1.5">
        
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      )}
    </div>);

}

export default function WorkshopsPage() {
  const [catalogues, setCatalogues] = useState<WorkshopCatalogue[]>([]);
  const [staticWorkshops, setStaticWorkshops] = useState<StaticWorkshop[]>([]);
  const [useStatic, setUseStatic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Google Reviews state
  const [savedApiKey, setSavedApiKey] = useState('');
  const [savedPlaceId, setSavedPlaceId] = useState('');
  const [placeData, setPlaceData] = useState<PlaceData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    const fetchCatalogues = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.
        from('workshop_catalogues').
        select('*').
        eq('is_active', true).
        order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setCatalogues(data);
          setUseStatic(false);
        } else {
          setStaticWorkshops(STATIC_WORKSHOPS);
          setUseStatic(true);
        }
      } catch {
        setStaticWorkshops(STATIC_WORKSHOPS);
        setUseStatic(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogues();
  }, []);

  // Load saved config from localStorage on mount
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
    try {
      const supabase = createClient();
      await supabase.
      from('workshop_catalogues').
      update({ download_count: catalogue.download_count + 1 }).
      eq('id', catalogue.id);

      const link = document.createElement('a');
      link.href = catalogue.file_url;
      link.download = catalogue.file_name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCatalogues((prev) =>
      prev.map((c) => c.id === catalogue.id ? { ...c, download_count: c.download_count + 1 } : c)
      );
    } catch {} finally
    {setDownloading(null);}
  };

  const getBookingLink = (title: string) => {
    const msg = encodeURIComponent(`Hi PurelyJid! 👋 I'd like to book a spot in the *${title}* workshop. Could you share available dates and confirm availability? 🎨`);
    return `https://wa.me/919518770073?text=${msg}`;
  };

  return (
    <main className="bg-[#FAF6F0] min-h-screen overflow-x-hidden">
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
            {useStatic ?
            'Join our hands-on workshops and discover the joy of creating with resin. From beginner pours to advanced techniques — there\'s a session for everyone.' :
            'Download our workshop catalogues to explore upcoming sessions, pricing, and what you\'ll create. From beginner pours to advanced techniques.'}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-6xl">
          {loading ?
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) =>
            <div key={i} className="bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] overflow-hidden animate-pulse">
                  <div className="h-48 bg-[#EDE8E0]" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 w-3/4 bg-[#EDE8E0] rounded" />
                    <div className="h-4 w-full bg-[#EDE8E0] rounded" />
                    <div className="h-10 w-full bg-[#EDE8E0] rounded-full mt-4" />
                  </div>
                </div>
            )}
            </div> :
          useStatic ? (
          /* Static Workshop Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staticWorkshops.map((ws) =>
            <div key={ws.id} className="bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] overflow-hidden hover:shadow-card transition-shadow group flex flex-col">
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                  src={ws.thumbnail_url}
                  alt={`${ws.title} workshop session with participants creating resin art`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full ${LEVEL_COLORS[ws.level] || 'bg-primary/10 text-primary'}`}>
                        {ws.level}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-[10px] font-bold text-foreground">{ws.duration}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-display italic text-xl font-semibold text-foreground mb-2">{ws.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{ws.description}</p>

                    {/* Topics */}
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {ws.topics.map((topic) =>
                  <span key={topic} className="text-[10px] bg-[#FAF6F0] border border-[rgba(196,120,90,0.15)] text-muted-foreground px-2.5 py-1 rounded-full">
                          {topic}
                        </span>
                  )}
                    </div>

                    {/* Price & Spots */}
                    <div className="flex items-center justify-between mb-4 mt-auto">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Price</p>
                        <p className="text-sm font-bold text-foreground">{ws.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Capacity</p>
                        <p className="text-xs font-semibold text-primary">{ws.spots}</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <a
                  href={getBookingLink(ws.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors flex items-center justify-center gap-2">
                  
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Book via WhatsApp
                    </a>
                  </div>
                </div>
            )}
            </div>) : (

          /* DB Catalogue Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalogues.map((cat) =>
            <div key={cat.id} className="bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] overflow-hidden hover:shadow-card transition-shadow group">
                  <div className="relative h-48 bg-gradient-to-br from-[#FAF6F0] to-[#EDE8E0] flex items-center justify-center overflow-hidden">
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
                      <span className="text-[10px] font-bold text-muted-foreground">{cat.download_count}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display italic text-xl font-semibold text-foreground mb-2">{cat.title}</h3>
                    {cat.description &&
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{cat.description}</p>
                }
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name="DocumentIcon" size={13} />
                        <span>{cat.file_name}</span>
                      </div>
                      {cat.file_size > 0 &&
                  <span className="text-xs text-muted-foreground">{formatFileSize(cat.file_size)}</span>
                  }
                    </div>
                    <button
                  onClick={() => handleDownload(cat)}
                  disabled={downloading === cat.id}
                  className="w-full h-11 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  
                      {downloading === cat.id ?
                  <><div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />Downloading…</> :

                  <><Icon name="ArrowDownTrayIcon" size={14} />Download Catalogue</>
                  }
                    </button>
                  </div>
                </div>
            )}
            </div>)
          }

          {/* CTA */}
          <div className="mt-16 bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] p-8 md:p-12 text-center">
            <h2 className="font-display italic text-3xl font-semibold text-foreground mb-3">
              Want to Book a Workshop?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Reach out directly to reserve your spot or ask about custom group sessions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/919518770073?text=Hi%20PurelyJid!%20I%27d%20like%20to%20book%20a%20workshop.%20Could%20you%20share%20available%20dates%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-green-500 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-green-600 transition-colors">
                
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Us
              </a>
              <a
                href="tel:+919518770073"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-[rgba(196,120,90,0.3)] text-foreground text-xs font-semibold uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-colors">
                
                <Icon name="PhoneIcon" size={14} />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Google Reviews Section ── */}
      {savedApiKey && savedPlaceId &&
      <section className="pb-24 px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
                  <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-3.15c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary">Google Reviews</span>
                </div>
                <h2 className="font-display italic text-3xl font-semibold text-foreground">What Our Customers Say</h2>
                {placeData &&
              <div className="flex items-center gap-3 mt-2">
                    <StarRating rating={placeData.rating} size={16} />
                    <span className="text-sm font-bold text-foreground">{placeData.rating?.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({placeData.user_ratings_total?.toLocaleString()} reviews)</span>
                  </div>
              }
              </div>
            </div>

            {reviewsLoading &&
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) =>
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
            )}
              </div>
          }

            {reviewsError &&
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
                <Icon name="ExclamationCircleIcon" size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">Failed to load reviews</p>
                  <p className="text-xs text-red-600">{reviewsError}</p>
                </div>
              </div>
          }

            {placeData && placeData.reviews && placeData.reviews.length > 0 &&
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {placeData.reviews.map((review, idx) =>
            <div key={idx} className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 flex flex-col hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      {review.profile_photo_url ?
                <img
                  src={review.profile_photo_url}
                  alt={`${review.author_name} profile photo`}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> :


                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {review.author_name?.charAt(0)?.toUpperCase() || 'G'}
                          </span>
                        </div>
                }
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{review.author_name}</p>
                        <p className="text-[10px] text-muted-foreground">{review.relative_time_description || new Date(review.time * 1000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size={13} />
                    {review.text &&
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-5">
                        {review.text}
                      </p>
              }
                    <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-[rgba(196,120,90,0.08)]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-3.15c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span className="text-[10px] text-muted-foreground font-medium">Google Review</span>
                    </div>
                  </div>
            )}
              </div>
          }
          </div>
        </section>
      }

      <Footer />
    </main>);

}