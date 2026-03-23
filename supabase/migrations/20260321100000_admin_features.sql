-- ============================================================
-- PurelyJid Admin Features Migration
-- Tables: products, categories, store_themes, notification_preferences
-- ============================================================

-- 1. TABLES

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  original_price INTEGER,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  material TEXT DEFAULT '',
  badge TEXT,
  badge_color TEXT DEFAULT 'bg-primary',
  image_url TEXT,
  alt_text TEXT DEFAULT '',
  in_stock BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.store_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#C4785A',
  secondary_color TEXT NOT NULL DEFAULT '#8B6F5E',
  background_color TEXT NOT NULL DEFAULT '#FAF6F0',
  accent_color TEXT NOT NULL DEFAULT '#D4A853',
  font_display TEXT NOT NULL DEFAULT 'Playfair Display',
  font_body TEXT NOT NULL DEFAULT 'Inter',
  preview_image TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  order_updates BOOLEAN DEFAULT true,
  promotional_emails BOOLEAN DEFAULT true,
  new_arrivals BOOLEAN DEFAULT false,
  review_responses BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON public.notification_preferences(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_notification_prefs ON public.notification_preferences(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_theme ON public.store_themes(is_active) WHERE is_active = true;

-- 3. FUNCTIONS

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE id = auth.uid() AND role = 'admin'
)
$$;

-- 4. ENABLE RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES

-- Categories: public read, admin write
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON public.categories;
CREATE POLICY "admin_manage_categories" ON public.categories
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Products: public read, admin write
DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products" ON public.products
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
CREATE POLICY "admin_manage_products" ON public.products
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Store themes: public read, admin write
DROP POLICY IF EXISTS "public_read_store_themes" ON public.store_themes;
CREATE POLICY "public_read_store_themes" ON public.store_themes
FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_store_themes" ON public.store_themes;
CREATE POLICY "admin_manage_store_themes" ON public.store_themes
FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Notification preferences: user owns their own
DROP POLICY IF EXISTS "users_manage_own_notification_preferences" ON public.notification_preferences;
CREATE POLICY "users_manage_own_notification_preferences" ON public.notification_preferences
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. SEED DATA

-- Categories
INSERT INTO public.categories (name, slug, description, display_order) VALUES
  ('Jewelry', 'jewelry', 'Handcrafted resin jewelry pieces', 1),
  ('Home Décor', 'home-decor', 'Beautiful resin home decoration items', 2),
  ('DIY Supplies', 'diy-supplies', 'Everything you need to create resin art', 3),
  ('Stationery', 'stationery', 'Resin stationery and desk accessories', 4),
  ('Accessories', 'accessories', 'Resin accessories for everyday use', 5)
ON CONFLICT (slug) DO NOTHING;

-- Store Themes
INSERT INTO public.store_themes (name, slug, description, primary_color, secondary_color, background_color, accent_color, is_active) VALUES
  ('Warm Terracotta', 'warm-terracotta', 'The classic PurelyJid warm earthy tones', '#C4785A', '#8B6F5E', '#FAF6F0', '#D4A853', true),
  ('Ocean Breeze', 'ocean-breeze', 'Cool blues and teals inspired by the sea', '#2E86AB', '#1A5276', '#F0F8FF', '#48CAE4', false),
  ('Forest Green', 'forest-green', 'Deep greens and natural earth tones', '#2D6A4F', '#1B4332', '#F0F4F0', '#74C69D', false),
  ('Rose Gold', 'rose-gold', 'Elegant rose gold and blush tones', '#C9748A', '#A0526B', '#FFF5F7', '#F4A7B9', false),
  ('Midnight Dark', 'midnight-dark', 'Sophisticated dark mode aesthetic', '#8B5CF6', '#6D28D9', '#0F0F1A', '#A78BFA', false)
ON CONFLICT (slug) DO NOTHING;

-- Products (seeded from existing static data)
DO $$
DECLARE
  jewelry_id UUID;
  home_decor_id UUID;
  diy_id UUID;
  stationery_id UUID;
  accessories_id UUID;
BEGIN
  SELECT id INTO jewelry_id FROM public.categories WHERE slug = 'jewelry' LIMIT 1;
  SELECT id INTO home_decor_id FROM public.categories WHERE slug = 'home-decor' LIMIT 1;
  SELECT id INTO diy_id FROM public.categories WHERE slug = 'diy-supplies' LIMIT 1;
  SELECT id INTO stationery_id FROM public.categories WHERE slug = 'stationery' LIMIT 1;
  SELECT id INTO accessories_id FROM public.categories WHERE slug = 'accessories' LIMIT 1;

  INSERT INTO public.products (name, slug, description, price, original_price, category_id, material, badge, badge_color, image_url, alt_text, in_stock, display_order) VALUES
    ('Aurora Resin Pendant', 'aurora-resin-pendant', 'Stunning aurora-colored resin pendant with purple and teal swirls', 3800, 4800, jewelry_id, 'Resin + Crystal', 'Bestseller', 'bg-primary', 'https://images.unsplash.com/photo-1676157211877-760c3d400217', 'Aurora-colored resin pendant with purple and teal swirls on silver chain', true, 1),
    ('Galaxy Geode Tray', 'galaxy-geode-tray', 'Deep blue and gold galaxy pattern oval resin serving tray', 6400, NULL, home_decor_id, 'Resin + Gold Leaf', 'New', 'bg-secondary', 'https://img.rocket.new/generatedImages/rocket_gen_img_1545b4ef2-1771900598709.png', 'Oval resin serving tray with deep blue and gold galaxy pattern', true, 2),
    ('Floral Resin Earrings', 'floral-resin-earrings', 'Translucent resin earrings with real dried flower inclusions', 2400, NULL, jewelry_id, 'Resin + Dried Flowers', 'Popular', 'bg-accent-gold', 'https://img.rocket.new/generatedImages/rocket_gen_img_1bb068302-1772088252319.png', 'Translucent resin earrings with real dried flower inclusions in teardrop shape', true, 3),
    ('Complete Starter Kit', 'complete-starter-kit', 'Everything you need to start your resin art journey', 5200, 6800, diy_id, 'Resin + Pigments', 'Gift Idea', 'bg-primary', 'https://img.rocket.new/generatedImages/rocket_gen_img_130a82f81-1772220075768.png', 'Resin art starter kit with clear resin bottles, silicone molds, and color pigments', true, 4),
    ('Ocean Wave Coaster Set', 'ocean-wave-coaster-set', 'Set of four round resin coasters with ocean wave patterns', 4200, NULL, home_decor_id, 'Resin + Mica', 'New', 'bg-secondary', 'https://images.unsplash.com/photo-1626195850148-820e10d928f6', 'Set of four round resin coasters with ocean wave patterns in shades of blue and white', true, 5),
    ('Pressed Flower Bookmark', 'pressed-flower-bookmark', 'Delicate clear resin bookmarks with colorful pressed flowers', 1800, NULL, stationery_id, 'Resin + Botanicals', NULL, '', 'https://images.unsplash.com/photo-1677737775719-b6824065d398', 'Delicate clear resin bookmarks with colorful pressed flowers and gold leaf', true, 6),
    ('Geode Wall Clock', 'geode-wall-clock', 'Round wall clock with geode-inspired resin face in rose gold', 8800, 11000, home_decor_id, 'Resin + Agate', 'Limited', 'bg-accent-gold', 'https://img.rocket.new/generatedImages/rocket_gen_img_1e3c8f66e-1772996476517.png', 'Round wall clock with geode-inspired resin face in rose gold and ivory tones', false, 7),
    ('Resin Ring Set', 'resin-ring-set', 'Set of three colorful resin rings with glitter inclusions', 2900, NULL, jewelry_id, 'Resin + Glitter', NULL, '', 'https://images.unsplash.com/photo-1705058715556-ec2e1a8327b4', 'Set of three colorful resin rings with glitter inclusions on marble surface', true, 8),
    ('Pigment Powder Set', 'pigment-powder-set', 'Collection of vibrant mica pigment powder jars', 3400, NULL, diy_id, 'Mica Powder', 'Popular', 'bg-accent-gold', 'https://img.rocket.new/generatedImages/rocket_gen_img_1f764a867-1771900600936.png', 'Collection of vibrant mica pigment powder jars in metallic and pearlescent colors', true, 9),
    ('Resin Photo Frame', 'resin-photo-frame', 'Handcrafted resin photo frame with embedded seashells', 4600, NULL, home_decor_id, 'Resin + Shells', 'New', 'bg-secondary', 'https://img.rocket.new/generatedImages/rocket_gen_img_13091368f-1772088172091.png', 'Handcrafted resin photo frame with embedded seashells and ocean-blue pigment swirls', true, 10),
    ('Silicone Mold Bundle', 'silicone-mold-bundle', 'Bundle of various silicone resin casting molds', 2600, 3200, diy_id, 'Silicone', NULL, '', 'https://img.rocket.new/generatedImages/rocket_gen_img_131eb6c4b-1766490611748.png', 'Bundle of various silicone resin casting molds including geometric and organic shapes', true, 11),
    ('Resin Keychain Set', 'resin-keychain-set', 'Set of four colorful resin keychains with gold foil', 2200, NULL, accessories_id, 'Resin + Foil', 'Gift Idea', 'bg-primary', 'https://img.rocket.new/generatedImages/rocket_gen_img_1829ab903-1772088721014.png', 'Set of four colorful resin keychains with gold foil and floral inclusions', true, 12)
  ON CONFLICT (slug) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Product seeding failed: %', SQLERRM;
END $$;
