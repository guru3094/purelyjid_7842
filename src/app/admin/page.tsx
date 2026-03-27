'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

import Icon from '@/components/ui/AppIcon';

import { AdminStatSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  user_profiles?: { full_name: string; email: string };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Review {
  id: string;
  product_id: number;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  user_profiles?: { full_name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  original_price: number | null;
  category_id: string | null;
  material: string;
  badge: string | null;
  badge_color: string;
  image_url: string | null;
  alt_text: string;
  additional_images?: { url: string; alt: string }[];
  specifications?: { label: string; value: string }[];
  care_instructions?: string;
  tags?: string[];
  sku?: string;
  weight?: string;
  dimensions?: string;
  is_featured?: boolean;
  in_stock: boolean;
  is_active: boolean;
  display_order: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  categories?: { name: string };
}

interface StoreTheme {
  id: string;
  name: string;
  slug: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  accent_color: string;
  font_display: string;
  font_body: string;
  is_active: boolean;
}

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface CourierPartner {
  id: string;
  name: string;
  api_key: string;
  base_url: string;
  tracking_url: string;
  is_active: boolean;
  created_at: string;
}

interface StoryContent {
  id?: string;
  section_key: string;
  title: string;
  subtitle: string;
  body: string;
  image_url: string;
  image_alt: string;
  quote: string;
  quote_author: string;
  extra_data: Record<string, unknown>;
}

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
  relative_time_description: string;
}

interface GooglePlaceResult {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

interface GSTSettings {
  gstin: string;
  business_name: string;
  business_address: string;
  state_code: string;
  hsn_code: string;
  gst_rate: number;
}

// ── NEW INTERFACES ──────────────────────────────────────────────────────────

interface WorkshopCatalogue {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  thumbnail_url: string | null;
  is_active: boolean;
  download_count: number;
  created_at: string;
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
  catalogue_id: string | null;
  created_at: string;
}

interface CustomProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price_range: string;
  images: { url: string; alt: string }[];
  catalogue_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface CustomEnquiry {
  id: string;
  product_id: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  event_date: string | null;
  budget: string | null;
  status: string;
  created_at: string;
}

interface DeliveryPincode {
  id: string;
  pincode: string;
  area_name: string;
  city: string;
  state: string;
  is_active: boolean;
  delivery_days: number;
  extra_charge: number;
  free_shipping_above?: number;
}

interface ShippingZone {
  id: string;
  zone_name: string;
  zone_type: 'city' | 'area' | 'distance' | 'state';
  city: string;
  state: string;
  area_keywords: string;
  min_distance_km: number;
  max_distance_km: number;
  shipping_charge: number;
  free_shipping_above: number;
  delivery_days: number;
  is_active: boolean;
  priority: number;
  created_at: string;
}

type Tab = 'overview' | 'analytics' | 'orders' | 'products' | 'inventory' | 'coupons' | 'categories' | 'themes' | 'couriers' | 'story' | 'users' | 'google-reviews' | 'invoices' | 'vyaapar' | 'shop' | 'collections' | 'workshops-admin' | 'custom-products-admin' | 'pincodes' | 'brand-templates' | 'shipping-policy' | 'privacy-policy' | 'terms-conditions' | 'shipping-charges';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-gray-50 text-gray-700 border-gray-200',
};

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const DEFAULT_STORY: StoryContent = {
  section_key: 'craft_story',
  title: 'Our Craft Story',
  subtitle: 'Handcrafted with love',
  body: 'Every piece we create tells a story of passion, creativity, and dedication to the art of resin crafting.',
  image_url: '',
  image_alt: 'Craft story image',
  quote: 'Art is not what you see, but what you make others see.',
  quote_author: 'PurelyJid',
  extra_data: {},
};

const EMPTY_PRODUCT = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  price: 0,
  original_price: null as number | null,
  stock_quantity: 0,
  low_stock_threshold: 5,
  sku: '',
  weight: '',
  dimensions: '',
  material: '',
  badge: null as string | null,
  badge_color: 'bg-primary',
  image_url: null as string | null,
  alt_text: '',
  additional_images: [] as { url: string; alt: string }[],
  specifications: [] as { label: string; value: string }[],
  care_instructions: '',
  tags: [] as string[],
  is_featured: false,
  is_active: true,
  in_stock: true,
  display_order: 0,
  category_id: null as string | null,
};

const EMPTY_COUPON = {
  code: '',
  discount_type: 'percentage\' as \'percentage\' | \'fixed',
  discount_value: 0,
  min_order_amount: null as number | null,
  max_uses: null as number | null,
  expires_at: null as string | null,
  is_active: true,
  description: '',
};

