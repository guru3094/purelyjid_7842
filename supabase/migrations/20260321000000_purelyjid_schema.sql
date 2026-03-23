-- ============================================================
-- PurelyJid Schema Migration
-- Tables: user_profiles, orders, order_items, product_reviews
-- ============================================================

-- 1. TYPES
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'customer');

DROP TYPE IF EXISTS public.order_status CASCADE;
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- 2. CORE TABLES

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role public.user_role DEFAULT 'customer'::public.user_role,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  status public.order_status DEFAULT 'pending'::public.order_status,
  subtotal INTEGER NOT NULL DEFAULT 0,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_id TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  variant TEXT,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);

-- Unique review per user per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_review ON public.product_reviews(user_id, product_id);

-- 4. FUNCTIONS (before RLS policies)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = auth.uid()
  AND (au.raw_user_meta_data->>'role' = 'admin'
       OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 5. ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_read_all_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_read_all_user_profiles"
ON public.user_profiles FOR SELECT TO authenticated
USING (public.is_admin_from_auth());

-- orders
DROP POLICY IF EXISTS "users_manage_own_orders" ON public.orders;
CREATE POLICY "users_manage_own_orders"
ON public.orders FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_orders" ON public.orders;
CREATE POLICY "admin_manage_all_orders"
ON public.orders FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- order_items
DROP POLICY IF EXISTS "users_view_own_order_items" ON public.order_items;
CREATE POLICY "users_view_own_order_items"
ON public.order_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "users_insert_own_order_items" ON public.order_items;
CREATE POLICY "users_insert_own_order_items"
ON public.order_items FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admin_manage_all_order_items" ON public.order_items;
CREATE POLICY "admin_manage_all_order_items"
ON public.order_items FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- product_reviews: public read, authenticated write own
DROP POLICY IF EXISTS "public_read_reviews" ON public.product_reviews;
CREATE POLICY "public_read_reviews"
ON public.product_reviews FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "users_manage_own_reviews" ON public.product_reviews;
CREATE POLICY "users_manage_own_reviews"
ON public.product_reviews FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_reviews" ON public.product_reviews;
CREATE POLICY "admin_manage_all_reviews"
ON public.product_reviews FOR ALL TO authenticated
USING (public.is_admin_from_auth()) WITH CHECK (public.is_admin_from_auth());

-- 7. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. MOCK DATA
DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
  customer_uuid UUID := gen_random_uuid();
  order1_uuid UUID := gen_random_uuid();
  order2_uuid UUID := gen_random_uuid();
BEGIN
  -- Create admin user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@purelyjid.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'PurelyJid Admin', 'role', 'admin'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (id) DO NOTHING;

  -- Create customer user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    customer_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'customer@example.com', crypt('customer123', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Priya Sharma'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (id) DO NOTHING;

  -- Sample orders for customer
  INSERT INTO public.orders (id, user_id, order_number, status, subtotal, shipping, total, shipping_address, payment_id, razorpay_order_id)
  VALUES
    (order1_uuid, customer_uuid, 'PJ-2026-001', 'delivered'::public.order_status,
     29620, 0, 29620,
     jsonb_build_object('firstName', 'Priya', 'lastName', 'Sharma', 'address', '12 MG Road', 'city', 'Bengaluru', 'state', 'Karnataka', 'pincode', '560001', 'phone', '9876543210'),
     'pay_demo001', 'order_demo001'),
    (order2_uuid, customer_uuid, 'PJ-2026-002', 'processing'::public.order_status,
     6400, 999, 7399,
     jsonb_build_object('firstName', 'Priya', 'lastName', 'Sharma', 'address', '12 MG Road', 'city', 'Bengaluru', 'state', 'Karnataka', 'pincode', '560001', 'phone', '9876543210'),
     'pay_demo002', 'order_demo002')
  ON CONFLICT (id) DO NOTHING;

  -- Order items
  INSERT INTO public.order_items (order_id, product_id, product_name, product_image, variant, price, quantity)
  VALUES
    (order1_uuid, 1, 'Handwoven Linen Tote', 'https://img.rocket.new/generatedImages/rocket_gen_img_199eb8512-1766966892932.png', 'Natural / Medium', 10640, 1),
    (order1_uuid, 2, 'Ceramic Pour-Over Set', 'https://images.unsplash.com/photo-1592569917779-18d5464fef3e', 'Matte White', 7820, 2),
    (order1_uuid, 3, 'Beeswax Pillar Candle', 'https://img.rocket.new/generatedImages/rocket_gen_img_16bda0cf9-1772220882271.png', 'Honey / Tall', 3160, 1),
    (order2_uuid, 4, 'Aurora Resin Pendant', 'https://images.unsplash.com/photo-1676157211877-760c3d400217', 'Gold / Small', 3200, 2)
  ON CONFLICT (id) DO NOTHING;

  -- Sample reviews
  INSERT INTO public.product_reviews (user_id, product_id, rating, title, body)
  VALUES
    (customer_uuid, 1, 5, 'Absolutely beautiful!', 'The quality is stunning. The linen is so soft and the craftsmanship is impeccable. Will definitely order again.'),
    (customer_uuid, 2, 5, 'Perfect pour-over set', 'Gorgeous ceramic work. The matte white finish is exactly as pictured. Makes my morning coffee ritual so much more special.'),
    (customer_uuid, 3, 4, 'Lovely candle, great scent', 'Burns beautifully and the honey scent is subtle and warm. The dried botanicals make it look like a piece of art.')
  ON CONFLICT (user_id, product_id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
