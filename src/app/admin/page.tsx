'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

import Icon from '@/components/ui/AppIcon';

import { AdminStatSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
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
  price: number;
  original_price: number | null;
  category_id: string | null;
  material: string;
  badge: string | null;
  badge_color: string;
  image_url: string | null;
  alt_text: string;
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
  max_discount_amount: number | null;
  usage_limit: number | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  expires_at: string | null;
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
}

type Tab = 'overview' | 'analytics' | 'orders' | 'products' | 'inventory' | 'coupons' | 'categories' | 'themes' | 'couriers' | 'story' | 'users' | 'google-reviews' | 'invoices' | 'vyaapar' | 'shop' | 'collections' | 'workshops-admin' | 'custom-products-admin' | 'pincodes' | 'brand-templates';

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

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

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
  description: '',
  price: 0,
  original_price: null as number | null,
  stock_quantity: 0,
  sku: '',
  images: [] as { url: string; alt: string }[],
  is_active: true,
  is_featured: false,
  weight: null as number | null,
  dimensions: null as string | null,
  category_ids: [] as string[],
  theme_id: null as string | null,
  tags: [] as string[],
};

const EMPTY_COUPON = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 0,
  min_order_amount: null as number | null,
  max_discount_amount: null as number | null,
  usage_limit: null as number | null,
  valid_from: '',
  valid_until: null as string | null,
  is_active: true,
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
  const { user, loading: authLoading } = useAuth();
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
  const [pincodeForm, setPincodeForm] = useState({ pincode: '', area_name: '', city: '', state: '', is_active: true, delivery_days: 3, extra_charge: 0 });
  const [savingPincode, setSavingPincode] = useState(false);
  const [deletingPincode, setDeletingPincode] = useState<string | null>(null);
  const [pincodeSearch, setPincodeSearch] = useState('');
  const [bulkPincodes, setBulkPincodes] = useState('');
  const [importingPincodes, setImportingPincodes] = useState(false);

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
      const [ordersRes, usersRes, productsRes, categoriesRes, themesRes, couponsRes, couriersRes, storyRes, workshopRes, customRes, enquiriesRes, pincodesRes] = await Promise.all([
        supabase.from('orders').select('*, user_profiles(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*, categories(name)').order('display_order', { ascending: true }),
        supabase.from('categories').select('*').order('display_order', { ascending: true }),
        supabase.from('store_themes').select('*').order('created_at', { ascending: true }),
        supabase.from('coupons').select('*').order('created_at', { ascending: false }),
        supabase.from('courier_partners').select('*').order('created_at', { ascending: false }),
        supabase.from('story_content').select('*').eq('section_key', 'craft_story').single(),
        supabase.from('workshop_catalogues').select('*').order('created_at', { ascending: false }),
        supabase.from('custom_products').select('*').order('display_order', { ascending: true }),
        supabase.from('custom_enquiries').select('*').order('created_at', { ascending: false }),
        supabase.from('delivery_pincodes').select('*').order('pincode', { ascending: true }),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (themesRes.data) setThemes(themesRes.data);
      if (couponsRes.data) setCoupons(couponsRes.data);
      if (couriersRes.data) setCouriers(couriersRes.data);
      if (storyRes.data) { setStoryContent(storyRes.data); setStoryForm(storyRes.data); }
      if (workshopRes.data) setWorkshopCatalogues(workshopRes.data);
      if (customRes.data) setCustomProducts(customRes.data);
      if (enquiriesRes.data) setCustomEnquiries(enquiriesRes.data);
      if (pincodesRes.data) setPincodes(pincodesRes.data);
      // Fetch workshops
      const supabase2 = createClient();
      const workshopsRes = await supabase2.from('workshops').select('*').order('created_at', { ascending: false });
      if (workshopsRes.data) setWorkshops(workshopsRes.data);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      const checkAdmin = async () => {
        try {
          const userEmail = user?.email?.toLowerCase() ?? '';
          if (userEmail === 'info@purelyjid.in') {
            setIsAdmin(true);
            fetchData();
          } else {
            router.push('/');
          }
        } catch { router.push('/'); }
        finally { setCheckingRole(false); }
      };
      checkAdmin();
    }
  }, [user, authLoading]);

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
      const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });

      const price = Math.round(parseFloat(row['price'] || '0') * 100);
      if (isNaN(price) || price <= 0) { errors.push(`Row ${i + 2}: Invalid price "${row['price']}"`); return; }
      if (!row['name']?.trim()) { errors.push(`Row ${i + 2}: Name is required`); return; }

      const slug = (row['slug'] || row['name']).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      products.push({
        name: row['name'],
        slug,
        description: row['description'] || '',
        price,
        original_price: row['original_price'] ? Math.round(parseFloat(row['original_price']) * 100) : null,
        category_id: null,
        material: row['material'] || '',
        badge: row['badge'] || null,
        badge_color: row['badge_color'] || 'bg-primary',
        image_url: row['image_url'] || '',
        alt_text: row['alt_text'] || row['name'],
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
    const headers = 'name,slug,description,price,original_price,material,badge,image_url,alt_text,in_stock,is_active,display_order,stock_quantity,low_stock_threshold';
    const example = 'Aurora Pendant,aurora-pendant,Beautiful resin pendant,38.00,48.00,Resin + Crystal,Bestseller,https://example.com/img.jpg,Aurora pendant on white background,true,true,1,50,5';
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
    setPincodeForm({ pincode: '', area_name: '', city: '', state: '', is_active: true, delivery_days: 3, extra_charge: 0 });
    setShowPincodeModal(true);
  };

  const openEditPincode = (p: DeliveryPincode) => {
    setEditingPincode(p);
    setPincodeForm({ pincode: p.pincode, area_name: p.area_name, city: p.city, state: p.state, is_active: p.is_active, delivery_days: p.delivery_days, extra_charge: p.extra_charge });
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

  // ── Product Actions (stub) ───────────────────────────────────────────────

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductImageFile(null);
    setProductImagePreview('');
    setShowProductModal(true);
  };

  // ── Loading / Guard ─────────────────────────────────────────────────────────

  if (authLoading || checkingRole) {
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
                <div className="divide-y divide-[rgba(196,120,90,0.06)]">
                  {products.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Icon name="ArchiveBoxIcon" size={32} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">No products yet</p>
                    </div>
                  ) : products.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAF6F0]/50 transition-colors">
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
                          onClick={() => { setEditingProduct(product); setProductForm({ name: product.name, slug: product.slug, description: product.description, price: product.price, original_price: product.original_price, category_id: product.category_id, material: product.material, badge: product.badge, badge_color: product.badge_color, image_url: product.image_url, alt_text: product.alt_text, in_stock: product.in_stock, is_active: product.is_active, display_order: product.display_order, stock_quantity: product.stock_quantity, low_stock_threshold: product.low_stock_threshold }); setProductImageFile(null); setProductImagePreview(product.image_url || ''); setShowProductModal(true); }}
                          className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Icon name="PencilIcon" size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            setDeletingProduct(product.id);
                            try {
                              const supabase = createClient();
                              await supabase.from('products').delete().eq('id', product.id);
                              setProducts((prev) => prev.filter((p) => p.id !== product.id));
                              showToast('Product deleted.', 'success');
                            } catch { showToast('Failed to delete product.', 'error'); }
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
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="px-6 py-5 border-b border-[rgba(196,120,90,0.08)] flex items-center justify-between">
                      <h3 className="font-display italic text-lg font-semibold text-foreground">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                      <button onClick={() => setShowProductModal(false)} className="w-8 h-8 rounded-full border border-[rgba(196,120,90,0.2)] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Icon name="XMarkIcon" size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      {/* Product Image Upload */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Product Image</label>
                        <div
                          onClick={() => productImageInputRef.current?.click()}
                          className="relative border-2 border-dashed border-[rgba(196,120,90,0.3)] rounded-2xl overflow-hidden cursor-pointer hover:border-primary transition-colors"
                          style={{ height: productImagePreview ? 160 : 80 }}
                        >
                          {productImagePreview ? (
                            <img src={productImagePreview} alt={productImagePreview} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Icon name="PhotoIcon" size={22} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Click to upload image</span>
                            </div>
                          )}
                        </div>
                        <input
                          ref={productImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProductImageSelect}
                        />
                        {productImageFile && (
                          <p className="mt-1.5 text-xs text-primary font-medium flex items-center gap-1">
                            <Icon name="CheckCircleIcon" size={12} />
                            {productImageFile.name}
                          </p>
                        )}
                      </div>
                      {[
                        { label: 'Product Name *', key: 'name', placeholder: 'e.g. Aurora Resin Pendant' },
                        { label: 'Image URL', key: 'image_url', placeholder: 'https://... (or upload above)' },
                        { label: 'Alt Text', key: 'alt_text', placeholder: 'Describe the image' },
                        { label: 'Material', key: 'material', placeholder: 'e.g. Resin + Crystal' },
                        { label: 'Badge', key: 'badge', placeholder: 'e.g. Bestseller' },
                      ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</label>
                          <input type="text" value={(productForm as any)[key] || ''} onChange={(e) => setProductForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary" />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Price (paise) *</label>
                          <input type="number" min="0" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: Number(e.target.value) }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Stock Qty</label>
                          <input type="number" min="0" value={productForm.stock_quantity ?? 0} onChange={(e) => setProductForm((p) => ({ ...p, stock_quantity: Number(e.target.value) }))} className="w-full h-10 px-4 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm text-foreground focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Description</label>
                        <textarea value={productForm.description} onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-[rgba(196,120,90,0.2)] bg-[#FAF6F0] text-sm focus:outline-none focus:border-primary resize-none" />
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={productForm.is_active} onChange={(e) => setProductForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" /><span className="text-xs font-semibold text-foreground">Active</span></label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={productForm.in_stock} onChange={(e) => setProductForm((p) => ({ ...p, in_stock: e.target.checked }))} className="w-4 h-4 accent-primary" /><span className="text-xs font-semibold text-foreground">In Stock</span></label>
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[rgba(196,120,90,0.08)] flex items-center justify-end gap-3">
                      <button onClick={() => setShowProductModal(false)} className="h-10 px-5 rounded-full border border-[rgba(196,120,90,0.2)] text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors">Cancel</button>
                      <button
                        disabled={savingProduct || !productForm.name?.trim()}
                        onClick={async () => {
                          if (!productForm.name?.trim()) { showToast('Product name is required.', 'error'); return; }
                          setSavingProduct(true);
                          try {
                            const supabase = createClient();
                            const slug = productForm.slug || productForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                            const payload = { ...productForm, slug, updated_at: new Date().toISOString() };
                            if (editingProduct) {
                              await supabase.from('products').update(payload).eq('id', editingProduct.id);
                              showToast('Product updated.', 'success');
                            } else {
                              await supabase.from('products').insert(payload);
                              showToast('Product added.', 'success');
                            }
                            setShowProductModal(false);
                            fetchData();
                          } catch (err: any) { showToast(err?.message || 'Failed to save product.', 'error'); }
                          finally { setSavingProduct(false); }
                        }}
                        className="h-10 px-6 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.15em] hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {savingProduct ? 'Saving…' : editingProduct ? 'Update' : 'Add Product'}
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${storyContent.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{storyContent.is_active ? 'Active' : 'Hidden'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${storyContent.in_stock ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>{storyContent.in_stock ? 'In Stock' : 'Out of Stock'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            const supabase = createClient();
                            await supabase.from('story_content').update({ is_active: !storyContent.is_active }).eq('id', storyContent.id!);
                            setStoryContent((prev) => ({ ...prev, is_active: !prev.is_active }));
                          } catch { showToast('Failed to update story visibility.', 'error'); }
                        }}
                        className="h-8 px-3 rounded-full border border-[rgba(196,120,90,0.2)] text-[10px] font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        {storyContent.is_active ? 'Hide' : 'Show'}
                      </button>
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
                              await supabase.from('story_content').update({ ...storyForm, section_key: 'craft_story' }).eq('id', storyForm.id);
                              setStoryContent(storyForm);
                            } else {
                              const { data } = await supabase.from('story_content').insert({ ...storyForm, section_key: 'craft_story' }).single();
                              setStoryContent(data);
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
                Fetch Reviews
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
        </div>
      </section>
    </main>
  );
}