const EMPTY_COURIER = {
  name: '',
  api_key: '',
  base_url: '',
  tracking_url: '',
  is_active: true,
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [themes, setThemes] = useState<StoreTheme[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couriers, setCouriers] = useState<CourierPartner[]>([]);
  const [storyContent, setStoryContent] = useState<StoryContent>(DEFAULT_STORY);

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Google Reviews
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googlePlaceData, setGooglePlaceData] = useState<GooglePlaceResult | null>(null);
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [googleReviewsError, setGoogleReviewsError] = useState('');

  // Bulk CSV Upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<Omit<Product, 'id' | 'categories'>[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // GST Settings
  const [gstSettings, setGstSettings] = useState<GSTSettings>({
    gstin: '', business_name: 'PurelyJid', business_address: '', state_code: '29',
    hsn_code: '3926', gst_rate: 12,
  });
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<string>('');
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Vyaapar
  const [vyaaparFile, setVyaaparFile] = useState<File | null>(null);
  const [vyaaparPreview, setVyaaparPreview] = useState<{ name: string; sku: string; qty: number; matched: boolean }[]>([]);
  const [importingVyaapar, setImportingVyaapar] = useState(false);
  const [vyaaparErrors, setVyaaparErrors] = useState<string[]>([]);
  const vyaaparInputRef = useRef<HTMLInputElement>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Workshop Catalogues
  const [workshopCatalogues, setWorkshopCatalogues] = useState<WorkshopCatalogue[]>([]);
  const [showCatalogueModal, setShowCatalogueModal] = useState(false);
  const [editingCatalogue, setEditingCatalogue] = useState<WorkshopCatalogue | null>(null);
  const [catalogueForm, setCatalogueForm] = useState({ title: '', description: '', file_url: '', file_name: '', file_size: 0, thumbnail_url: '', is_active: true });
  const [savingCatalogue, setSavingCatalogue] = useState(false);
  const [deletingCatalogue, setDeletingCatalogue] = useState<string | null>(null);
  const [catalogueThumbnailFile, setCatalogueThumbnailFile] = useState<File | null>(null);
  const [catalogueThumbnailPreview, setCatalogueThumbnailPreview] = useState<string>('');
  const catalogueThumbnailInputRef = useRef<HTMLInputElement>(null);

  // Workshops
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [workshopForm, setWorkshopForm] = useState({ title: '', description: '', instructor: '', location: '', workshop_date: '', duration: '', price: 0, max_participants: '' as string | number, is_active: true, catalogue_id: '' });
  const [savingWorkshop, setSavingWorkshop] = useState(false);
  const [deletingWorkshop, setDeletingWorkshop] = useState<string | null>(null);
  const [workshopCatalogueFile, setWorkshopCatalogueFile] = useState<File | null>(null);
  const workshopCatalogueInputRef = useRef<HTMLInputElement>(null);

  // Custom Products
  const [customProducts, setCustomProducts] = useState<CustomProduct[]>([]);
  const [customEnquiries, setCustomEnquiries] = useState<CustomEnquiry[]>([]);
  const [showCustomProductModal, setShowCustomProductModal] = useState(false);
  const [editingCustomProduct, setEditingCustomProduct] = useState<CustomProduct | null>(null);
  const [customProductForm, setCustomProductForm] = useState({ name: '', description: '', category: 'Preserved Florals', price_range: '', images: '[]', catalogue_url: '', is_active: true, display_order: 0 });
  const [savingCustomProduct, setSavingCustomProduct] = useState(false);
  const [deletingCustomProduct, setDeletingCustomProduct] = useState<string | null>(null);
  const [customProductImageFile, setCustomProductImageFile] = useState<File | null>(null);
  const [customProductImagePreview, setCustomProductImagePreview] = useState<string>('');
  const customProductImageInputRef = useRef<HTMLInputElement>(null);

  // Delivery Pincodes
  const [pincodes, setPincodes] = useState<DeliveryPincode[]>([]);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [editingPincode, setEditingPincode] = useState<DeliveryPincode | null>(null);
  const [pincodeForm, setPincodeForm] = useState({ pincode: '', area_name: '', city: '', state: '', is_active: true, delivery_days: 3, extra_charge: 0, free_shipping_above: 0 });
  const [savingPincode, setSavingPincode] = useState(false);
  const [deletingPincode, setDeletingPincode] = useState<string | null>(null);
  const [pincodeSearch, setPincodeSearch] = useState('');
  const [bulkPincodes, setBulkPincodes] = useState('');
  const [importingPincodes, setImportingPincodes] = useState(false);

  // Shipping Zones
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [zoneForm, setZoneForm] = useState({ zone_name: '', zone_type: 'city' as ShippingZone['zone_type'], city: '', state: '', area_keywords: '', min_distance_km: 0, max_distance_km: 9999, shipping_charge: 0, free_shipping_above: 0, delivery_days: 5, is_active: true, priority: 0 });
  const [savingZone, setSavingZone] = useState(false);
  const [deletingZone, setDeletingZone] = useState<string | null>(null);
  const [zoneSearch, setZoneSearch] = useState('');
  const [shippingTab, setShippingTab] = useState<'pincodes' | 'zones'>('pincodes');

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Omit<Product, 'id' | 'categories'>>(EMPTY_PRODUCT);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>('');
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', display_order: 0, is_active: true });
  const [savingCategory, setSavingCategory] = useState(false);

  // Coupon modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState<Omit<Coupon, 'id' | 'used_count' | 'created_at'>>(EMPTY_COUPON);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<string | null>(null);

  // Courier modal
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState<CourierPartner | null>(null);
  const [courierForm, setCourierForm] = useState<Omit<CourierPartner, 'id' | 'created_at'>>(EMPTY_COURIER);
  const [savingCourier, setSavingCourier] = useState(false);
  const [deletingCourier, setDeletingCourier] = useState<string | null>(null);

  // Story editing
  const [storyForm, setStoryForm] = useState<StoryContent>(DEFAULT_STORY);
  const [savingStory, setSavingStory] = useState(false);
  const [editingStory, setEditingStory] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  // Policy Pages
  const [shippingContent, setShippingContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [savingShipping, setSavingShipping] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);

  // Inventory
  const [updatingStock, setUpdatingStock] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');

  // Theme
  const [activatingTheme, setActivatingTheme] = useState<string | null>(null);

  // Stats
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const lowStockProducts = products.filter((p) => (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5) && p.in_stock);
  const outOfStockProducts = products.filter((p) => !p.in_stock);

  // Analytics helpers
  const getRevenueByMonth = () => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      const month = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      map[month] = (map[month] || 0) + o.total;
    });
    return Object.entries(map).map(([month, revenue]) => ({ month, revenue })).slice(-6);
  };

  const getOrdersByStatus = () => {
    const map: Record<string, number> = {};
    orders.forEach((o) => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  };

  const getOrderWhatsAppLink = (order: Order) => {
    const phone = '919518770073';
    const msg = encodeURIComponent(`Hi! I have a query about my order #${order.order_number}. Total: ₹${(order.total / 100).toLocaleString('en-IN')}`);
    return `https://wa.me/${phone}?text=${msg}`;
  };

  // ─── Data Fetching ────────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const supabase = createClient();

      // ── Batch 1: Core data (orders, users, products, categories, themes) ──
      const [ordersRes, usersRes, productsRes, categoriesRes, themesRes] = await Promise.all([
        supabase.from('orders').select('*, user_profiles(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*, categories(name)').order('display_order', { ascending: true }),
        supabase.from('categories').select('*').order('display_order', { ascending: true }),
        supabase.from('store_themes').select('*').order('created_at', { ascending: true }),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (themesRes.data) setThemes(themesRes.data);

      // ── Batch 2: Commerce & content data ──
      const [couponsRes, couriersRes, storyRes, workshopRes, customRes, enquiriesRes] = await Promise.all([
        supabase.from('coupons').select('*').order('created_at', { ascending: false }),
        supabase.from('courier_partners').select('*').order('created_at', { ascending: false }),
        supabase.from('story_content').select('*').eq('section_key', 'craft_story').single(),
        supabase.from('workshop_catalogues').select('*').order('created_at', { ascending: false }),
        supabase.from('custom_products').select('*').order('display_order', { ascending: true }),
        supabase.from('custom_enquiries').select('*').order('created_at', { ascending: false }),
      ]);
      if (couponsRes.data) setCoupons(couponsRes.data);
      if (couriersRes.data) setCouriers(couriersRes.data);
      if (storyRes.data) { setStoryContent(storyRes.data); setStoryForm(storyRes.data); }
      if (workshopRes.data) setWorkshopCatalogues(workshopRes.data);
      if (customRes.data) setCustomProducts(customRes.data);
      if (enquiriesRes.data) setCustomEnquiries(enquiriesRes.data);

      // ── Batch 3: Shipping, policy pages & workshops ──
      const [pincodesRes, zonesRes, shippingRes, privacyRes, termsRes, workshopsRes] = await Promise.all([
        supabase.from('delivery_pincodes').select('*').order('pincode', { ascending: true }),
        supabase.from('shipping_zones').select('*').order('priority', { ascending: false }),
        supabase.from('story_content').select('body').eq('section_key', 'shipping_policy').single(),
        supabase.from('story_content').select('body').eq('section_key', 'privacy_policy').single(),
        supabase.from('story_content').select('body').eq('section_key', 'terms_conditions').single(),
        supabase.from('workshops').select('*').order('created_at', { ascending: false }),
      ]);
      if (pincodesRes.data) setPincodes(pincodesRes.data);
      if (zonesRes.data) setShippingZones(zonesRes.data);
      if (shippingRes.data?.body) setShippingContent(shippingRes.data.body);
      if (privacyRes.data?.body) setPrivacyContent(privacyRes.data.body);
      if (termsRes.data?.body) setTermsContent(termsRes.data.body);
      if (workshopsRes.data) setWorkshops(workshopsRes.data);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        // Check admin_session cookie via a lightweight API call
        const res = await fetch('/api/admin-auth/check', { method: 'GET' });
        if (res.ok) {
          setIsAdmin(true);
          fetchData();
        } else {
          router.push('/admin-panel/login');
        }
      } catch {
        router.push('/admin-panel/login');
      } finally {
        setCheckingRole(false);
      }
    };
    checkAdminSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin-auth/logout', { method: 'POST' });
    } catch {
      // ignore errors
    }
    router.push('/admin-panel/login');
  };

  // ─── Bulk CSV Upload ─────────────────────────────────────────────────────────

  const parseCsvProducts = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) { setCsvErrors(['CSV must have a header row and at least one data row.']); return; }
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    const required = ['name', 'price'];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) { setCsvErrors([`Missing required columns: ${missing.join(', ')}`]); return; }

    const errors: string[] = [];
    const products: Omit<Product, 'id' | 'categories'>[] = [];

    lines.slice(1).forEach((line, i) => {
      if (!line.trim()) return;
      // Handle quoted fields with commas inside
      const vals: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      vals.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = (vals[idx] || '').replace(/^"|"$/g, ''); });

      const price = Math.round(parseFloat(row['price'] || '0') * 100);
      if (isNaN(price) || price <= 0) { errors.push(`Row ${i + 2}: Invalid price "${row['price']}"`); return; }
      if (!row['name']?.trim()) { errors.push(`Row ${i + 2}: Name is required`); return; }

      const slug = (row['slug'] || row['name']).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const tagsRaw = row['tags'] || '';
      const tags = tagsRaw ? tagsRaw.split('|').map((t: string) => t.trim()).filter(Boolean) : [];

      products.push({
        name: row['name'],
        slug,
        description: row['description'] || '',
        short_description: row['short_description'] || '',
        price,
        original_price: row['original_price'] ? Math.round(parseFloat(row['original_price']) * 100) : null,
        category_id: row['category_slug'] ? (categories.find((c) => c.slug === row['category_slug'].trim())?.id ?? null) : null,
        material: row['material'] || '',
        badge: row['badge'] || null,
        badge_color: row['badge_color'] || 'bg-primary',
        image_url: row['image_url'] || '',
        alt_text: row['alt_text'] || row['name'],
        sku: row['sku'] || '',
        weight: row['weight'] || '',
        dimensions: row['dimensions'] || '',
        care_instructions: row['care_instructions'] || '',
        tags,
        additional_images: [],
        specifications: [],
        is_featured: (row['is_featured'] || 'false').toLowerCase() === 'true',
        in_stock: (row['in_stock'] || 'true').toLowerCase() !== 'false',
        is_active: (row['is_active'] || 'true').toLowerCase() !== 'false',
        display_order: parseInt(row['display_order'] || '0', 10) || 0,
        stock_quantity: parseInt(row['stock_quantity'] || '0', 10) || 0,
        low_stock_threshold: parseInt(row['low_stock_threshold'] || '5', 10) || 5,
      });
    });

    setCsvErrors(errors);
    setCsvPreview(products);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvPreview([]);
    setCsvErrors([]);
    const reader = new FileReader();
    reader.onload = (ev) => { parseCsvProducts(ev.target?.result as string); };
    reader.readAsText(file);
  };

  const uploadCsvProducts = async () => {
    if (csvPreview.length === 0) { showToast('No valid products to upload.', 'error'); return; }
    setUploadingCsv(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('products').insert(csvPreview.map((p) => ({ ...p, updated_at: new Date().toISOString() })));
      if (error) throw error;
      showToast(`${csvPreview.length} products uploaded successfully!`, 'success');
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);
      if (csvInputRef.current) csvInputRef.current.value = '';
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload products.', 'error');
    } finally { setUploadingCsv(false); }
  };

  const downloadCsvTemplate = () => {
    const headers = 'name,slug,description,short_description,price,original_price,category_slug,material,badge,badge_color,image_url,alt_text,sku,weight,dimensions,care_instructions,tags,in_stock,is_active,is_featured,display_order,stock_quantity,low_stock_threshold';
    const categoryExample = categories.length > 0 ? categories[0].slug : 'jewelry';
    const example = `Aurora Pendant,aurora-pendant,"Beautiful handcrafted resin pendant with aurora swirls","Handcrafted aurora resin pendant",3800,4800,${categoryExample},Resin + Crystal,Bestseller,bg-primary,https://example.com/img.jpg,"Aurora pendant on white background",ARP-001,15g,"3 x 3 x 0.5 cm","Avoid sunlight. Clean with soft cloth.","pendant|jewelry|resin",true,true,false,1,50,5`;
    const blob = new Blob([headers + '\n' + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'products_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBrandTemplate = (type: string) => {
    let content = '';
    let filename = '';
    const mimeType = 'text/html';

    if (type === 'invoice') {
      filename = 'PurelyJid_Invoice_Template.html';
      content = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>PurelyJid GST Invoice</title></head><body><h1>PurelyJid Invoice Template</h1><p>Customize this template with your business details.</p></body></html>`;
    } else if (type === 'brand') {
      filename = 'PurelyJid_Brand_Template.html';
      content = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>PurelyJid Brand Template</title></head><body><h1>PurelyJid Brand Template</h1><p>Customize this template with your brand assets.</p></body></html>`;
    } else {
      filename = 'PurelyJid_Brand_Presentation.html';
      content = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>PurelyJid Brand Presentation</title></head><body><h1>PurelyJid Brand Presentation</h1><p>Customize this template with your brand content.</p></body></html>`;
    }

    if (!content) return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── GST Invoice Generation ──────────────────────────────────────────────────

  const generateGSTInvoice = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) { showToast('Order not found.', 'error'); return; }
    if (!gstSettings.gstin.trim()) { showToast('Please enter your GSTIN first.', 'error'); return; }
    setGeneratingInvoice(true);
    try {
      const supabase = createClient();
      const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', orderId);
      const items = orderItems || [];

      const subtotal = order.total / 100;
      const gstRate = gstSettings.gst_rate;
      const taxableValue = subtotal / (1 + gstRate / 100);
      const cgst = (taxableValue * gstRate) / 200;
      const sgst = (taxableValue * gstRate) / 200;

      const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GST Invoice - ${order.order_number}</title></head><body>
        <h2>${gstSettings.business_name} - TAX INVOICE</h2>
        <p>Invoice No: INV-${order.order_number} | Date: ${invoiceDate} | Order Date: ${orderDate}</p>
        <p>GSTIN: ${gstSettings.gstin}</p>
        <p>Customer: ${(order as any).user_profiles?.full_name || 'Customer'}</p>
        <table border="1"><tr><th>#</th><th>Item</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
        ${items.map((item: any, idx: number) => `<tr><td>${idx + 1}</td><td>${item.product_name}</td><td>${gstSettings.hsn_code}</td><td>${item.quantity}</td><td>₹${(item.price / 100).toFixed(2)}</td><td>₹${((item.price * item.quantity) / 100).toFixed(2)}</td></tr>`).join('')}
        </table>
        <p>Taxable Value: ₹${taxableValue.toFixed(2)}</p>
        <p>CGST @ ${gstRate / 2}%: ₹${cgst.toFixed(2)}</p>
        <p>SGST @ ${gstRate / 2}%: ₹${sgst.toFixed(2)}</p>
        <p><strong>Grand Total: ₹${(order.total / 100).toFixed(2)}</strong></p>
      </body></html>`;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
      }
      showToast('Invoice generated! Use browser print to save as PDF.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate invoice.', 'error');
    } finally { setGeneratingInvoice(false); }
  };

  // ─── Vyaapar CSV Export ──────────────────────────────────────────────────────

  const exportOrdersVyaapar = () => {
    setExportingCsv(true);
    try {
      const headers = ['Date', 'Invoice No', 'Party Name', 'Party Email', 'Item Name', 'Qty', 'Rate', 'Amount', 'GST%', 'GSTIN', 'HSN Code', 'Total', 'Payment Mode', 'Status'];
      const rows: string[][] = [];
      orders.forEach((order) => {
        const date = new Date(order.created_at).toLocaleDateString('en-IN');
        rows.push([
          date,
          `INV-${order.order_number}`,
          (order as any).user_profiles?.full_name || 'Customer',
          (order as any).user_profiles?.email || '',
          'Order Items (see details)',
          '1',
          (order.total / 100).toFixed(2),
          (order.total / 100).toFixed(2),
          gstSettings.gst_rate.toString(),
          gstSettings.gstin,
          gstSettings.hsn_code,
          (order.total / 100).toFixed(2),
          (order as any).payment_id ? 'Online' : 'COD',
          order.status,
        ]);
      });
      const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `vyaapar_orders_${new Date().toISOString().split('T')[0]}.csv`; a.click();
      URL.revokeObjectURL(url);
      showToast('Orders exported in Vyaapar format!', 'success');
    } catch (err: any) {
      showToast('Failed to export orders.', 'error');
    } finally { setExportingCsv(false); }
  };

  const exportInvoicesVyaapar = () => {
    setExportingCsv(true);
    try {
      const headers = ['Invoice Date', 'Invoice No', 'Party Name', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Grand Total', 'GSTIN', 'HSN Code', 'Payment Status'];
      const rows: string[][] = [];
      orders.forEach((order) => {
        const subtotal = order.total / 100;
        const taxable = subtotal / (1 + gstSettings.gst_rate / 100);
        const cgst = (taxable * gstSettings.gst_rate) / 200;
        const sgst = (taxable * gstSettings.gst_rate) / 200;
        rows.push([
          new Date(order.created_at).toLocaleDateString('en-IN'),
          `INV-${order.order_number}`,
          (order as any).user_profiles?.full_name || 'Customer',
          taxable.toFixed(2),
          cgst.toFixed(2),
          sgst.toFixed(2),
          '0.00',
          (cgst + sgst).toFixed(2),
          subtotal.toFixed(2),
          gstSettings.gstin,
          gstSettings.hsn_code,
          order.status === 'delivered' ? 'Paid' : 'Pending',
        ]);
      });
      const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `vyaapar_invoices_${new Date().toISOString().split('T')[0]}.csv`; a.click();
      URL.revokeObjectURL(url);
      showToast('Invoices exported in Vyaapar format!', 'success');
    } catch (err: any) {
      showToast('Failed to export invoices.', 'error');
    } finally { setExportingCsv(false); }
  };

  // ── Vyaapar Stock Import ────────────────────────────────────────────────────

  const parseVyaaparStock = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) { setVyaaparErrors(['CSV must have a header row and at least one data row.']); return; }
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));

    const nameIdx = headers.findIndex((h) => h.includes('item') || h.includes('product') || h.includes('name'));
    const skuIdx = headers.findIndex((h) => h.includes('sku') || h.includes('code') || h.includes('item code'));
    const qtyIdx = headers.findIndex((h) => h.includes('qty') || h.includes('quantity') || h.includes('stock') || h.includes('closing'));

    if (nameIdx === -1 || qtyIdx === -1) {
      setVyaaparErrors(['Could not find required columns. Expected: Item Name, SKU/Code, Quantity/Stock/Closing Stock']); return;
    }

    const errors: string[] = [];
    const preview: { name: string; sku: string; qty: number; matched: boolean }[] = [];

    lines.slice(1).forEach((line, i) => {
      if (!line.trim()) return;
      const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const name = vals[nameIdx] || '';
      const sku = skuIdx >= 0 ? (vals[skuIdx] || '') : '';
      const qty = parseInt(vals[qtyIdx] || '0', 10);
      if (!name) { errors.push(`Row ${i + 2}: Item name is empty`); return; }
      if (isNaN(qty)) { errors.push(`Row ${i + 2}: Invalid quantity "${vals[qtyIdx]}"`); return; }
      const matched = products.some((p) => p.name.toLowerCase() === name.toLowerCase() || (sku && p.slug.includes(sku.toLowerCase())));
      preview.push({ name, sku, qty, matched });
    });

    setVyaaparErrors(errors);
    setVyaaparPreview(preview);
  };

  const handleVyaaparFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVyaaparFile(file);
    setVyaaparPreview([]);
    setVyaaparErrors([]);
    const reader = new FileReader();
    reader.onload = (ev) => { parseVyaaparStock(ev.target?.result as string); };
    reader.readAsText(file);
  };

  const importVyaaparStock = async () => {
    const matched = vyaaparPreview.filter((v) => v.matched);
    if (matched.length === 0) { showToast('No matching products found to update.', 'error'); return; }
    setImportingVyaapar(true);
    try {
      const supabase = createClient();
      let updated = 0;
      for (const item of matched) {
        const product = products.find((p) => p.name.toLowerCase() === item.name.toLowerCase() || (item.sku && p.slug.includes(item.sku.toLowerCase())));
        if (!product) continue;
        const { error } = await supabase.from('products').update({ stock_quantity: item.qty, in_stock: item.qty > 0, updated_at: new Date().toISOString() }).eq('id', product.id);
        if (!error) updated++;
      }
      showToast(`Updated stock for ${updated} products from Vyaapar export!`, 'success');
      setVyaaparFile(null);
      setVyaaparPreview([]);
      setVyaaparErrors([]);
      if (vyaaparInputRef.current) vyaaparInputRef.current.value = '';
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to import stock.', 'error');
    } finally { setImportingVyaapar(false); }
  };

  // ── WORKSHOP CATALOGUE ACTIONS ───────────────────────────────────────────

  const openAddCatalogue = () => {
    setEditingCatalogue(null);
    setCatalogueForm({ title: '', description: '', file_url: '', file_name: '', file_size: 0, thumbnail_url: '', is_active: true });
    setCatalogueThumbnailFile(null);
    setCatalogueThumbnailPreview('');
    setShowCatalogueModal(true);
  };

  const openEditCatalogue = (cat: WorkshopCatalogue) => {
    setEditingCatalogue(cat);
    setCatalogueForm({ title: cat.title, description: cat.description, file_url: cat.file_url, file_name: cat.file_name, file_size: cat.file_size, thumbnail_url: cat.thumbnail_url || '', is_active: cat.is_active });
    setCatalogueThumbnailFile(null);
    setCatalogueThumbnailPreview(cat.thumbnail_url || '');
    setShowCatalogueModal(true);
  };

  const handleCatalogueThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCatalogueThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCatalogueThumbnailPreview(dataUrl);
      setCatalogueForm((p) => ({ ...p, thumbnail_url: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const saveCatalogue = async () => {
    if (!catalogueForm.title.trim() || !catalogueForm.file_url.trim()) {
      showToast('Title and file URL are required.', 'error'); return;
    }
    setSavingCatalogue(true);
    try {
      const supabase = createClient();
      const payload = {
        title: catalogueForm.title.trim(),
        description: catalogueForm.description.trim(),
        file_url: catalogueForm.file_url.trim(),
        file_name: catalogueForm.file_name.trim() || catalogueForm.title.trim() + '.pdf',
        file_size: Number(catalogueForm.file_size) || 0,
        thumbnail_url: catalogueForm.thumbnail_url.trim() || null,
        is_active: catalogueForm.is_active,
        updated_at: new Date().toISOString(),
      };
      if (editingCatalogue) {
        const { error } = await supabase.from('workshop_catalogues').update(payload).eq('id', editingCatalogue.id);
        if (error) throw error;
        showToast('Catalogue updated.', 'success');
      } else {
        const { error } = await supabase.from('workshop_catalogues').insert({ ...payload, download_count: 0 });
        if (error) throw error;
        showToast('Catalogue uploaded successfully!', 'success');
      }
      setShowCatalogueModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save catalogue.', 'error');
    } finally { setSavingCatalogue(false); }
  };

  const deleteCatalogue = async (id: string) => {
    setDeletingCatalogue(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('workshop_catalogues').delete().eq('id', id);
      if (error) throw error;
      setWorkshopCatalogues((prev) => prev.filter((c) => c.id !== id));
      showToast('Catalogue deleted.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete catalogue.', 'error');
    } finally { setDeletingCatalogue(null); }
  };

  const toggleCatalogueActive = async (cat: WorkshopCatalogue) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('workshop_catalogues').update({ is_active: !cat.is_active }).eq('id', cat.id);
      if (error) throw error;
      setWorkshopCatalogues((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
      showToast(`Catalogue ${!cat.is_active ? 'published' : 'unpublished'}.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update catalogue.', 'error');
    }
  };

  // ── WORKSHOP ACTIONS ─────────────────────────────────────────────────────

  const openAddWorkshop = () => {
    setEditingWorkshop(null);
    setWorkshopForm({ title: '', description: '', instructor: '', location: '', workshop_date: '', duration: '', price: 0, max_participants: '' as string | number, is_active: true, catalogue_id: '' });
    setShowWorkshopModal(true);
  };

  const openEditWorkshop = (w: Workshop) => {
    setEditingWorkshop(w);
    setWorkshopForm({
      title: w.title,
      description: w.description || '',
      instructor: w.instructor || '',
      location: w.location || '',
      workshop_date: w.workshop_date ? w.workshop_date.slice(0, 16) : '',
      duration: w.duration || '',
      price: w.price || 0,
      max_participants: w.max_participants ?? '',
      is_active: w.is_active,
      catalogue_id: w.catalogue_id || '',
    });
    setShowWorkshopModal(true);
  };

  const saveWorkshop = async () => {
    if (!workshopForm.title.trim()) { showToast('Workshop title is required.', 'error'); return; }
    setSavingWorkshop(true);
    try {
      const supabase = createClient();
      const payload = {
        title: workshopForm.title.trim(),
        description: workshopForm.description.trim() || null,
        instructor: workshopForm.instructor.trim() || null,
        location: workshopForm.location.trim() || null,
        workshop_date: workshopForm.workshop_date || null,
        duration: workshopForm.duration.trim() || null,
        price: Number(workshopForm.price) || 0,
        max_participants: workshopForm.max_participants !== '' ? Number(workshopForm.max_participants) : null,
        is_active: workshopForm.is_active,
        catalogue_id: workshopForm.catalogue_id || null,
        updated_at: new Date().toISOString(),
      };
      if (editingWorkshop) {
        const { error } = await supabase.from('workshops').update(payload).eq('id', editingWorkshop.id);
        if (error) throw error;
        showToast('Workshop updated.', 'success');
      } else {
        const { error } = await supabase.from('workshops').insert(payload);
        if (error) throw error;
        showToast('Workshop created!', 'success');
      }
      setShowWorkshopModal(false);
      const supabase2 = createClient();
      const { data } = await supabase2.from('workshops').select('*').order('created_at', { ascending: false });
      if (data) setWorkshops(data);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save workshop.', 'error');
    } finally { setSavingWorkshop(false); }
  };

  const deleteWorkshop = async (id: string) => {
    setDeletingWorkshop(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('workshops').delete().eq('id', id);
      if (error) throw error;
      setWorkshops((prev) => prev.filter((w) => w.id !== id));
      showToast('Workshop deleted.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete workshop.', 'error');
    } finally { setDeletingWorkshop(null); }
  };

  const toggleWorkshopActive = async (w: Workshop) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('workshops').update({ is_active: !w.is_active }).eq('id', w.id);
      if (error) throw error;
      setWorkshops((prev) => prev.map((ws) => ws.id === w.id ? { ...ws, is_active: !ws.is_active } : ws));
      showToast(`Workshop ${!w.is_active ? 'published' : 'unpublished'}.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update workshop.', 'error');
    }
  };

  const handleCatalogueFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      showToast('Only PDF and image files are allowed.', 'error');
      return;
    }
    setWorkshopCatalogueFile(file);
    // Pre-fill file name in catalogue form
    setCatalogueForm((p) => ({ ...p, file_name: file.name, file_size: file.size }));
  };

  // ── CUSTOM PRODUCT ACTIONS ───────────────────────────────────────────────

  const openAddCustomProduct = () => {
    setEditingCustomProduct(null);
    setCustomProductForm({ name: '', description: '', category: 'Preserved Florals', price_range: '', images: '[]', catalogue_url: '', is_active: true, display_order: 0 });
    setCustomProductImageFile(null);
    setCustomProductImagePreview('');
    setShowCustomProductModal(true);
  };

  const openEditCustomProduct = (p: CustomProduct) => {
    setEditingCustomProduct(p);
    setCustomProductForm({
      name: p.name, description: p.description, category: p.category,
      price_range: p.price_range, images: JSON.stringify(p.images || []),
      catalogue_url: p.catalogue_url || '', is_active: p.is_active, display_order: p.display_order,
    });
    setCustomProductImageFile(null);
    const firstImage = p.images?.[0]?.url || '';
    setCustomProductImagePreview(firstImage);
    setShowCustomProductModal(true);
  };

  const handleCustomProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomProductImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCustomProductImagePreview(dataUrl);
      // Inject as first image in the images JSON array
      const currentImages = (() => { try { return JSON.parse(customProductForm.images || '[]'); } catch { return []; } })();
      const newImages = [{ url: dataUrl, alt: customProductForm.name || 'Custom product image' }, ...currentImages.filter((_: any, i: number) => i > 0)];
      setCustomProductForm((p) => ({ ...p, images: JSON.stringify(newImages) }));
    };
    reader.readAsDataURL(file);
  };

  const saveCustomProduct = async () => {
    if (!customProductForm.name.trim()) { showToast('Product name is required.', 'error'); return; }
    setSavingCustomProduct(true);
    try {
      const supabase = createClient();
      let parsedImages = [];
      try { parsedImages = JSON.parse(customProductForm.images || '[]'); } catch {}
      const payload = {
        name: customProductForm.name.trim(),
        description: customProductForm.description.trim(),
        category: customProductForm.category.trim(),
        price_range: customProductForm.price_range.trim(),
        images: parsedImages,
        catalogue_url: customProductForm.catalogue_url.trim() || null,
        is_active: customProductForm.is_active,
        display_order: Number(customProductForm.display_order) || 0,
        updated_at: new Date().toISOString(),
      };
      if (editingCustomProduct) {
        const { error } = await supabase.from('custom_products').update(payload).eq('id', editingCustomProduct.id);
        if (error) throw error;
        showToast('Custom product updated.', 'success');
      } else {
        const { error } = await supabase.from('custom_products').insert(payload);
        if (error) throw error;
        showToast('Custom product added.', 'success');
      }
      setShowCustomProductModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save custom product.', 'error');
    } finally { setSavingCustomProduct(false); }
  };

  const deleteCustomProduct = async (id: string) => {
    setDeletingCustomProduct(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('custom_products').delete().eq('id', id);
      if (error) throw error;
      setCustomProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Custom product deleted.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete custom product.', 'error');
    } finally { setDeletingCustomProduct(null); }
  };

  const updateEnquiryStatus = async (id: string, status: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('custom_enquiries').update({ status }).eq('id', id);
      if (error) throw error;
      setCustomEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
      showToast('Enquiry status updated.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update enquiry.', 'error');
    }
  };

  // ─── PINCODE ACTIONS ──────────────────────────────────────────────────────

  const openAddPincode = () => {
    setEditingPincode(null);
    setPincodeForm({ pincode: '', area_name: '', city: '', state: '', is_active: true, delivery_days: 3, extra_charge: 0, free_shipping_above: 0 });
    setShowPincodeModal(true);
  };

  const openEditPincode = (p: DeliveryPincode) => {
    setEditingPincode(p);
    setPincodeForm({ pincode: p.pincode, area_name: p.area_name, city: p.city, state: p.state, is_active: p.is_active, delivery_days: p.delivery_days, extra_charge: p.extra_charge, free_shipping_above: p.free_shipping_above ?? 0 });
    setShowPincodeModal(true);
  };

  const savePincode = async () => {
    if (!pincodeForm.pincode.trim() || pincodeForm.pincode.trim().length !== 6) {
      showToast('Please enter a valid 6-digit pincode.', 'error'); return;
    }
    setSavingPincode(true);
    try {
      const supabase = createClient();
      const payload = { ...pincodeForm, pincode: pincodeForm.pincode.trim(), delivery_days: Number(pincodeForm.delivery_days), extra_charge: Number(pincodeForm.extra_charge) };
      if (editingPincode) {
        const { error } = await supabase.from('delivery_pincodes').update(payload).eq('id', editingPincode.id);
        if (error) throw error;
        showToast('Pincode updated.', 'success');
      } else {
        const { error } = await supabase.from('delivery_pincodes').insert(payload);
        if (error) throw error;
        showToast('Pincode added.', 'success');
      }
      setShowPincodeModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save pincode.', 'error');
    } finally {
      setSavingPincode(false);
    }
  };

  const deletePincode = async (id: string) => {
    setDeletingPincode(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('delivery_pincodes').delete().eq('id', id);
      if (error) throw error;
      setPincodes((prev) => prev.filter((p) => p.id !== id));
      showToast('Pincode removed.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete pincode.', 'error');
    } finally {
      setDeletingPincode(null);
    }
  };

  const togglePincodeActive = async (p: DeliveryPincode) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('delivery_pincodes').update({ is_active: !p.is_active }).eq('id', p.id);
      if (error) throw error;
      setPincodes((prev) => prev.map((pin) => pin.id === p.id ? { ...pin, is_active: !pin.is_active } : pin));
      showToast(`Pincode ${!p.is_active ? 'activated' : 'deactivated'}.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update pincode.', 'error');
    }
  };

  const importBulkPincodes = async () => {
    const lines = bulkPincodes.trim().split('\n').map((l) => l.trim()).filter((l) => l.length === 6 && /^\d+$/.test(l));
    if (lines.length === 0) { showToast('No valid 6-digit pincodes found.', 'error'); return; }
    setImportingPincodes(true);
    try {
      const supabase = createClient();
      const existing = pincodes.map((p) => p.pincode);
      const newPincodes = lines.filter((p) => !existing.includes(p)).map((pincode) => ({ pincode, area_name: '', city: '', state: '', is_active: true, delivery_days: 3, extra_charge: 0 }));
      if (newPincodes.length === 0) { showToast('All pincodes already exist.', 'error'); return; }
      const { error } = await supabase.from('delivery_pincodes').insert(newPincodes);
      if (error) throw error;
      showToast(`${newPincodes.length} pincodes added successfully!`, 'success');
      setBulkPincodes('');
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to import pincodes.', 'error');
    } finally { setImportingPincodes(false); }
  };

  // ── Shipping Zone Actions ────────────────────────────────────────────────────

  const openAddZone = () => {
    setEditingZone(null);
    setZoneForm({ zone_name: '', zone_type: 'city', city: '', state: '', area_keywords: '', min_distance_km: 0, max_distance_km: 9999, shipping_charge: 0, free_shipping_above: 0, delivery_days: 5, is_active: true, priority: 0 });
    setShowZoneModal(true);
  };

  const openEditZone = (z: ShippingZone) => {
    setEditingZone(z);
    setZoneForm({ zone_name: z.zone_name, zone_type: z.zone_type, city: z.city, state: z.state, area_keywords: z.area_keywords, min_distance_km: z.min_distance_km, max_distance_km: z.max_distance_km, shipping_charge: z.shipping_charge, free_shipping_above: z.free_shipping_above, delivery_days: z.delivery_days, is_active: z.is_active, priority: z.priority });
    setShowZoneModal(true);
  };

  const saveZone = async () => {
    if (!zoneForm.zone_name.trim()) { showToast('Zone name is required.', 'error'); return; }
    setSavingZone(true);
    try {
      const supabase = createClient();
      const payload = { ...zoneForm, shipping_charge: Number(zoneForm.shipping_charge), free_shipping_above: Number(zoneForm.free_shipping_above), delivery_days: Number(zoneForm.delivery_days), priority: Number(zoneForm.priority), min_distance_km: Number(zoneForm.min_distance_km), max_distance_km: Number(zoneForm.max_distance_km) };
      if (editingZone) {
        const { error } = await supabase.from('shipping_zones').update(payload).eq('id', editingZone.id);
        if (error) throw error;
        showToast('Shipping zone updated.', 'success');
      } else {
        const { error } = await supabase.from('shipping_zones').insert(payload);
        if (error) throw error;
        showToast('Shipping zone added.', 'success');
      }
      setShowZoneModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save zone.', 'error');
    } finally {
      setSavingZone(false);
    }
  };

  const deleteZone = async (id: string) => {
    setDeletingZone(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('shipping_zones').delete().eq('id', id);
      if (error) throw error;
      setShippingZones((prev) => prev.filter((z) => z.id !== id));
      showToast('Zone removed.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete zone.', 'error');
    } finally {
      setDeletingZone(null);
    }
  };

  const toggleZoneActive = async (z: ShippingZone) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('shipping_zones').update({ is_active: !z.is_active }).eq('id', z.id);
      if (error) throw error;
      setShippingZones((prev) => prev.map((zone) => zone.id === z.id ? { ...zone, is_active: !zone.is_active } : zone));
      showToast(`Zone ${!z.is_active ? 'activated' : 'deactivated'}.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update zone.', 'error');
    }
  };

  // ── Product Actions (stub) ───────────────────────────────────────────────

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductImageFile(null);
    setProductImagePreview('');
    setShowProductModal(true);
  };

  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProductImagePreview(dataUrl);
      setProductForm((p) => ({ ...p, image_url: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // ── Loading / Guard ─────────────────────────────────────────────────────────

  if (checkingRole) {
    return (
      <main className="bg-[#FAF6F0] min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying access…</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) return null;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'Cog6ToothIcon' },
    { id: 'analytics', label: 'Analytics', icon: 'PresentationChartLineIcon' },
    { id: 'orders', label: `Orders (${orders.length})`, icon: 'ShoppingBagIcon' },
    { id: 'invoices', label: 'Invoices & GST', icon: 'DocumentTextIcon' },
    { id: 'shop', label: 'Shop', icon: 'BuildingStorefrontIcon' },
    { id: 'products', label: `Products (${products.length})`, icon: 'ArchiveBoxIcon' },
    { id: 'inventory', label: 'Inventory', icon: 'ClipboardDocumentListIcon' },
    { id: 'coupons', label: `Coupons (${coupons.length})`, icon: 'TicketIcon' },
    { id: 'categories', label: `Categories (${categories.length})`, icon: 'TagIcon' },
    { id: 'themes', label: 'Themes', icon: 'SwatchIcon' },
    { id: 'couriers', label: `Couriers (${couriers.length})`, icon: 'TruckIcon' },
    { id: 'pincodes', label: `Pincodes (${pincodes.length})`, icon: 'MapPinIcon' },
    { id: 'story', label: 'Our Story', icon: 'BookOpenIcon' },
    { id: 'google-reviews', label: 'Google Reviews', icon: 'StarIcon' },
    { id: 'vyaapar', label: 'Vyaapar', icon: 'DocumentArrowDownIcon' },
    { id: 'workshops-admin', label: `Workshops (${workshops.length})`, icon: 'AcademicCapIcon' },
    { id: 'collections', label: `Collections (${categories.filter(c => c.is_active).length})`, icon: 'RectangleGroupIcon' },
    { id: 'custom-products-admin', label: `Custom Products (${customProducts.length})`, icon: 'SparklesIcon' },
    { id: 'brand-templates', label: 'Brand Templates', icon: 'SwatchIcon' },
    { id: 'users', label: `Users (${users.length})`, icon: 'UsersIcon' },
    { id: 'shipping-policy', label: 'Shipping Policy', icon: 'TruckIcon' },
    { id: 'privacy-policy', label: 'Privacy Policy', icon: 'ShieldCheckIcon' },
    { id: 'terms-conditions', label: 'Terms & Conditions', icon: 'DocumentTextIcon' },
    { id: 'shipping-charges', label: 'Shipping Charges', icon: 'TruckIcon' },
  ];

  const inventoryProducts = products.filter((p) =>
    !inventorySearch || p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || p.categories?.name?.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const revenueByMonth = getRevenueByMonth();
  const maxRevenue = Math.max(...revenueByMonth.map((r) => r.revenue), 1);

  return (
    <main className="bg-[#FAF6F0] min-h-screen overflow-x-hidden">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-8 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/homepage" className="text-[11px] uppercase tracking-[0.25em] font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
              <Icon name="ArrowLeftIcon" size={12} />
              Back to Home
            </Link>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
                  <Icon name="Cog6ToothIcon" size={18} className="text-white" />
                </div>
                <h1 className="font-display italic text-4xl md:text-5xl font-semibold text-foreground">
                  Admin Panel
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">Manage your store — products, orders, themes, and more.</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-foreground text-xs font-semibold uppercase tracking-[0.15em] hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="h-10 px-5 rounded-full border border-red-200 text-red-500 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-red-50 hover:border-red-400 transition-colors flex items-center gap-2"
            >
              <Icon name="ArrowRightOnRectangleIcon" size={14} />
              Logout
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 pb-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 h-10 px-5 rounded-full text-xs font-semibold uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-foreground text-[#FAF6F0]'
                    : 'border border-[rgba(196,120,90,0.2)] text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                <Icon name={tab.icon} size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-7xl">
          {fetchError && !loading && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
              <Icon name="ExclamationCircleIcon" size={16} className="text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Failed to load data</p>
                <p className="text-xs text-red-600 mt-0.5">{fetchError}</p>
              </div>
              <button onClick={fetchData} className="text-xs font-semibold text-red-600 hover:underline shrink-0">Retry</button>
            </div>
          )}

          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <AdminStatSkeleton key={i} />)
                ) : (
                  [
                    { label: 'Total Orders', value: orders.length.toString(), icon: 'ShoppingBagIcon', color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Total Revenue', value: `₹${(totalRevenue / 100).toLocaleString('en-IN')}`, icon: 'CurrencyRupeeIcon', color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Active Orders', value: pendingOrders.toString(), icon: 'ClockIcon', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Total Products', value: products.length.toString(), icon: 'ArchiveBoxIcon', color: 'text-blue-600', bg: 'bg-blue-50' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 hover:shadow-card transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">{stat.label}</p>
                        <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                          <Icon name={stat.icon} size={16} className={stat.color} />
                        </div>
                      </div>
                      <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Inventory Alerts */}
              {!loading && (lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lowStockProducts.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-600" />
                        <p className="text-sm font-semibold text-amber-800">Low Stock Alert ({lowStockProducts.length})</p>
                      </div>
                      <div className="space-y-2">
                        {lowStockProducts.slice(0, 3).map((p) => (
                          <div key={p.id} className="flex items-center justify-between">
                            <span className="text-xs text-amber-700 truncate">{p.name}</span>
                            <span className="text-xs font-bold text-amber-800 shrink-0 ml-2">{p.stock_quantity ?? 0} left</span>
                          </div>
                        ))}
                        {lowStockProducts.length > 3 && (
                          <button onClick={() => setActiveTab('inventory')} className="text-xs font-semibold text-amber-700 hover:underline">+{lowStockProducts.length - 3} more →</button>
                        )}
                      </div>
                    </div>
                  )}
                  {outOfStockProducts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="XCircleIcon" size={16} className="text-red-500" />
                        <p className="text-sm font-semibold text-red-700">Out of Stock ({outOfStockProducts.length})</p>
                      </div>
                      <div className="space-y-2">
                        {outOfStockProducts.slice(0, 3).map((p) => (
                          <div key={p.id} className="flex items-center justify-between">
                            <span className="text-xs text-red-600 truncate">{p.name}</span>
                            <button onClick={() => setActiveTab('inventory')} className="text-xs font-semibold text-red-600 hover:underline ml-2">Restock</button>
                          </div>
                        ))}
                        {outOfStockProducts.length > 3 && (
                          <button onClick={() => setActiveTab('inventory')} className="text-xs font-semibold text-red-600 hover:underline">+{outOfStockProducts.length - 3} more →</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Links */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Sales Analytics', icon: 'PresentationChartLineIcon', action: () => setActiveTab('analytics') },
                  { label: 'Add Product', icon: 'PlusCircleIcon', action: () => { setActiveTab('products'); setTimeout(openAddProduct, 100); } },
                  { label: 'Courier Partners', icon: 'TruckIcon', action: () => setActiveTab('couriers') },
                  { label: 'Edit Our Story', icon: 'BookOpenIcon', action: () => setActiveTab('story') },
                  { label: 'Inventory', icon: 'ClipboardDocumentListIcon', action: () => setActiveTab('inventory') },
                  { label: 'Coupons', icon: 'TicketIcon', action: () => setActiveTab('coupons') },
                  { label: 'View Orders', icon: 'ShoppingBagIcon', action: () => setActiveTab('orders') },
                  { label: 'Manage Users', icon: 'UsersIcon', action: () => setActiveTab('users') },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="bg-white rounded-2xl border border-[rgba(196,120,90,0.2)] p-5 flex items-center gap-3 hover:border-primary hover:shadow-card transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Icon name={item.icon} size={16} className="text-primary group-hover:text-white" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                  <h2 className="font-display italic text-lg font-semibold text-foreground">Recent Orders</h2>
                  <button onClick={() => setActiveTab('orders')} className="text-xs font-semibold text-primary hover:underline">View all →</button>
                </div>
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-4 gap-4">
                        <div className="space-y-1.5">
                          <div className="h-4 w-28 bg-[#EDE8E0] rounded animate-pulse" />
                          <div className="h-3 w-20 bg-[#EDE8E0] rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-20 bg-[#EDE8E0] rounded-full animate-pulse" />
                      </div>
                    ))
                  ) : orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between px-6 py-4 gap-4 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-foreground">#{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order?.user_profiles?.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">₹{(order.total / 100).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>{order.status}</span>
                        <a
                          href={getOrderWhatsAppLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors text-[10px] font-bold"
                          title="WhatsApp customer"
                        >
                          WA
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Analytics Tab ── */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: `₹${(totalRevenue / 100).toLocaleString('en-IN')}`, icon: 'CurrencyRupeeIcon', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Total Orders', value: orders.length.toString(), icon: 'ShoppingBagIcon', color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'Avg Order Value', value: orders.length > 0 ? `₹${((totalRevenue / orders.length) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0', icon: 'ChartBarIcon', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Total Products', value: products.length.toString(), icon: 'ArchiveBoxIcon', color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">{stat.label}</p>
                      <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                        <Icon name={stat.icon} size={16} className={stat.color} />
                      </div>
                    </div>
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <h2 className="font-display italic text-lg font-semibold text-foreground mb-4">Revenue by Month</h2>
                {revenueByMonth.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No order data yet.</p>
                ) : (
                  <div className="flex items-end gap-3 h-40">
                    {revenueByMonth.map((r) => (
                      <div key={r.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold text-foreground">₹{(r.revenue / 100).toLocaleString('en-IN', { notation: 'compact' })}</span>
                        <div className="w-full bg-primary/20 rounded-t-lg" style={{ height: `${Math.max(8, (r.revenue / maxRevenue) * 120)}px` }} />
                        <span className="text-[10px] text-muted-foreground">{r.month}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <h2 className="font-display italic text-lg font-semibold text-foreground mb-4">Orders by Status</h2>
                <div className="space-y-3">
                  {getOrdersByStatus().map(({ status, count }) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>{status}</span>
                      <div className="flex-1 bg-[#EDE8E0] rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${(count / orders.length) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Orders Tab ── */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                  <h2 className="font-display italic text-xl font-semibold text-foreground">All Orders ({orders.length})</h2>
                </div>
                {orders.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Icon name="ShoppingBagIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between px-6 py-4 gap-4 hover:bg-[#FAF6F0]/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">#{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">{order?.user_profiles?.full_name || '—'} · {order?.user_profiles?.email || ''}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">₹{(order.total / 100).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={order.status}
                            disabled={updatingOrder === order.id}
                            onChange={async (e) => {
                              setUpdatingOrder(order.id);
                              try {
                                const supabase = createClient();
                                await supabase.from('orders').update({ status: e.target.value }).eq('id', order.id);
                                setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: e.target.value } : o));
                                showToast('Order status updated.', 'success');
                              } catch { showToast('Failed to update status.', 'error'); }
                              finally { setUpdatingOrder(null); }
                            }}
                            className={`h-8 px-2 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border cursor-pointer focus:outline-none ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}
                          >
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <a
                            href={getOrderWhatsAppLink(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors text-[10px] font-bold"
                            title="WhatsApp customer"
                          >
                            WA
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Products Tab ── */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Products ({products.length})</h2>
                <div className="flex items-center gap-3">
                  <button onClick={downloadCsvTemplate} className="h-10 px-4 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-2">
                    <Icon name="ArrowDownTrayIcon" size={14} />
                    CSVTemplate
                  </button>
                  <button onClick={openAddProduct} className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2">
                    <Icon name="PlusIcon" size={14} />
                    Add Product
                  </button>
                </div>
              </div>

              {/* Bulk Action Bar */}
              {selectedProductIds.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-xs font-semibold text-amber-800 flex-1">
                    {selectedProductIds.size} product{selectedProductIds.size > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => bulkSetActive(true)}
                    disabled={bulkActionLoading}
                    className="h-8 px-4 rounded-full bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Icon name="EyeIcon" size={12} />
                    Set Active
                  </button>
                  <button
                    onClick={() => bulkSetActive(false)}
                    disabled={bulkActionLoading}
                    className="h-8 px-4 rounded-full bg-gray-500 text-white text-xs font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Icon name="EyeSlashIcon" size={12} />
                    Set Hidden
                  </button>
                  <button
                    onClick={bulkDeleteProducts}
                    disabled={bulkActionLoading}
                    className="h-8 px-4 rounded-full bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Icon name="TrashIcon" size={12} />
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedProductIds(new Set())}
                    className="h-8 w-8 rounded-full border border-amber-300 flex items-center justify-center text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <Icon name="XMarkIcon" size={12} />
                  </button>
                </div>
              )}

              {/* CSV Upload */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <h3 className="font-semibold text-foreground mb-2 text-sm">Bulk Upload via CSV</h3>
                <p className="mb-2 text-xs text-muted-foreground">Upload multiple products at once using a CSV file.</p>
                <div onClick={() => csvInputRef.current?.click()} className="border-2 border-dashed border-[rgba(196,120,90,0.3)] rounded-2xl p-6 text-center cursor-pointer hover:border-primary transition-colors mb-4">
                  <Icon name="DocumentArrowUpIcon" size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">{csvFile ? csvFile.name : 'Click to upload CSV'}</p>
                  <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFileChange} />
                </div>
                {csvErrors.length > 0 && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">{csvErrors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}</div>}
                {csvPreview.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">{csvPreview.length} products ready to upload</p>
                    <button onClick={uploadCsvProducts} disabled={uploadingCsv} className="px-4 py-2 rounded-full bg-foreground text-[#FAF6F0] font-semibold uppercase tracking-[0.1em] hover:bg-primary transition-colors disabled:opacity-50">
                      {uploadingCsv ? 'Uploading…' : `Upload ${csvPreview.length} Products`}
                    </button>
                  </div>
                )}
              </div>
              {/* Products List */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                {/* Select All header row */}
                {products.length > 0 && (
                  <div className="flex items-center gap-4 px-6 py-3 border-b border-[rgba(196,120,90,0.08)] bg-[#FAF6F0]/60">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.size === products.length && products.length > 0}
                      onChange={toggleSelectAllProducts}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                      {selectedProductIds.size === products.length && products.length > 0 ? 'Deselect All' : 'Select All'}
                    </span>
                  </div>
                )}
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {products.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Icon name="ArchiveBoxIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">No products yet</p>
                    </div>
                  ) : products.map((product) => (
                    <div key={product.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-[#FAF6F0]/50 transition-colors ${selectedProductIds.has(product.id) ? 'bg-amber-50/60' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.has(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer shrink-0"
                      />
                      <div className="w-12 h-12 rounded-xl bg-[#EDE8E0] overflow-hidden shrink-0">
                        {product.image_url ? <img src={product.image_url} alt={product.alt_text} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="PhotoIcon" size={20} className="text-muted-foreground" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.categories?.name || 'Uncategorized'} · ₹{(product.price / 100).toLocaleString('en-IN')}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{product.is_active ? 'Active' : 'Hidden'}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.in_stock ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>{product.in_stock ? 'In Stock' : 'Out of Stock'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            try {
                              const supabase = createClient();
                              await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
                              setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
                              showToast(`Product ${!product.is_active ? 'activated' : 'hidden'}.`, 'success');
                            } catch { showToast('Failed to update product.', 'error'); }
                          }}
                          className="h-8 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          {product.is_active ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => { setEditingProduct(product); setProductForm({ name: product.name, slug: product.slug, description: product.description, short_description: product.short_description || '', price: product.price, original_price: product.original_price, category_id: product.category_id, material: product.material, badge: product.badge, badge_color: product.badge_color, image_url: product.image_url, alt_text: product.alt_text, additional_images: product.additional_images || [], specifications: product.specifications || [], care_instructions: product.care_instructions || '', tags: product.tags || [], sku: product.sku || '', weight: product.weight || '', dimensions: product.dimensions || '', is_featured: product.is_featured || false, in_stock: product.in_stock, is_active: product.is_active, display_order: product.display_order, stock_quantity: product.stock_quantity, low_stock_threshold: product.low_stock_threshold }); setProductImageFile(null); setProductImagePreview(product.image_url || ''); setShowProductModal(true); }}
                          className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Icon name="PencilIcon" size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            setDeletingProduct(product.id);
                            try {
                              const supabase = createClient();
                              const { error } = await supabase.from('products').delete().eq('id', product.id);
                              if (error) throw new Error(error.message);
                              setProducts((prev) => prev.filter((p) => p.id !== product.id));
                              showToast('Product deleted.', 'success');
                            } catch (err: any) { showToast(err?.message || 'Failed to delete product.', 'error'); }
                            finally { setDeletingProduct(null); }
                          }}
                          disabled={deletingProduct === product.id}
                          className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"
                        >
                          <Icon name="TrashIcon" size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Product Modal */}
              {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                      <button onClick={() => setShowProductModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-5">
                      {/* Section: Basic Info */}
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary border-b border-[rgba(196,120,90,0.1)] pb-2">Basic Information</p>

                      {/* Product Image Upload */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Product Image</label>
                        <div
                          onClick={() => productImageInputRef.current?.click()}
                          className="relative border-2 border-dashed border-[rgba(196,120,90,0.3)] rounded-2xl overflow-hidden cursor-pointer hover:border-primary transition-colors"
                          style={{ height: productImagePreview ? 160 : 80 }}
                        >
                          {productImagePreview ? (
                            <img src={productImagePreview} alt="Product preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                              <Icon name="PhotoIcon" size={22} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Click to upload image</span>
                            </div>
                          )}
                        </div>
                        <input ref={productImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleProductImageSelect} />
                        {productImageFile && (
                          <p className="mt-1.5 text-xs text-primary font-medium flex items-center gap-1">
                            <Icon name="CheckCircleIcon" size={12} />
                            {productImageFile.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Product Name *</label>
                        <input type="text" value={(productForm as any).name || ''} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Aurora Resin Pendant" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Short Description</label>
                        <input type="text" value={(productForm as any).short_description || ''} onChange={(e) => setProductForm((p) => ({ ...p, short_description: e.target.value }))} placeholder="One-line summary shown on product detail page" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Full Description</label>
                        <textarea value={(productForm as any).description || ''} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder="Detailed product description..." className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-none" />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Category</label>
                        <select
                          value={(productForm as any).category_id || ''}
                          onChange={(e) => setProductForm((p) => ({ ...p, category_id: e.target.value || null }))}
                          className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="">— No Category —</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Image URL</label>
                        <input type="text" value={(productForm as any).image_url || ''} onChange={(e) => setProductForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://... (or upload above)" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Alt Text</label>
                        <input type="text" value={(productForm as any).alt_text || ''} onChange={(e) => setProductForm((p) => ({ ...p, alt_text: e.target.value }))} placeholder="Describe the image for accessibility" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                      </div>

                      {/* Section: Pricing & Inventory */}
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary border-b border-[rgba(196,120,90,0.1)] pb-2 pt-2">Pricing & Inventory</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Price (paise) *</label>
                          <input type="text" inputMode="numeric" value={(productForm as any).price || 0} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setProductForm((p) => ({ ...p, price: val === '' ? 0 : Number(val) })); }} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground focus:outline-none focus:border-primary" />
                          <p className="text-[10px] text-muted-foreground mt-1">₹{(((productForm as any).price || 0) / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Original Price (paise)</label>
                          <input type="text" inputMode="numeric" value={(productForm as any).original_price || ''} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setProductForm((p) => ({ ...p, original_price: val === '' ? null : Number(val) })); }} placeholder="Leave blank if no discount" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground focus:outline-none focus:border-primary" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Stock Qty</label>
                          <input type="number" min="0" value={(productForm as any).stock_quantity ?? 0} onChange={(e) => setProductForm((p) => ({ ...p, stock_quantity: Number(e.target.value) }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Low Stock Alert</label>
                          <input type="number" min="0" value={(productForm as any).low_stock_threshold ?? 5} onChange={(e) => setProductForm((p) => ({ ...p, low_stock_threshold: Number(e.target.value) }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">SKU</label>
                          <input type="text" value={(productForm as any).sku || ''} onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))} placeholder="e.g. ARP-001" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>

                      {/* Section: Product Details */}
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary border-b border-[rgba(196,120,90,0.1)] pb-2 pt-2">Product Details</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Material</label>
                          <input type="text" value={(productForm as any).material || ''} onChange={(e) => setProductForm((p) => ({ ...p, material: e.target.value }))} placeholder="e.g. Resin + Crystal" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Badge</label>
                          <input type="text" value={(productForm as any).badge || ''} onChange={(e) => setProductForm((p) => ({ ...p, badge: e.target.value || null }))} placeholder="e.g. Bestseller, New" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Weight</label>
                          <input type="text" value={(productForm as any).weight || ''} onChange={(e) => setProductForm((p) => ({ ...p, weight: e.target.value }))} placeholder="e.g. 150g" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Dimensions</label>
                          <input type="text" value={(productForm as any).dimensions || ''} onChange={(e) => setProductForm((p) => ({ ...p, dimensions: e.target.value }))} placeholder="e.g. 10 x 5 x 2 cm" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Tags <span className="normal-case font-normal">(comma-separated)</span></label>
                        <input
                          type="text"
                          value={Array.isArray((productForm as any).tags) ? (productForm as any).tags.join(', ') : ''}
                          onChange={(e) => setProductForm((p) => ({ ...p, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) }))}
                          placeholder="e.g. pendant, jewelry, resin, handmade"
                          className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Specifications <span className="normal-case font-normal">(one per line: Label: Value)</span></label>
                        <textarea
                          value={Array.isArray((productForm as any).specifications) ? (productForm as any).specifications.map((s: { label: string; value: string }) => `${s.label}: ${s.value}`).join('\n') : ''}
                          onChange={(e) => {
                            const specs = e.target.value.split('\n').map((line: string) => {
                              const colonIdx = line.indexOf(':');
                              if (colonIdx === -1) return null;
                              return { label: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() };
                            }).filter(Boolean) as { label: string; value: string }[];
                            setProductForm((p) => ({ ...p, specifications: specs }));
                          }}
                          rows={4}
                          placeholder={"Material: UV Resin + Crystal\nChain Length: 18 inches\nPendant Size: 3 cm diameter"}
                          className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Care Instructions</label>
                        <textarea
                          value={(productForm as any).care_instructions || ''}
                          onChange={(e) => setProductForm((p) => ({ ...p, care_instructions: e.target.value }))}
                          rows={3}
                          placeholder="e.g. Avoid prolonged exposure to sunlight. Clean gently with a soft cloth."
                          className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      </div>

                      {/* Section: Visibility */}
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary border-b border-[rgba(196,120,90,0.1)] pb-2 pt-2">Visibility & Status</p>

                      <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(productForm as any).is_active} onChange={(e) => setProductForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                          <span className="text-xs font-semibold text-foreground">Active (visible to customers)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(productForm as any).in_stock} onChange={(e) => setProductForm((p) => ({ ...p, in_stock: e.target.checked }))} className="w-4 h-4 accent-primary" />
                          <span className="text-xs font-semibold text-foreground">In Stock</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={(productForm as any).is_featured || false} onChange={(e) => setProductForm((p) => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 accent-primary" />
                          <span className="text-xs font-semibold text-foreground">Featured</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Display Order</label>
                        <input type="number" min="0" value={(productForm as any).display_order || 0} onChange={(e) => setProductForm((p) => ({ ...p, display_order: Number(e.target.value) }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowProductModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button
                        disabled={savingProduct || !(productForm as any).name?.trim()}
                        onClick={async () => {
                          if (!(productForm as any).name?.trim()) { showToast('Product name is required.', 'error'); return; }
                          setSavingProduct(true);
                          try {
                            const supabase = createClient();
                            const slug = (productForm as any).slug || (productForm as any).name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                            const payload = { ...(productForm as any), slug, updated_at: new Date().toISOString() };
                            if (editingProduct) {
                              const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
                              if (error) throw new Error(error.message);
                              showToast('Product updated.', 'success');
                            } else {
                              const { error } = await supabase.from('products').insert(payload);
                              if (error) throw new Error(error.message);
                              showToast('Product added.', 'success');
                            }
                            setShowProductModal(false);
                            fetchData();
                          } catch (err: any) { showToast(err?.message || 'Failed to save product.', 'error'); }
                          finally { setSavingProduct(false); }
                        }}
                        className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {savingProduct ? 'Saving…' : editingProduct ? 'Update Product' : 'Add Product'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Story Tab ── */}
          {activeTab === 'story' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Our Story</h2>
                <button onClick={() => { setEditingStory(false); setStoryForm({ ...storyContent, title: '', subtitle: '', body: '', image_url: '', image_alt: '', quote: '', quote_author: '' }); setShowStoryModal(true); }} className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2">
                  <Icon name="PlusIcon" size={14} />
                  Edit Story
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                {storyContent ? (
                  <div className="flex items-center gap-4 px-6 py-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EDE8E0] overflow-hidden shrink-0">
                      {storyContent.image_url ? <img src={storyContent.image_url} alt={storyContent.image_alt} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="PhotoIcon" size={20} className="text-muted-foreground" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{storyContent.title}</p>
                      <p className="text-xs text-muted-foreground">{storyContent.subtitle}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{storyContent.body?.slice(0, 80)}{storyContent.body?.length > 80 ? '…' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingStory(true);
                          setStoryForm({ ...storyContent });
                          setShowStoryModal(true);
                        }}
                        className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                        <Icon name="PencilIcon" size={12} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const supabase = createClient();
                            await supabase.from('story_content').delete().eq('id', storyContent.id!);
                            setStoryContent(DEFAULT_STORY);
                          } catch { showToast('Failed to delete story.', 'error'); }
                        }}
                        className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"
                      >
                        <Icon name="TrashIcon" size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center"><Icon name="PhotoIcon" size={32} className="text-muted-foreground mx-auto mb-3" /><p className="text-sm font-semibold text-foreground">No story content</p></div>
                )}
              </div>
              {/* Story Modal */}
              {showStoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 overflow-y-auto">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{editingStory ? 'Edit Story' : 'Add Story'}</h3>
                      <button onClick={() => { setShowStoryModal(false); setEditingStory(false); }} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="space-y-4">
                      {/* Image upload */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Image</label>
                        <div
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = () => {
                              if (!input.files || input.files.length === 0) return;
                              const file = input.files[0];
                              const reader = new FileReader();
                              reader.onload = () => {
                                const dataUrl = reader.result as string;
                                setStoryForm((p) => ({ ...p, image_url: dataUrl, image_alt: p.image_alt || 'Story Image' }));
                              };
                              reader.readAsDataURL(file);
                            };
                            input.click();
                          }}
                          className="relative border-2 border-dashed border-[rgba(196,120,90,0.3)] rounded-2xl h-32 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        >
                          {storyForm.image_url ? (
                            <img src={storyForm.image_url} alt={storyForm.image_alt} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Icon name="PhotoIcon" size={20} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Click to upload</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Title</label>
                        <input
                          type="text"
                          className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                          value={storyForm.title}
                          onChange={(e) => setStoryForm((p) => ({ ...p, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Subtitle</label>
                        <input
                          type="text"
                          className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                          value={storyForm.subtitle}
                          onChange={(e) => setStoryForm((p) => ({ ...p, subtitle: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Body</label>
                        <textarea
                          className="w-full px-4 py-2 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-none"
                          rows={4}
                          value={storyForm.body}
                          onChange={(e) => setStoryForm((p) => ({ ...p, body: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Quote</label>
                        <input
                          type="text"
                          className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                          value={storyForm.quote}
                          onChange={(e) => setStoryForm((p) => ({ ...p, quote: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Quote Author</label>
                        <input
                          type="text"
                          className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                          value={storyForm.quote_author}
                          onChange={(e) => setStoryForm((p) => ({ ...p, quote_author: e.target.value }))}
                        />
                      </div>
                    </div>
                    {/* Save */}
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setShowStoryModal(false);
                          setEditingStory(false);
                        }}
                        className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!storyForm.title.trim()) {
                            showToast('Title is required.', 'error');
                            return;
                          }
                          setSavingStory(true);
                          // Save to backend
                          try {
                            const supabase = createClient();
                            if (storyForm.id) {
                              const { error } = await supabase.from('story_content').update({ ...storyForm, section_key: 'craft_story', updated_at: new Date().toISOString() }).eq('id', storyForm.id);
                              if (error) throw new Error(error.message);
                              setStoryContent(storyForm);
                            } else {
                              const { data, error } = await supabase.from('story_content').upsert({ ...storyForm, section_key: 'craft_story', updated_at: new Date().toISOString() }, { onConflict: 'section_key' }).select().single();
                              if (error) throw new Error(error.message);
                              if (data) setStoryContent(data);
                            }
                            showToast('Story saved.', 'success');
                            setShowStoryModal(false);
                            setEditingStory(false);
                          } catch { showToast('Failed to save story.', 'error'); }
                          finally { setSavingStory(false); }
                        }}
                        className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/80 transition"
                        disabled={savingStory}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Google Reviews Tab ── */}
          {activeTab === 'google-reviews' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Google Place ID"
                  className="w-1/2 h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                  value={googlePlaceId}
                  onChange={(e) => setGooglePlaceId(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="API Key"
                  className="w-1/2 h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                />
              </div>
              <button
                onClick={async () => {
                  if (!googlePlaceId || !googleApiKey) {
                    showToast('Enter both Place ID and API key.', 'error');
                    return;
                  }
                  setFetchingReviews(true);
                  try {
                    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=reviews&key=${googleApiKey}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (data.status !== 'OK') {
                      setGooglePlaceData(null);
                      showToast('Error fetching reviews.', 'error');
                    } else {
                      setGooglePlaceData(data.result);
                      setFetchingReviews(false);
                    }
                  } catch { showToast('Failed to fetch reviews.', 'error'); }
                }}
                className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/80 transition"
              >
                {fetchingReviews ? 'Fetching…' : 'Fetch Reviews'}
              </button>
              {/* reviews display below */}
              {fetchingReviews && <p className="mt-4 text-center">Fetching reviews...</p>}
              {googlePlaceData && googlePlaceData.reviews && (
                <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {googlePlaceData.reviews.map((review, i) => (
                    <div key={i} className="p-2 bg-gray-100 rounded-lg shadow-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <img src={review.profile_photo_url} alt={review.author_name} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="text-sm font-semibold">{review.author_name}</p>
                          <div className="flex items-center gap-1 text-yellow-400 text-xs">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm">{review.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Vyaapar Tab ── */}
          {activeTab === 'vyaapar' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={exportOrdersVyaapar}
                  className="px-4 py-2 rounded-full bg-foreground text-[#FAF6F0] font-semibold uppercase tracking-[0.1em] hover:bg-primary transition"
                >
                  {exportingCsv ? 'Exporting…' : 'Export Orders'}
                </button>
                <button
                  onClick={exportInvoicesVyaapar}
                  className="px-4 py-2 rounded-full bg-foreground text-[#FAF6F0] font-semibold uppercase tracking-[0.1em] hover:bg-primary transition"
                >
                  {exportingCsv ? 'Exporting…' : 'Export Invoices'}
                </button>
              </div>
              {/* CSV Import Section */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <h3 className="font-semibold text-foreground mb-2 text-sm">Import Vyaapar Stock CSV</h3>
                <p className="mb-2 text-xs text-muted-foreground">Paste CSV data copied from Vyaapar export, or upload file.</p>
                <textarea
                  className="w-full h-24 px-4 py-2 border border-dashed border-[rgba(196,120,90,0.3)] rounded-xl resize-none mb-2"
                  placeholder="OrderID,OrderDate,Item,SKU,Qty"
                  value={pincodeForm.pincode} // Updated to match the correct value
                  onChange={(e) => {
                    setBulkPincodes(e.target.value);
                  }}
                />
                <button
                  onClick={importBulkPincodes}
                  disabled={importingPincodes || !bulkPincodes.trim()}
                  className="px-4 py-2 rounded-full bg-foreground text-[#FAF6F0] font-semibold uppercase tracking-[0.1em] hover:bg-primary transition"
                >
                  {importingPincodes ? 'Importing…' : 'Import CSV'}
                </button>
              </div>
            </div>
          )}

          {/* ── Pincodes Tab ── */}
          {activeTab === 'pincodes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Delivery Pincodes ({pincodes.length})</h2>
                <button onClick={openAddPincode} className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2">
                  <Icon name="PlusIcon" size={14} />
                  Add Pincode
                </button>
              </div>
              {/* Bulk Import */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <h3 className="font-semibold text-foreground mb-2 text-sm">Bulk Import Pincodes</h3>
                <p className="mb-2 text-xs text-muted-foreground">Paste one 6-digit pincode per line to add multiple at once.</p>
                <textarea
                  className="w-full h-24 px-4 py-2 border border-dashed border-[rgba(196,120,90,0.3)] rounded-xl resize-none mb-2"
                  placeholder={"110001\n400001\n560001"}
                  value={bulkPincodes}
                  onChange={(e) => { setBulkPincodes(e.target.value); }}
                />
                <button
                  onClick={importBulkPincodes}
                  disabled={importingPincodes || !bulkPincodes.trim()}
                  className="px-4 py-2 rounded-full bg-foreground text-[#FAF6F0] font-semibold uppercase tracking-[0.1em] hover:bg-primary transition"
                >
                  {importingPincodes ? 'Importing…' : 'Import Pincodes'}
                </button>
              </div>
              {/* Search + List */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)]">
                  <input
                    type="text"
                    className="w-full h-9 px-4 rounded-full border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                    placeholder="Search pincode or area…"
                    value={pincodeSearch}
                    onChange={(e) => setPincodeSearch(e.target.value)}
                  />
                </div>
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {pincodes.filter((p) => !pincodeSearch || p.pincode.includes(pincodeSearch) || p.area_name.toLowerCase().includes(pincodeSearch.toLowerCase()) || p.city.toLowerCase().includes(pincodeSearch.toLowerCase())).length === 0 ? (
                    <div className="px-6 py-12 text-center"><Icon name="MapPinIcon" size={32} className="text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No pincodes found.</p></div>
                  ) : pincodes.filter((p) => !pincodeSearch || p.pincode.includes(pincodeSearch) || p.area_name.toLowerCase().includes(pincodeSearch.toLowerCase()) || p.city.toLowerCase().includes(pincodeSearch.toLowerCase())).map((pin) => (
                    <div key={pin.id} className="flex items-center gap-4 px-6 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground font-mono">{pin.pincode}</p>
                        <p className="text-xs text-muted-foreground">{[pin.area_name, pin.city, pin.state].filter(Boolean).join(', ') || 'No area details'}</p>
                        <p className="text-xs text-muted-foreground">{pin.delivery_days} day{pin.delivery_days !== 1 ? 's' : ''} delivery{pin.extra_charge > 0 ? ` · +₹${pin.extra_charge}` : ''}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pin.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{pin.is_active ? 'Active' : 'Off'}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => togglePincodeActive(pin)} className="h-7 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">{pin.is_active ? 'Disable' : 'Enable'}</button>
                        <button onClick={() => openEditPincode(pin)} className="w-7 h-7 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"><Icon name="PencilIcon" size={11} /></button>
                        <button onClick={() => deletePincode(pin.id)} disabled={deletingPincode === pin.id} className="w-7 h-7 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Inventory Tab ── */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Inventory ({products.length})</h2>
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-4">
                <input
                  type="text"
                  className="w-full h-10 px-4 rounded-full border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary mb-4"
                  placeholder="Search products…"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {inventoryProducts.length === 0 ? (
                    <div className="py-12 text-center">
                      <Icon name="ClipboardDocumentListIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No products found.</p>
                    </div>
                  ) : inventoryProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.categories?.name || 'Uncategorized'}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.in_stock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {product.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const newQty = Math.max(0, (product.stock_quantity ?? 0) - 1);
                              setUpdatingStock(product.id);
                              try {
                                const supabase = createClient();
                                await supabase.from('products').update({ stock_quantity: newQty, in_stock: newQty > 0 }).eq('id', product.id);
                                setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock_quantity: newQty, in_stock: newQty > 0 } : p));
                              } catch { showToast('Failed to update stock.', 'error'); }
                              finally { setUpdatingStock(null); }
                            }}
                            disabled={updatingStock === product.id}
                            className="w-7 h-7 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm font-bold"
                          >−</button>
                          <span className="w-10 text-center text-sm font-bold text-foreground">{product.stock_quantity ?? 0}</span>
                          <button
                            onClick={async () => {
                              const newQty = (product.stock_quantity ?? 0) + 1;
                              setUpdatingStock(product.id);
                              try {
                                const supabase = createClient();
                                await supabase.from('products').update({ stock_quantity: newQty, in_stock: true }).eq('id', product.id);
                                setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock_quantity: newQty, in_stock: true } : p));
                              } catch { showToast('Failed to update stock.', 'error'); }
                              finally { setUpdatingStock(null); }
                            }}
                            disabled={updatingStock === product.id}
                            className="w-7 h-7 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm font-bold"
                          >+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Coupons Tab ── */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Coupons ({coupons.length})</h2>
                <button
                  onClick={() => { setEditingCoupon(null); setCouponForm(EMPTY_COUPON); setShowCouponModal(true); }}
                  className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2"
                >
                  <Icon name="PlusIcon" size={14} />
                  Add Coupon
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {coupons.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Icon name="TicketIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">No coupons yet</p>
                    </div>
                  ) : coupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground font-mono">{coupon.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                          {coupon.min_order_amount ? ` · Min ₹${coupon.min_order_amount / 100}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {coupon.expires_at ? `Expires: ${new Date(coupon.expires_at).toLocaleDateString('en-IN')}` : 'No expiry'}
                          {coupon.max_uses ? ` · Max uses: ${coupon.max_uses}` : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${coupon.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            try {
                              const supabase = createClient();
                              await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
                              setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
                              showToast(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}.`, 'success');
                            } catch { showToast('Failed to update coupon.', 'error'); }
                          }}
                          className="h-8 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          {coupon.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => { setEditingCoupon(coupon); setCouponForm({ code: coupon.code, discount_type: coupon.discount_type, discount_value: coupon.discount_value, min_order_amount: coupon.min_order_amount, max_uses: coupon.max_uses, expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : null, is_active: coupon.is_active, description: coupon.description || '' }); setShowCouponModal(true); }}
                          className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Icon name="PencilIcon" size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            setDeletingCoupon(coupon.id);
                            try {
                              const supabase = createClient();
                              await supabase.from('coupons').delete().eq('id', coupon.id);
                              setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
                              showToast('Coupon deleted.', 'success');
                            } catch { showToast('Failed to delete coupon.', 'error'); }
                            finally { setDeletingCoupon(null); }
                          }}
                          disabled={deletingCoupon === coupon.id}
                          className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"
                        >
                          <Icon name="TrashIcon" size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Coupon Modal */}
              {showCouponModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</h3>
                      <button onClick={() => setShowCouponModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Coupon Code *</label>
                        <input type="text" value={couponForm.code} onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm font-mono focus:outline-none focus:border-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Discount Type</label>
                          <select value={couponForm.discount_type} onChange={(e) => setCouponForm((p) => ({ ...p, discount_type: e.target.value as 'percentage' | 'fixed' }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary">
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Discount Value *</label>
                          <input type="number" min="0" value={couponForm.discount_value} onChange={(e) => setCouponForm((p) => ({ ...p, discount_value: Number(e.target.value) }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Min Order Amount (₹)</label>
                          <input type="number" min="0" value={couponForm.min_order_amount ?? ''} onChange={(e) => setCouponForm((p) => ({ ...p, min_order_amount: e.target.value ? Number(e.target.value) : null }))} placeholder="Leave blank for no minimum" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Max Uses</label>
                          <input type="number" min="0" value={couponForm.max_uses ?? ''} onChange={(e) => setCouponForm((p) => ({ ...p, max_uses: e.target.value ? Number(e.target.value) : null }))} placeholder="Leave blank for unlimited" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Expires At</label>
                        <input type="date" value={couponForm.expires_at || ''} onChange={(e) => setCouponForm((p) => ({ ...p, expires_at: e.target.value || null }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={couponForm.is_active} onChange={(e) => setCouponForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-semibold text-foreground">Active</span>
                      </label>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowCouponModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button
                        disabled={savingCoupon || !couponForm.code?.trim()}
                        onClick={async () => {
                          if (!couponForm.code?.trim()) { showToast('Coupon code is required.', 'error'); return; }
                          setSavingCoupon(true);
                          try {
                            const supabase = createClient();
                            const payload = {
                              code: couponForm.code,
                              discount_type: couponForm.discount_type,
                              discount_value: couponForm.discount_value,
                              min_order_amount: couponForm.min_order_amount,
                              max_uses: couponForm.max_uses,
                              expires_at: couponForm.expires_at || null,
                              is_active: couponForm.is_active,
                              description: couponForm.description || '',
                              updated_at: new Date().toISOString(),
                            };
                            if (editingCoupon) {
                              const { error } = await supabase.from('coupons').update(payload).eq('id', editingCoupon.id);
                              if (error) throw new Error(error.message);
                              showToast('Coupon updated.', 'success');
                            } else {
                              const { error } = await supabase.from('coupons').insert(payload);
                              if (error) throw new Error(error.message);
                              showToast('Coupon added.', 'success');
                            }
                            setShowCouponModal(false);
                            fetchData();
                          } catch (err: any) { showToast(err?.message || 'Failed to save coupon.', 'error'); }
                          finally { setSavingCoupon(false); }
                        }}
                        className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {savingCoupon ? 'Saving…' : editingCoupon ? 'Update' : 'Add Coupon'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Categories Tab ── */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Categories ({categories.length})</h2>
                <button
                  onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', slug: '', description: '', display_order: 0, is_active: true }); setShowCategoryModal(true); }}
                  className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2"
                >
                  <Icon name="PlusIcon" size={14} />
                  Add Category
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {categories.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Icon name="TagIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">No categories yet</p>
                    </div>
                  ) : categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{cat.slug}</p>
                        {cat.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cat.is_active ? 'Active' : 'Hidden'}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            try {
                              const supabase = createClient();
                              await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
                              setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
                              showToast(`Category ${!cat.is_active ? 'activated' : 'hidden'}.`, 'success');
                            } catch { showToast('Failed to update category.', 'error'); }
                          }}
                          className="h-8 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          {cat.is_active ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, slug: cat.slug, description: cat.description, display_order: cat.display_order, is_active: cat.is_active }); setShowCategoryModal(true); }}
                          className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Icon name="PencilIcon" size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const supabase = createClient();
                              await supabase.from('categories').delete().eq('id', cat.id);
                              setCategories((prev) => prev.filter((c) => c.id !== cat.id));
                              showToast('Category deleted.', 'success');
                            } catch { showToast('Failed to delete category.', 'error'); }
                          }}
                          className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"
                        >
                          <Icon name="TrashIcon" size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Category Modal */}
              {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                      <button onClick={() => setShowCategoryModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      {[
                        { label: 'Name *', key: 'name', placeholder: 'e.g. Preserved Florals' },
                        { label: 'Slug *', key: 'slug', placeholder: 'e.g. preserved-florals' },
                        { label: 'Description', key: 'description', placeholder: 'Short description' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</label>
                          <input type="text" value={(categoryForm as any)[key] || ''} onChange={(e) => setCategoryForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Display Order</label>
                        <input type="number" min="0" value={categoryForm.display_order} onChange={(e) => setCategoryForm((p) => ({ ...p, display_order: Number(e.target.value) }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-semibold text-foreground">Active</span>
                      </label>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowCategoryModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button
                        disabled={savingCategory || !categoryForm.name?.trim()}
                        onClick={async () => {
                          if (!categoryForm.name?.trim()) { showToast('Category name is required.', 'error'); return; }
                          setSavingCategory(true);
                          try {
                            const supabase = createClient();
                            const slug = categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                            const payload = { ...categoryForm, slug };
                            if (editingCategory) {
                              await supabase.from('categories').update(payload).eq('id', editingCategory.id);
                              showToast('Category updated.', 'success');
                            } else {
                              await supabase.from('categories').insert(payload);
                              showToast('Category added.', 'success');
                            }
                            setShowCategoryModal(false);
                            fetchData();
                          } catch (err: any) { showToast(err?.message || 'Failed to save category.', 'error'); }
                          finally { setSavingCategory(false); }
                        }}
                        className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {savingCategory ? 'Saving…' : editingCategory ? 'Update' : 'Add Category'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Themes Tab ── */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <h2 className="font-display italic text-2xl font-semibold text-foreground">Store Themes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.length === 0 ? (
                  <div className="col-span-full bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] px-6 py-12 text-center">
                    <Icon name="SwatchIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No themes available</p>
                  </div>
                ) : themes.map((theme) => (
                  <div key={theme.id} className={`bg-white rounded-2xl border-2 p-5 transition-all ${theme.is_active ? 'border-primary shadow-card' : 'border-[rgba(196,120,90,0.2)]'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-foreground">{theme.name}</p>
                      {theme.is_active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Active</span>}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      {[theme.primary_color, theme.secondary_color, theme.background_color, theme.accent_color].map((color, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} title={color} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{theme.description}</p>
                    {!theme.is_active && (
                      <button
                        onClick={async () => {
                          setActivatingTheme(theme.id);
                          try {
                            const supabase = createClient();
                            await supabase.from('store_themes').update({ is_active: false }).neq('id', theme.id);
                            await supabase.from('store_themes').update({ is_active: true }).eq('id', theme.id);
                            setThemes((prev) => prev.map((t) => ({ ...t, is_active: t.id === theme.id })));
                            showToast(`Theme "${theme.name}" activated!`, 'success');
                          } catch { showToast('Failed to activate theme.', 'error'); }
                          finally { setActivatingTheme(null); }
                        }}
                        disabled={activatingTheme === theme.id}
                        className="w-full h-9 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {activatingTheme === theme.id ? 'Activating…' : 'Activate'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Couriers Tab ── */}
          {activeTab === 'couriers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Courier Partners ({couriers.length})</h2>
                <button
                  onClick={() => { setEditingCourier(null); setCourierForm(EMPTY_COURIER); setShowCourierModal(true); }}
                  className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2"
                >
                  <Icon name="PlusIcon" size={14} />
                  Add Courier
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {couriers.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Icon name="TruckIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">No courier partners yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add courier partners to enable shipment tracking.</p>
                    </div>
                  ) : couriers.map((courier) => (
                    <div key={courier.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{courier.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{courier.base_url || 'No base URL'}</p>
                        {courier.tracking_url && <p className="text-xs text-muted-foreground truncate">{courier.tracking_url}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${courier.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {courier.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => { setEditingCourier(courier); setCourierForm({ name: courier.name, api_key: courier.api_key, base_url: courier.base_url, tracking_url: courier.tracking_url, is_active: courier.is_active }); setShowCourierModal(true); }}
                          className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Icon name="PencilIcon" size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            setDeletingCourier(courier.id);
                            try {
                              const supabase = createClient();
                              await supabase.from('courier_partners').delete().eq('id', courier.id);
                              setCouriers((prev) => prev.filter((c) => c.id !== courier.id));
                              showToast('Courier deleted.', 'success');
                            } catch { showToast('Failed to delete courier.', 'error'); }
                            finally { setDeletingCourier(null); }
                          }}
                          disabled={deletingCourier === courier.id}
                          className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"
                        >
                          <Icon name="TrashIcon" size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Courier Modal */}
              {showCourierModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingCourier ? 'Edit Courier' : 'Add Courier'}</h3>
                      <button onClick={() => setShowCourierModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      {[
                        { label: 'Name *', key: 'name', placeholder: 'e.g. Delhivery' },
                        { label: 'API Key', key: 'api_key', placeholder: 'API key' },
                        { label: 'Base URL', key: 'base_url', placeholder: 'https://api.courier.com' },
                        { label: 'Tracking URL', key: 'tracking_url', placeholder: 'https://track.courier.com/{tracking_id}' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</label>
                          <input type="text" value={(courierForm as any)[key] || ''} onChange={(e) => setCourierForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={courierForm.is_active} onChange={(e) => setCourierForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-semibold text-foreground">Active</span>
                      </label>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowCourierModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button
                        disabled={savingCourier || !courierForm.name?.trim()}
                        onClick={async () => {
                          if (!courierForm.name?.trim()) { showToast('Courier name is required.', 'error'); return; }
                          setSavingCourier(true);
                          try {
                            const supabase = createClient();
                            if (editingCourier) {
                              const { error } = await supabase.from('courier_partners').update({ ...courierForm, updated_at: new Date().toISOString() }).eq('id', editingCourier.id);
                              if (error) throw error;
                              showToast('Courier updated.', 'success');
                            } else {
                              const { error } = await supabase.from('courier_partners').insert(courierForm);
                              if (error) throw error;
                              showToast('Courier added.', 'success');
                            }
                            setShowCourierModal(false);
                            fetchData();
                          } catch (err: any) {
                            showToast(err?.message || 'Failed to save courier.', 'error');
                          } finally {
                            setSavingCourier(false);
                          }
                        }}
                        className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {savingCourier ? 'Saving…' : editingCourier ? 'Update' : 'Add Courier'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Invoices Tab ── */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <h2 className="font-display italic text-2xl font-semibold text-foreground">Invoices & GST</h2>
              {/* GST Settings */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <h3 className="font-semibold text-foreground mb-4 text-sm">GST Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'GSTIN', key: 'gstin', placeholder: '29ABCDE1234F1Z5' },
                    { label: 'Business Name', key: 'business_name', placeholder: 'PurelyJid' },
                    { label: 'Business Address', key: 'business_address', placeholder: 'Full address' },
                    { label: 'State Code', key: 'state_code', placeholder: '29' },
                    { label: 'HSN Code', key: 'hsn_code', placeholder: '3926' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</label>
                      <input type="text" value={(gstSettings as any)[key] || ''} onChange={(e) => setGstSettings((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">GST Rate (%)</label>
                    <input type="number" min="0" max="28" value={gstSettings.gst_rate} onChange={(e) => setGstSettings((p) => ({ ...p, gst_rate: Number(e.target.value) }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                  </div>
                </div>
              </div>
              {/* Generate Invoice */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <h3 className="font-semibold text-foreground mb-4 text-sm">Generate GST Invoice</h3>
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders available to generate invoices.</p>
                ) : (
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedInvoiceOrder}
                      onChange={(e) => setSelectedInvoiceOrder(e.target.value)}
                      className="flex-1 h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Select an order…</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>#{o.order_number} — ₹{(o.total / 100).toLocaleString('en-IN')} ({o.status})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => selectedInvoiceOrder && generateGSTInvoice(selectedInvoiceOrder)}
                      disabled={!selectedInvoiceOrder || generatingInvoice}
                      className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Icon name="DocumentTextIcon" size={14} />
                      {generatingInvoice ? 'Generating…' : 'Generate PDF'}
                    </button>
                  </div>
                )}
              </div>
              {/* Recent Orders for Invoicing */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)]">
                  <h3 className="font-semibold text-foreground text-sm">All Orders</h3>
                </div>
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {orders.length === 0 ? (
                    <div className="px-6 py-12 text-center"><p className="text-sm text-muted-foreground">No orders yet.</p></div>
                  ) : orders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4 px-6 py-3 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">#{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order?.user_profiles?.full_name || '—'} · {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <p className="text-sm font-bold text-foreground shrink-0">₹{(order.total / 100).toLocaleString('en-IN')}</p>
                      <button
                        onClick={() => generateGSTInvoice(order.id)}
                        disabled={generatingInvoice}
                        className="h-8 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
                      >
                        Invoice
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Shop Tab ── */}
          {activeTab === 'shop' && (
            <div className="space-y-6">
              <h2 className="font-display italic text-2xl font-semibold text-foreground">Shop Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                  <h3 className="font-semibold text-foreground mb-2 text-sm">Products</h3>
                  <p className="text-3xl font-bold text-foreground mb-1">{products.length}</p>
                  <p className="text-xs text-muted-foreground">{products.filter(p => p.is_active).length} active · {products.filter(p => !p.in_stock).length} out of stock</p>
                  <button onClick={() => setActiveTab('products')} className="mt-4 h-9 px-4 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Manage Products →</button>
                </div>
                <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                  <h3 className="font-semibold text-foreground mb-2 text-sm">Categories</h3>
                  <p className="text-3xl font-bold text-foreground mb-1">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">{categories.filter(c => c.is_active).length} active</p>
                  <button onClick={() => setActiveTab('categories')} className="mt-4 h-9 px-4 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Manage Categories →</button>
                </div>
                <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                  <h3 className="font-semibold text-foreground mb-2 text-sm">Coupons</h3>
                  <p className="text-3xl font-bold text-foreground mb-1">{coupons.length}</p>
                  <p className="text-xs text-muted-foreground">{coupons.filter(c => c.is_active).length} active</p>
                  <button onClick={() => setActiveTab('coupons')} className="mt-4 h-9 px-4 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Manage Coupons →</button>
                </div>
                <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                  <h3 className="font-semibold text-foreground mb-2 text-sm">Active Theme</h3>
                  {themes.find(t => t.is_active) ? (
                    <>
                      <p className="text-lg font-bold text-foreground mb-1">{themes.find(t => t.is_active)?.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {[themes.find(t => t.is_active)?.primary_color, themes.find(t => t.is_active)?.secondary_color, themes.find(t => t.is_active)?.background_color].map((color, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </>
                  ) : <p className="text-sm text-muted-foreground">No active theme</p>}
                  <button onClick={() => setActiveTab('themes')} className="mt-4 h-9 px-4 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Manage Themes →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Collections Tab ── */}
          {activeTab === 'collections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Collections ({categories.filter(c => c.is_active).length} active)</h2>
                <button
                  onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', slug: '', description: '', display_order: 0, is_active: true }); setShowCategoryModal(true); setActiveTab('categories'); }}
                  className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2"
                >
                  <Icon name="PlusIcon" size={14} />
                  Add Collection
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.length === 0 ? (
                  <div className="col-span-full bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] px-6 py-12 text-center">
                    <Icon name="RectangleGroupIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold text-foreground">No collections yet</p>
                  </div>
                ) : categories.map((cat) => {
                  const catProducts = products.filter(p => p.category_id === cat.id);
                  return (
                    <div key={cat.id} className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-5 hover:shadow-card transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{cat.slug}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      {cat.description && <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>}
                      <p className="text-xs font-semibold text-foreground">{catProducts.length} product{catProducts.length !== 1 ? 's' : ''}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, slug: cat.slug, description: cat.description, display_order: cat.display_order, is_active: cat.is_active }); setShowCategoryModal(true); }}
                          className="h-8 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const supabase = createClient();
                              await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
                              setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
                              showToast(`Collection ${!cat.is_active ? 'shown' : 'hidden'}.`, 'success');
                            } catch { showToast('Failed to update collection.', 'error'); }
                          }}
                          className="h-8 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          {cat.is_active ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Reuse category modal */}
              {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingCategory ? 'Edit Collection' : 'Add Collection'}</h3>
                      <button onClick={() => setShowCategoryModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      {[
                        { label: 'Name *', key: 'name', placeholder: 'e.g. Preserved Florals' },
                        { label: 'Slug *', key: 'slug', placeholder: 'e.g. preserved-florals' },
                        { label: 'Description', key: 'description', placeholder: 'Short description' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</label>
                          <input type="text" value={(categoryForm as any)[key] || ''} onChange={(e) => setCategoryForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-semibold text-foreground">Active</span>
                      </label>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowCategoryModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button
                        disabled={savingCategory || !categoryForm.name?.trim()}
                        onClick={async () => {
                          if (!categoryForm.name?.trim()) { showToast('Name is required.', 'error'); return; }
                          setSavingCategory(true);
                          try {
                            const supabase = createClient();
                            const slug = categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                            const payload = { ...categoryForm, slug };
                            if (editingCategory) {
                              await supabase.from('categories').update(payload).eq('id', editingCategory.id);
                              showToast('Collection updated.', 'success');
                            } else {
                              await supabase.from('categories').insert(payload);
                              showToast('Collection added.', 'success');
                            }
                            setShowCategoryModal(false);
                            fetchData();
                          } catch (err: any) { showToast(err?.message || 'Failed to save.', 'error'); }
                          finally { setSavingCategory(false); }
                        }}
                        className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {savingCategory ? 'Saving…' : editingCategory ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Workshops Admin Tab ── */}
          {activeTab === 'workshops-admin' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Workshops ({workshops.length})</h2>
                <button onClick={openAddWorkshop} className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2">
                  <Icon name="PlusIcon" size={14} />
                  Add Workshop
                </button>
              </div>
              {/* Workshop Catalogues */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">Workshop Catalogues ({workshopCatalogues.length})</h3>
                  <button onClick={openAddCatalogue} className="h-8 px-4 rounded-full bg-foreground text-[#FAF6F0] text-[10px] font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-1.5">
                    <Icon name="PlusIcon" size={12} />
                    Add Catalogue
                  </button>
                </div>
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {workshopCatalogues.length === 0 ? (
                    <div className="px-6 py-8 text-center"><p className="text-sm text-muted-foreground">No catalogues yet.</p></div>
                  ) : workshopCatalogues.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-4 px-6 py-3 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{cat.title}</p>
                        <p className="text-xs text-muted-foreground">{cat.file_name} · {cat.download_count} downloads</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{cat.is_active ? 'Published' : 'Draft'}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleCatalogueActive(cat)} className="h-7 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">{cat.is_active ? 'Unpublish' : 'Publish'}</button>
                        <button onClick={() => openEditCatalogue(cat)} className="w-7 h-7 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"><Icon name="PencilIcon" size={11} /></button>
                        <button onClick={() => deleteCatalogue(cat.id)} disabled={deletingCatalogue === cat.id} className="w-7 h-7 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Workshops List */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)]">
                  <h3 className="font-semibold text-foreground text-sm">All Workshops</h3>
                </div>
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {workshops.length === 0 ? (
                    <div className="px-6 py-8 text-center"><p className="text-sm text-muted-foreground">No workshops yet.</p></div>
                  ) : workshops.map((w) => (
                    <div key={w.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{w.title}</p>
                        <p className="text-xs text-muted-foreground">{w.instructor ? `By ${w.instructor}` : ''}{w.location ? ` · ${w.location}` : ''}</p>
                        <p className="text-xs text-muted-foreground">{w.workshop_date ? new Date(w.workshop_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'} · ₹{(w.price / 100).toLocaleString('en-IN')}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${w.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{w.is_active ? 'Active' : 'Draft'}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleWorkshopActive(w)} className="h-7 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">{w.is_active ? 'Unpublish' : 'Publish'}</button>
                        <button onClick={() => openEditWorkshop(w)} className="w-7 h-7 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"><Icon name="PencilIcon" size={11} /></button>
                        <button onClick={() => deleteWorkshop(w.id)} disabled={deletingWorkshop === w.id} className="w-7 h-7 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Workshop Modal */}
              {showWorkshopModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingWorkshop ? 'Edit Workshop' : 'Add Workshop'}</h3>
                      <button onClick={() => setShowWorkshopModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      {[
                        { label: 'Title *', key: 'title', placeholder: 'Workshop title' },
                        { label: 'Instructor', key: 'instructor', placeholder: 'Instructor name' },
                        { label: 'Location', key: 'location', placeholder: 'Venue or Online' },
                        { label: 'Duration', key: 'duration', placeholder: 'e.g. 3 hours' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</label>
                          <input type="text" value={(workshopForm as any)[key] || ''} onChange={(e) => setWorkshopForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Date & Time</label>
                          <input type="datetime-local" value={workshopForm.workshop_date} onChange={(e) => setWorkshopForm((p) => ({ ...p, workshop_date: e.target.value }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Price (paise)</label>
                          <input type="text" inputMode="numeric" value={workshopForm.price} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setWorkshopForm((p) => ({ ...p, price: val === '' ? 0 : Number(val) })); }} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Description</label>
                        <textarea value={workshopForm.description} onChange={(e) => setWorkshopForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-none" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={workshopForm.is_active} onChange={(e) => setWorkshopForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-semibold text-foreground">Active / Published</span>
                      </label>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowWorkshopModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button disabled={savingWorkshop} onClick={saveWorkshop} className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50">
                        {savingWorkshop ? 'Saving…' : editingWorkshop ? 'Update' : 'Add Workshop'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Catalogue Modal */}
              {showCatalogueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingCatalogue ? 'Edit Catalogue' : 'Add Catalogue'}</h3>
                      <button onClick={() => setShowCatalogueModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      {[
                        { label: 'Title *', key: 'title', placeholder: 'Catalogue title' },
                        { label: 'File URL *', key: 'file_url', placeholder: 'https://...' },
                        { label: 'File Name', key: 'file_name', placeholder: 'catalogue.pdf' },
                        { label: 'Description', key: 'description', placeholder: 'Short description' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</label>
                          <input type="text" value={(catalogueForm as any)[key] || ''} onChange={(e) => setCatalogueForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={catalogueForm.is_active} onChange={(e) => setCatalogueForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-semibold text-foreground">Published</span>
                      </label>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowCatalogueModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button disabled={savingCatalogue} onClick={saveCatalogue} className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50">
                        {savingCatalogue ? 'Saving…' : editingCatalogue ? 'Update' : 'Add Catalogue'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Custom Products Admin Tab ── */}
          {activeTab === 'custom-products-admin' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Custom Products ({customProducts.length})</h2>
                <button onClick={openAddCustomProduct} className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2">
                  <Icon name="PlusIcon" size={14} />
                  Add Custom Product
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {customProducts.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Icon name="SparklesIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">No custom products yet</p>
                    </div>
                  ) : customProducts.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-[#EDE8E0] overflow-hidden shrink-0">
                        {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.images[0].alt} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="PhotoIcon" size={20} className="text-muted-foreground" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category} · {p.price_range}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.is_active ? 'Active' : 'Hidden'}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openEditCustomProduct(p)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"><Icon name="PencilIcon" size={12} /></button>
                        <button onClick={() => deleteCustomProduct(p.id)} disabled={deletingCustomProduct === p.id} className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Custom Enquiries */}
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)]">
                  <h3 className="font-semibold text-foreground text-sm">Custom Enquiries ({customEnquiries.length})</h3>
                </div>
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {customEnquiries.length === 0 ? (
                    <div className="px-6 py-8 text-center"><p className="text-sm text-muted-foreground">No enquiries yet.</p></div>
                  ) : customEnquiries.map((enq) => (
                    <div key={enq.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{enq.name}</p>
                        <p className="text-xs text-muted-foreground">{enq.email} · {enq.phone}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{enq.message}</p>
                        {enq.budget && <p className="text-xs text-muted-foreground">Budget: {enq.budget}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(enq.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <select
                        value={enq.status}
                        onChange={(e) => updateEnquiryStatus(enq.id, e.target.value)}
                        className="h-8 px-2 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] focus:outline-none focus:border-primary cursor-pointer"
                      >
                        {['new', 'contacted', 'in_progress', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              {/* Custom Product Modal */}
              {showCustomProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingCustomProduct ? 'Edit Custom Product' : 'Add Custom Product'}</h3>
                      <button onClick={() => setShowCustomProductModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      {[
                        { label: 'Name *', key: 'name', placeholder: 'Product name' },
                        { label: 'Price Range', key: 'price_range', placeholder: 'e.g. ₹500 – ₹2000' },
                        { label: 'Catalogue URL', key: 'catalogue_url', placeholder: 'https://...' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</label>
                          <input type="text" value={(customProductForm as any)[key] || ''} onChange={(e) => setCustomProductForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Category</label>
                        <select value={customProductForm.category} onChange={(e) => setCustomProductForm((p) => ({ ...p, category: e.target.value }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary">
                          {['Preserved Florals', 'Resin Art', 'Custom Jewellery', 'Home Decor', 'Gifts', 'Other'].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Description</label>
                        <textarea value={customProductForm.description} onChange={(e) => setCustomProductForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-none" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={customProductForm.is_active} onChange={(e) => setCustomProductForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-semibold text-foreground">Active</span>
                      </label>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowCustomProductModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button disabled={savingCustomProduct} onClick={saveCustomProduct} className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50">
                        {savingCustomProduct ? 'Saving…' : editingCustomProduct ? 'Update' : 'Add Product'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Brand Templates Tab ── */}
          {activeTab === 'brand-templates' && (
            <div className="space-y-6">
              <h2 className="font-display italic text-2xl font-semibold text-foreground">Brand Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { type: 'invoice', label: 'Invoice Template', icon: 'DocumentTextIcon', desc: 'Download a customizable GST invoice HTML template for PurelyJid.' },
                  { type: 'brand', label: 'Brand Template', icon: 'SwatchIcon', desc: 'Download a brand identity HTML template with colors, fonts, and logo guidelines.' },
                  { type: 'presentation', label: 'Brand Presentation', icon: 'PresentationChartLineIcon', desc: 'Download a brand presentation template for pitches and collaborations.' },
                ].map((item) => (
                  <div key={item.type} className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6 flex flex-col gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon name={item.icon} size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => downloadBrandTemplate(item.type)}
                      className="mt-auto h-9 px-4 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2"
                    >
                      <Icon name="ArrowDownTrayIcon" size={13} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="font-display italic text-2xl font-semibold text-foreground">Users ({users.length})</h2>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {users.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Icon name="UsersIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">No users yet</p>
                    </div>
                  ) : users.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAF6F0]/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{(user.full_name || user.email || '?')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        {user.role || 'customer'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Shipping Policy Tab ── */}
          {activeTab === 'shipping-policy' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Shipping Policy</h2>
                <a href="/shipping" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  <Icon name="ArrowTopRightOnSquareIcon" size={13} />
                  View Live Page
                </a>
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <p className="text-xs text-muted-foreground mb-4">Edit the content of your Shipping Policy page. Use plain text or basic HTML.</p>
                <textarea
                  value={shippingContent}
                  onChange={(e) => setShippingContent(e.target.value)}
                  rows={20}
                  placeholder="Enter your shipping policy content here..."
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-y font-mono"
                />
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Changes are saved to the database and reflected live on the Shipping Policy page.</p>
                  <button
                    onClick={async () => {
                      setSavingShipping(true);
                      try {
                        const supabase = createClient();
                        await supabase.from('story_content').upsert({ section_key: 'shipping_policy', title: 'Shipping Policy', body: shippingContent, subtitle: '', image_url: '', image_alt: '', quote: '', quote_author: '', extra_data: {} }, { onConflict: 'section_key' });
                        showToast('Shipping policy saved!', 'success');
                      } catch (err: any) {
                        showToast(err?.message || 'Failed to save.', 'error');
                      } finally { setSavingShipping(false); }
                    }}
                    disabled={savingShipping}
                    className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                  >
                    {savingShipping ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Privacy Policy Tab ── */}
          {activeTab === 'privacy-policy' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Privacy Policy</h2>
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  <Icon name="ArrowTopRightOnSquareIcon" size={13} />
                  View Live Page
                </a>
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <p className="text-xs text-muted-foreground mb-4">Edit the content of your Privacy Policy page. Use plain text or basic HTML.</p>
                <textarea
                  value={privacyContent}
                  onChange={(e) => setPrivacyContent(e.target.value)}
                  rows={20}
                  placeholder="Enter your privacy policy content here..."
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-y font-mono"
                />
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Changes are saved to the database and reflected live on the Privacy Policy page.</p>
                  <button
                    onClick={async () => {
                      setSavingPrivacy(true);
                      try {
                        const supabase = createClient();
                        await supabase.from('story_content').upsert({ section_key: 'privacy_policy', title: 'Privacy Policy', body: privacyContent, subtitle: '', image_url: '', image_alt: '', quote: '', quote_author: '', extra_data: {} }, { onConflict: 'section_key' });
                        showToast('Privacy policy saved!', 'success');
                      } catch (err: any) {
                        showToast(err?.message || 'Failed to save.', 'error');
                      } finally { setSavingPrivacy(false); }
                    }}
                    disabled={savingPrivacy}
                    className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                  >
                    {savingPrivacy ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Terms & Conditions Tab ── */}
          {activeTab === 'terms-conditions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Terms &amp; Conditions</h2>
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  <Icon name="ArrowTopRightOnSquareIcon" size={13} />
                  View Live Page
                </a>
              </div>
              <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                <p className="text-xs text-muted-foreground mb-4">Edit the content of your Terms &amp; Conditions page. Use plain text or basic HTML.</p>
                <textarea
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  rows={20}
                  placeholder="Enter your terms and conditions content here..."
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-y font-mono"
                />
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Changes are saved to the database and reflected live on the Terms &amp; Conditions page.</p>
                  <button
                    onClick={async () => {
                      setSavingTerms(true);
                      try {
                        const supabase = createClient();
                        await supabase.from('story_content').upsert({ section_key: 'terms_conditions', title: 'Terms & Conditions', body: termsContent, subtitle: '', image_url: '', image_alt: '', quote: '', quote_author: '', extra_data: {} }, { onConflict: 'section_key' });
                        showToast('Terms & Conditions saved!', 'success');
                      } catch (err: any) {
                        showToast(err?.message || 'Failed to save.', 'error');
                      } finally { setSavingTerms(false); }
                    }}
                    disabled={savingTerms}
                    className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                  >
                    {savingTerms ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Shipping Charges Tab ── */}
          {activeTab === 'shipping-charges' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display italic text-2xl font-semibold text-foreground">Shipping Charges</h2>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShippingTab('pincodes')}
                  className={`h-9 px-5 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${shippingTab === 'pincodes' ? 'bg-foreground text-[#FAF6F0]' : 'border border-[rgba(196,120,90,0.2)] text-muted-foreground hover:border-primary hover:text-primary'}`}
                >
                  By Pincode ({pincodes.length})
                </button>
                <button
                  onClick={() => setShippingTab('zones')}
                  className={`h-9 px-5 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${shippingTab === 'zones' ? 'bg-foreground text-[#FAF6F0]' : 'border border-[rgba(196,120,90,0.2)] text-muted-foreground hover:border-primary hover:text-primary'}`}
                >
                  By Zone / Area / City ({shippingZones.length})
                </button>
              </div>

              {/* How it works info */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700">
                <p className="font-semibold mb-1">How shipping charge lookup works at checkout:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>First checks <strong>Pincode-specific</strong> rules (exact match)</li>
                  <li>Then checks <strong>Zone rules</strong> (by city/area/state) in priority order</li>
                  <li>Falls back to <strong>default</strong>: free above ₹1,250, else ₹9.99</li>
                </ol>
              </div>

              {/* ── Pincode Sub-tab ── */}
              {shippingTab === 'pincodes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Set specific shipping charges for individual pincodes.</p>
                    <button onClick={openAddPincode} className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2 text-xs">
                      <Icon name="PlusIcon" size={14} />
                      Add Pincode
                    </button>
                  </div>

                  {/* Bulk Import */}
                  <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] p-6">
                    <h3 className="font-semibold text-foreground mb-2 text-sm">Bulk Import Pincodes</h3>
                    <p className="mb-2 text-xs text-muted-foreground">Paste one 6-digit pincode per line to add multiple at once (with default settings).</p>
                    <textarea
                      className="w-full h-24 px-4 py-2 border border-dashed border-[rgba(196,120,90,0.3)] rounded-xl resize-none mb-2 text-sm"
                      placeholder={"110001\n400001\n560001"}
                      value={bulkPincodes}
                      onChange={(e) => setBulkPincodes(e.target.value)}
                    />
                    <button
                      onClick={importBulkPincodes}
                      disabled={importingPincodes || !bulkPincodes.trim()}
                      className="px-4 py-2 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.1em] hover:bg-primary transition disabled:opacity-50"
                    >
                      {importingPincodes ? 'Importing…' : 'Import Pincodes'}
                    </button>
                  </div>

                  {/* Search + List */}
                  <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)]">
                      <input
                        type="text"
                        className="w-full h-9 px-4 rounded-full border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                        placeholder="Search pincode or area…"
                        value={pincodeSearch}
                        onChange={(e) => setPincodeSearch(e.target.value)}
                      />
                    </div>
                    <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                      {pincodes.filter((p) => !pincodeSearch || p.pincode.includes(pincodeSearch) || p.area_name.toLowerCase().includes(pincodeSearch.toLowerCase()) || p.city.toLowerCase().includes(pincodeSearch.toLowerCase())).length === 0 ? (
                        <div className="px-6 py-12 text-center"><Icon name="MapPinIcon" size={32} className="text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No pincodes found.</p></div>
                      ) : pincodes.filter((p) => !pincodeSearch || p.pincode.includes(pincodeSearch) || p.area_name.toLowerCase().includes(pincodeSearch.toLowerCase()) || p.city.toLowerCase().includes(pincodeSearch.toLowerCase())).map((pin) => (
                        <div key={pin.id} className="flex items-center gap-4 px-6 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground font-mono">{pin.pincode}</p>
                            <p className="text-xs text-muted-foreground">{[pin.area_name, pin.city, pin.state].filter(Boolean).join(', ') || 'No area details'}</p>
                            <p className="text-xs text-muted-foreground">
                              {pin.delivery_days} day{pin.delivery_days !== 1 ? 's' : ''} delivery
                              {pin.extra_charge > 0 ? ` · Charge: ₹${(pin.extra_charge / 100).toLocaleString('en-IN')}` : ' · Free shipping'}
                              {pin.free_shipping_above && pin.free_shipping_above > 0 ? ` (free above ₹${(pin.free_shipping_above / 100).toLocaleString('en-IN')})` : ''}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pin.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{pin.is_active ? 'Active' : 'Off'}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => togglePincodeActive(pin)} className="h-7 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">{pin.is_active ? 'Disable' : 'Enable'}</button>
                            <button onClick={() => openEditPincode(pin)} className="w-7 h-7 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"><Icon name="PencilIcon" size={11} /></button>
                            <button onClick={() => deletePincode(pin.id)} disabled={deletingPincode === pin.id} className="w-7 h-7 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={11} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Zones Sub-tab ── */}
              {shippingTab === 'zones' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Define shipping charges by city, area, state, or distance range.</p>
                    <button onClick={openAddZone} className="h-10 px-5 rounded-full bg-foreground text-[#FAF6F0] font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors flex items-center gap-2 text-xs">
                      <Icon name="PlusIcon" size={14} />
                      Add Zone
                    </button>
                  </div>

                  {/* Search + List */}
                  <div className="bg-white rounded-2xl border border-[rgba(196,120,90,0.12)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[rgba(196,120,90,0.08)]">
                      <input
                        type="text"
                        className="w-full h-9 px-4 rounded-full border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary"
                        placeholder="Search zone name, city, area…"
                        value={zoneSearch}
                        onChange={(e) => setZoneSearch(e.target.value)}
                      />
                    </div>
                    <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                      {shippingZones.filter((z) => !zoneSearch || z.zone_name.toLowerCase().includes(zoneSearch.toLowerCase()) || z.city.toLowerCase().includes(zoneSearch.toLowerCase()) || z.area_keywords.toLowerCase().includes(zoneSearch.toLowerCase())).length === 0 ? (
                        <div className="px-6 py-12 text-center"><Icon name="MapIcon" size={32} className="text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No zones defined yet.</p></div>
                      ) : shippingZones.filter((z) => !zoneSearch || z.zone_name.toLowerCase().includes(zoneSearch.toLowerCase()) || z.city.toLowerCase().includes(zoneSearch.toLowerCase()) || z.area_keywords.toLowerCase().includes(zoneSearch.toLowerCase())).map((zone) => (
                        <div key={zone.id} className="flex items-center gap-4 px-6 py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground">{zone.zone_name}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">{zone.zone_type}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {zone.zone_type === 'city' && zone.city && `City: ${zone.city}`}
                              {zone.zone_type === 'state' && zone.state && `State: ${zone.state}`}
                              {zone.zone_type === 'area' && zone.area_keywords && `Areas: ${zone.area_keywords}`}
                              {zone.zone_type === 'distance' && `Distance: ${zone.min_distance_km}–${zone.max_distance_km} km`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Charge: {zone.shipping_charge === 0 ? 'Free' : `₹${(zone.shipping_charge / 100).toLocaleString('en-IN')}`}
                              {zone.free_shipping_above > 0 ? ` (free above ₹${(zone.free_shipping_above / 100).toLocaleString('en-IN')})` : ''}
                              {' · '}{zone.delivery_days} day{zone.delivery_days !== 1 ? 's' : ''}
                              {' · '}Priority: {zone.priority}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${zone.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{zone.is_active ? 'Active' : 'Off'}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => toggleZoneActive(zone)} className="h-7 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">{zone.is_active ? 'Disable' : 'Enable'}</button>
                            <button onClick={() => openEditZone(zone)} className="w-7 h-7 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"><Icon name="PencilIcon" size={11} /></button>
                            <button onClick={() => deleteZone(zone.id)} disabled={deletingZone === zone.id} className="w-7 h-7 rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"><Icon name="TrashIcon" size={11} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Pincode Modal ── */}
              {showPincodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingPincode ? 'Edit Pincode' : 'Add Pincode'}</h3>
                      <button onClick={() => setShowPincodeModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Pincode *</label>
                        <input type="text" maxLength={6} value={pincodeForm.pincode} onChange={(e) => setPincodeForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))} placeholder="6-digit pincode" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm font-mono focus:outline-none focus:border-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Area Name</label>
                          <input type="text" value={pincodeForm.area_name} onChange={(e) => setPincodeForm((p) => ({ ...p, area_name: e.target.value }))} placeholder="e.g. Bandra West" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">City</label>
                          <input type="text" value={pincodeForm.city} onChange={(e) => setPincodeForm((p) => ({ ...p, city: e.target.value }))} placeholder="e.g. Mumbai" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">State</label>
                        <input type="text" value={pincodeForm.state} onChange={(e) => setPincodeForm((p) => ({ ...p, state: e.target.value }))} placeholder="e.g. Maharashtra" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Shipping Charge (₹)</label>
                          <input type="number" min={0} value={pincodeForm.extra_charge / 100} onChange={(e) => setPincodeForm((p) => ({ ...p, extra_charge: Math.round(parseFloat(e.target.value || '0') * 100) }))} placeholder="0 = Free" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Delivery Days</label>
                          <input type="number" min={1} value={pincodeForm.delivery_days} onChange={(e) => setPincodeForm((p) => ({ ...p, delivery_days: parseInt(e.target.value || '3') }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Free Shipping Above (₹) — 0 = never free</label>
                        <input type="number" min={0} value={(pincodeForm as any).free_shipping_above ? (pincodeForm as any).free_shipping_above / 100 : 0} onChange={(e) => setPincodeForm((p) => ({ ...p, free_shipping_above: Math.round(parseFloat(e.target.value || '0') * 100) } as any))} placeholder="e.g. 1250" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={pincodeForm.is_active} onChange={(e) => setPincodeForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-semibold text-foreground">Active</span>
                      </label>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowPincodeModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button disabled={savingPincode} onClick={savePincode} className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50">
                        {savingPincode ? 'Saving…' : editingPincode ? 'Update' : 'Add Pincode'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Zone Modal ── */}
              {showZoneModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingZone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}</h3>
                      <button onClick={() => setShowZoneModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Zone Name *</label>
                        <input type="text" value={zoneForm.zone_name} onChange={(e) => setZoneForm((p) => ({ ...p, zone_name: e.target.value }))} placeholder="e.g. Mumbai Local, South India, etc." className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Zone Type</label>
                        <select value={zoneForm.zone_type} onChange={(e) => setZoneForm((p) => ({ ...p, zone_type: e.target.value as ShippingZone['zone_type'] }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary">
                          <option value="city">City</option>
                          <option value="area">Area (keyword match)</option>
                          <option value="state">State</option>
                          <option value="distance">Distance Range</option>
                        </select>
                      </div>
                      {(zoneForm.zone_type === 'city' || zoneForm.zone_type === 'area') && (
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">City</label>
                          <input type="text" value={zoneForm.city} onChange={(e) => setZoneForm((p) => ({ ...p, city: e.target.value }))} placeholder="e.g. Mumbai" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      )}
                      {(zoneForm.zone_type === 'state' || zoneForm.zone_type === 'area') && (
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">State</label>
                          <input type="text" value={zoneForm.state} onChange={(e) => setZoneForm((p) => ({ ...p, state: e.target.value }))} placeholder="e.g. Maharashtra" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      )}
                      {zoneForm.zone_type === 'area' && (
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Area Keywords (comma-separated)</label>
                          <input type="text" value={zoneForm.area_keywords} onChange={(e) => setZoneForm((p) => ({ ...p, area_keywords: e.target.value }))} placeholder="e.g. Bandra, Andheri, Juhu" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                          <p className="mt-1 text-[10px] text-muted-foreground">Checkout will match if the customer&apos;s area contains any of these keywords.</p>
                        </div>
                      )}
                      {zoneForm.zone_type === 'distance' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Min Distance (km)</label>
                            <input type="number" min={0} value={zoneForm.min_distance_km} onChange={(e) => setZoneForm((p) => ({ ...p, min_distance_km: parseFloat(e.target.value || '0') }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Max Distance (km)</label>
                            <input type="number" min={0} value={zoneForm.max_distance_km} onChange={(e) => setZoneForm((p) => ({ ...p, max_distance_km: parseFloat(e.target.value || '9999') }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Shipping Charge (₹)</label>
                          <input type="number" min={0} value={zoneForm.shipping_charge} onChange={(e) => setZoneForm((p) => ({ ...p, shipping_charge: Math.round(parseFloat(e.target.value || '0')) }))} placeholder="0 = Free" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Delivery Days</label>
                          <input type="number" min={1} value={zoneForm.delivery_days} onChange={(e) => setZoneForm((p) => ({ ...p, delivery_days: parseInt(e.target.value || '5') }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Free Shipping Above (₹) — 0 = never</label>
                          <input type="number" min={0} value={zoneForm.free_shipping_above} onChange={(e) => setZoneForm((p) => ({ ...p, free_shipping_above: Math.round(parseFloat(e.target.value || '0')) }))} placeholder="e.g. 1250" className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Priority (higher = checked first)</label>
                          <input type="number" min={0} value={zoneForm.priority} onChange={(e) => setZoneForm((p) => ({ ...p, priority: parseInt(e.target.value || '0') }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={zoneForm.is_active} onChange={(e) => setZoneForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-xs font-semibold text-foreground">Active</span>
                      </label>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowZoneModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button disabled={savingZone} onClick={saveZone} className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50">
                        {savingZone ? 'Saving…' : editingZone ? 'Update' : 'Add Zone'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    </main>
  );
}