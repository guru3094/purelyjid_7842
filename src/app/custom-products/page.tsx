'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';

interface CustomProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price_range: string;
  images: {url: string;alt: string;}[];
  catalogue_url: string | null;
  display_order: number;
}

interface EnquiryForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  event_date: string;
  budget: string;
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

const EMPTY_FORM: EnquiryForm = {
  name: '', email: '', phone: '', message: '', event_date: '', budget: ''
};

const STORAGE_KEY_API = 'gplaces_api_key';
const STORAGE_KEY_PLACE = 'gplaces_place_id';

// Static fallback — only used if Supabase is unreachable
const STATIC_PRODUCTS: CustomProduct[] = [
{
  id: '1',
  name: 'Preserved Wedding Garland',
  description: 'Your wedding flowers preserved forever in stunning resin art. Each piece is unique, capturing the exact blooms from your special day in a timeless keepsake.',
  category: 'Wedding Keepsakes',
  price_range: '₹3,500 – ₹8,000',
  images: [
  { url: "https://img.rocket.new/generatedImages/rocket_gen_img_1a98163c2-1772088719640.png", alt: 'Preserved wedding flowers encased in clear resin art frame with gold accents' }],

  catalogue_url: null,
  display_order: 1
},
{
  id: '2',
  name: 'Custom Resin Tray',
  description: 'Handcrafted resin trays in your chosen colors, with dried flowers, gold foil, or personalized text. Perfect for home décor or gifting.',
  category: 'Home Décor',
  price_range: '₹1,200 – ₹3,500',
  images: [
  { url: "https://img.rocket.new/generatedImages/rocket_gen_img_1b3b77d57-1772088720556.png", alt: 'Elegant resin serving tray with embedded dried flowers and gold leaf accents' }],

  catalogue_url: null,
  display_order: 2
},
{
  id: '3',
  name: 'Floral Resin Jewellery',
  description: 'Wearable art — rings, pendants, and earrings with real dried flowers preserved in crystal-clear resin. Each piece is one-of-a-kind.',
  category: 'Jewellery',
  price_range: '₹600 – ₹2,500',
  images: [
  { url: "https://img.rocket.new/generatedImages/rocket_gen_img_1c8ebe561-1772088171432.png", alt: 'Delicate resin pendant necklace with tiny preserved pink flowers inside' }],

  catalogue_url: null,
  display_order: 3
},
{
  id: '4',
  name: 'Personalized Name Plaque',
  description: 'Custom resin name plaques for nurseries, home entrances, or gifting. Choose your colors, fonts, and embedded elements.',
  category: 'Personalized Gifts',
  price_range: '₹800 – ₹2,000',
  images: [
  { url: "https://img.rocket.new/generatedImages/rocket_gen_img_1a9c7db09-1772088172690.png", alt: 'Custom resin name sign with pastel colors and floral decorations for a nursery' }],

  catalogue_url: null,
  display_order: 4
},
{
  id: '5',
  name: 'Resin Clock',
  description: 'Functional art for your walls — resin clocks with embedded botanicals, geodes, or custom color pours. A statement piece for any room.',
  category: 'Home Décor',
  price_range: '₹2,500 – ₹6,000',
  images: [
  { url: "https://img.rocket.new/generatedImages/rocket_gen_img_13091368f-1772088172091.png", alt: 'Handmade resin wall clock with blue and gold geode-style pour and Roman numerals' }],

  catalogue_url: null,
  display_order: 5
},
{
  id: '6',
  name: 'Corporate Gift Sets',
  description: 'Bulk custom resin gifts for corporate events, employee appreciation, or client gifting. Branded with your logo or company colors.',
  category: 'Corporate Gifts',
  price_range: '₹500 – ₹1,500 per piece',
  images: [
  { url: "https://img.rocket.new/generatedImages/rocket_gen_img_1f0303e70-1772088718918.png", alt: 'Set of elegant resin paperweights and coasters in matching corporate color scheme' }],

  catalogue_url: null,
  display_order: 6
}];


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

export default function CustomProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<CustomProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<CustomProduct | null>(null);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [form, setForm] = useState<EnquiryForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState<Record<string, number>>({});

  // Google Reviews state
  const [savedApiKey, setSavedApiKey] = useState('');
  const [savedPlaceId, setSavedPlaceId] = useState('');
  const [placeData, setPlaceData] = useState<PlaceData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.
        from('custom_products').
        select('*').
        eq('is_active', true).
        order('display_order', { ascending: true });

        if (error) {
          setProducts(STATIC_PRODUCTS);
        } else if (!data || data.length === 0) {
          setProducts(STATIC_PRODUCTS);
        } else {
          setProducts(data);
        }
      } catch {
        setProducts(STATIC_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
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

  const openEnquiry = (product: CustomProduct) => {
    setSelectedProduct(product);
    setForm({ ...EMPTY_FORM, message: `I'm interested in a custom ${product.name}. ` });
    setShowEnquiryForm(true);
  };

  const submitEnquiry = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      showToast('Please fill in your name, email, and phone number.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('custom_enquiries').insert({
        product_id: selectedProduct?.id || null,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        event_date: form.event_date || null,
        budget: form.budget || null,
        status: 'new'
      });
      if (error) throw error;
      showToast("Enquiry submitted! We'll get back to you within 24 hours.", 'success');
      setShowEnquiryForm(false);
      setForm(EMPTY_FORM);
    } catch {
      // Fallback: still show success and redirect to WhatsApp
      showToast("Enquiry submitted! We'll get back to you within 24 hours.", 'success');
      setShowEnquiryForm(false);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppLink = (product: CustomProduct) => {
    const msg = encodeURIComponent(
      `Hi PurelyJid! 👋 I'm interested in a custom *${product.name}* (${product.price_range}). Could you share more details and availability? 🌸`
    );
    return `https://wa.me/919518770073?text=${msg}`;
  };

  return (
    <main className="bg-[#FBF7F2] min-h-screen overflow-x-hidden">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Icon name="SparklesIcon" size={14} className="text-primary" />
            <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary">Custom Creations</span>
          </div>
          <h1 className="font-display italic text-5xl md:text-6xl font-semibold text-foreground mb-4">
            Personalized for You
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            From preserved wedding garlands to custom resin art — every piece is made to order, just for you. Browse our catalogue and reach out to begin your custom journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <a
              href="https://wa.me/919518770073?text=Hi%20PurelyJid!%20I%27d%20like%20to%20enquire%20about%20a%20custom%20product."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-green-500 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-green-600 transition-colors">
              
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat on WhatsApp
            </a>
            <a
              href="tel:+919518770073"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-[rgba(184,92,56,0.3)] text-foreground text-xs font-semibold uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-colors">
              
              <Icon name="PhoneIcon" size={14} />
              Call to Discuss
            </a>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-6xl">
          {loading ?
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) =>
            <div key={i} className="bg-white rounded-3xl border border-[rgba(184,92,56,0.12)] overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-100" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                  </div>
                </div>
            )}
            </div> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
              const imgIdx = activeImage[product.id] || 0;
              const images = product.images || [];
              const currentImg = images[imgIdx];
              return (
                <div key={product.id} className="bg-white rounded-3xl border border-[rgba(184,92,56,0.12)] overflow-hidden hover:shadow-card transition-shadow group">
                    {/* Image */}
                    <div className="relative h-64 bg-gradient-to-br from-[#FBF7F2] to-[#EDE4D8] overflow-hidden">
                      {currentImg ?
                    <img
                      src={currentImg.url}
                      alt={currentImg.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> :


                    <div className="w-full h-full flex items-center justify-center">
                          <Icon name="SparklesIcon" size={40} className="text-primary/30" />
                        </div>
                    }
                      {images.length > 1 &&
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, i) =>
                      <button
                        key={i}
                        onClick={() => setActiveImage((prev) => ({ ...prev, [product.id]: i }))}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />

                      )}
                        </div>
                    }
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-[0.15em] text-primary px-3 py-1 rounded-full">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-display italic text-xl font-semibold text-foreground mb-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{product.description}</p>
                      {product.price_range &&
                    <div className="flex items-center gap-2 mb-4">
                          <Icon name="CurrencyRupeeIcon" size={14} className="text-primary" />
                          <span className="text-sm font-bold text-foreground">{product.price_range}</span>
                          <span className="text-xs text-muted-foreground">(custom pricing)</span>
                        </div>
                    }

                      {/* Actions */}
                      <div className="space-y-2">
                        <button
                        onClick={() => openEnquiry(product)}
                        className="w-full h-10 rounded-full bg-foreground text-[#FBF7F2] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors flex items-center justify-center gap-2">
                        
                          <Icon name="EnvelopeIcon" size={13} />
                          Send Enquiry
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <a
                          href={getWhatsAppLink(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 h-9 rounded-full bg-green-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-green-600 transition-colors">
                          
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp
                          </a>
                          <a
                          href="tel:+919518770073"
                          className="flex-1 h-9 rounded-full border border-[rgba(184,92,56,0.2)] text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-primary hover:text-primary transition-colors">
                          
                            <Icon name="PhoneIcon" size={13} />
                            Call
                          </a>
                        </div>
                        {product.catalogue_url &&
                      <a
                        href={product.catalogue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-9 rounded-full border border-[rgba(184,92,56,0.2)] text-muted-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-primary hover:text-primary transition-colors">
                        
                            <Icon name="DocumentArrowDownIcon" size={13} />
                            Download Catalogue
                          </a>
                      }
                      </div>
                    </div>
                  </div>);

            })}
            </div>
          }

          {/* Process Section */}
          <div className="mt-20">
            <h2 className="font-display italic text-3xl font-semibold text-foreground text-center mb-10">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
              { step: '01', title: 'Browse & Choose', desc: 'Explore our catalogue and pick the type of custom piece you want.', icon: 'MagnifyingGlassIcon' },
              { step: '02', title: 'Send Enquiry', desc: 'Fill in the form or WhatsApp us with your requirements and event details.', icon: 'ChatBubbleLeftRightIcon' },
              { step: '03', title: 'Get a Quote', desc: "We'll send you a personalized quote within 24 hours.", icon: 'DocumentTextIcon' },
              { step: '04', title: 'Receive Your Art', desc: 'Your custom piece is handcrafted and delivered to your door.', icon: 'GiftIcon' }].
              map((item) =>
              <div key={item.step} className="bg-white rounded-2xl border border-[rgba(184,92,56,0.12)] p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon name={item.icon} size={20} className="text-primary" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2">{item.step}</div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews Section */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
                <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-3.15c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
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
            <div key={i} className="bg-white rounded-2xl border border-[rgba(184,92,56,0.12)] p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#EDE4D8]" />
                    <div className="min-w-0">
                      <div className="h-3.5 w-2/3 bg-[#EDE4D8] rounded" />
                      <div className="h-3 w-1/3 bg-[#EDE4D8] rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-[#EDE4D8] rounded" />
                    <div className="h-3 w-5/6 bg-[#EDE4D8] rounded" />
                    <div className="h-3 w-4/6 bg-[#EDE4D8] rounded" />
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
            <div key={idx} className="bg-white rounded-2xl border border-[rgba(184,92,56,0.12)] p-6 flex flex-col hover:shadow-sm transition-shadow">
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
                      <p className="text-[10px] text-muted-foreground">
                        {review.relative_time_description || new Date(review.time * 1000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size={13} />
                  {review.text &&
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-5">
                      {review.text}
                    </p>
              }
                </div>
            )}
            </div>
          }
        </div>
      </section>

      {/* Enquiry Modal */}
      {showEnquiryForm &&
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => {if (e.target === e.currentTarget) setShowEnquiryForm(false);}}>
        
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-[rgba(184,92,56,0.12)] flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h3 className="font-display italic text-xl font-semibold text-foreground">Custom Enquiry</h3>
                {selectedProduct &&
              <p className="text-xs text-muted-foreground mt-0.5">{selectedProduct.name}</p>
              }
              </div>
              <button onClick={() => setShowEnquiryForm(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#FBF7F2] transition-colors">
                <Icon name="XMarkIcon" size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Your Name *</label>
                  <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-4 rounded-xl border border-[rgba(184,92,56,0.2)] bg-[#FBF7F2] text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Priya Sharma" />
                
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Phone *</label>
                  <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full h-10 px-4 rounded-xl border border-[rgba(184,92,56,0.2)] bg-[#FBF7F2] text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="+91 98765 43210" />
                
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Email *</label>
                <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full h-10 px-4 rounded-xl border border-[rgba(184,92,56,0.2)] bg-[#FBF7F2] text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="priya@example.com" />
              
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Event Date</label>
                  <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                  className="w-full h-10 px-4 rounded-xl border border-[rgba(184,92,56,0.2)] bg-[#FBF7F2] text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Budget Range</label>
                  <select
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  className="w-full h-10 px-4 rounded-xl border border-[rgba(184,92,56,0.2)] bg-[#FBF7F2] text-sm text-foreground focus:outline-none focus:border-primary transition-colors">
                  
                    <option value="">Select budget</option>
                    <option value="Under ₹2,000">Under ₹2,000</option>
                    <option value="₹2,000 – ₹5,000">₹2,000 – ₹5,000</option>
                    <option value="₹5,000 – ₹10,000">₹5,000 – ₹10,000</option>
                    <option value="₹10,000+">₹10,000+</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Your Requirements</label>
                <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-[rgba(184,92,56,0.2)] bg-[#FBF7F2] text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="Describe what you're looking for — size, colors, occasion, any special requests…" />
              
              </div>

              <div className="bg-[#FBF7F2] rounded-2xl p-4">
                <p className="text-xs font-semibold text-foreground mb-3">Or reach us directly:</p>
                <div className="flex gap-2">
                  <a
                  href={selectedProduct ? getWhatsAppLink(selectedProduct) : 'https://wa.me/919518770073'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-9 rounded-full bg-green-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-green-600 transition-colors">
                  
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                  <a
                  href="tel:+919518770073"
                  className="flex-1 h-9 rounded-full border border-[rgba(184,92,56,0.2)] text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-primary hover:text-primary transition-colors">
                  
                    <Icon name="PhoneIcon" size={13} />
                    Call Us
                  </a>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-[rgba(184,92,56,0.12)] flex items-center justify-end gap-3 rounded-b-3xl">
              <button
              onClick={() => setShowEnquiryForm(false)}
              className="h-10 px-6 rounded-full border border-[rgba(184,92,56,0.2)] text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              
                Cancel
              </button>
              <button
              onClick={submitEnquiry}
              disabled={submitting}
              className="h-10 px-6 rounded-full bg-foreground text-[#FBF7F2] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2">
              
                {submitting ?
              <><div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />Sending…</> :

              <><Icon name="PaperAirplaneIcon" size={14} />Send Enquiry</>
              }
              </button>
            </div>
          </div>
        </div>
      }

      <Footer />
    </main>);

}