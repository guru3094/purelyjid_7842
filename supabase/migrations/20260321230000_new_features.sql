-- ============================================================
-- Migration: Workshop Catalogues, Custom Products, Pincodes, Integrations
-- ============================================================

-- 1. WORKSHOP CATALOGUES TABLE
CREATE TABLE IF NOT EXISTS public.workshop_catalogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workshop_catalogues_active ON public.workshop_catalogues(is_active);

-- 2. CUSTOM PRODUCTS TABLE (personalized/decorative)
CREATE TABLE IF NOT EXISTS public.custom_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Preserved Florals',
  price_range TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  catalogue_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_products_active ON public.custom_products(is_active);

-- 3. CUSTOM PRODUCT ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.custom_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.custom_products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  event_date TEXT,
  budget TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_enquiries_status ON public.custom_enquiries(status);

-- 4. DELIVERY PINCODES TABLE
CREATE TABLE IF NOT EXISTS public.delivery_pincodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode TEXT NOT NULL UNIQUE,
  area_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  delivery_days INTEGER NOT NULL DEFAULT 3,
  extra_charge INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_pincodes_pincode ON public.delivery_pincodes(pincode);
CREATE INDEX IF NOT EXISTS idx_delivery_pincodes_active ON public.delivery_pincodes(is_active);

-- 5. INTEGRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  icon TEXT NOT NULL DEFAULT '',
  is_connected BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. RLS POLICIES

-- Workshop Catalogues: admin write, public read
ALTER TABLE public.workshop_catalogues ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='workshop_catalogues' AND policyname='Public read workshop catalogues') THEN
    CREATE POLICY "Public read workshop catalogues"
      ON public.workshop_catalogues FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='workshop_catalogues' AND policyname='Admins manage workshop catalogues') THEN
    CREATE POLICY "Admins manage workshop catalogues"
      ON public.workshop_catalogues FOR ALL
      USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Custom Products: admin write, public read
ALTER TABLE public.custom_products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='custom_products' AND policyname='Public read custom products') THEN
    CREATE POLICY "Public read custom products"
      ON public.custom_products FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='custom_products' AND policyname='Admins manage custom products') THEN
    CREATE POLICY "Admins manage custom products"
      ON public.custom_products FOR ALL
      USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Custom Enquiries: public insert, admin read/manage
ALTER TABLE public.custom_enquiries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='custom_enquiries' AND policyname='Anyone can submit enquiry') THEN
    CREATE POLICY "Anyone can submit enquiry"
      ON public.custom_enquiries FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='custom_enquiries' AND policyname='Admins manage enquiries') THEN
    CREATE POLICY "Admins manage enquiries"
      ON public.custom_enquiries FOR ALL
      USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Delivery Pincodes: admin write, public read
ALTER TABLE public.delivery_pincodes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_pincodes' AND policyname='Public read delivery pincodes') THEN
    CREATE POLICY "Public read delivery pincodes"
      ON public.delivery_pincodes FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='delivery_pincodes' AND policyname='Admins manage delivery pincodes') THEN
    CREATE POLICY "Admins manage delivery pincodes"
      ON public.delivery_pincodes FOR ALL
      USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Integrations: admin only
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='integrations' AND policyname='Admins manage integrations') THEN
    CREATE POLICY "Admins manage integrations"
      ON public.integrations FOR ALL
      USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 7. SEED DEFAULT INTEGRATIONS
INSERT INTO public.integrations (name, slug, description, category, icon, is_connected, is_active, config)
VALUES
  ('Razorpay', 'razorpay', 'Payment gateway for accepting online payments via UPI, cards, and net banking.', 'payments', 'CreditCardIcon', true, true, '{"key_id_set": true}'::jsonb),
  ('Supabase', 'supabase', 'Backend database, authentication, and storage provider.', 'database', 'CircleStackIcon', true, true, '{}'::jsonb),
  ('Google Analytics', 'google-analytics', 'Track website traffic, user behavior, and conversion metrics.', 'analytics', 'ChartBarIcon', true, true, '{"measurement_id": "G-YW0R5J44BK"}'::jsonb),
  ('Google Places', 'google-places', 'Fetch and display Google Business reviews on your store.', 'reviews', 'StarIcon', false, true, '{}'::jsonb),
  ('Instagram', 'instagram', 'Display Instagram posts on your store via oEmbed (no token required).', 'social', 'PhotoIcon', true, true, '{}'::jsonb),
  ('WhatsApp Business', 'whatsapp', 'Deep links for customer support and order queries via WhatsApp.', 'communication', 'ChatBubbleLeftRightIcon', true, true, '{"number": "919999999999"}'::jsonb),
  ('Resend', 'resend', 'Transactional email service for order confirmations and notifications.', 'email', 'EnvelopeIcon', false, true, '{}'::jsonb),
  ('Vyaapar', 'vyaapar', 'GST accounting and inventory management via CSV import/export.', 'accounting', 'DocumentTextIcon', true, true, '{}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 8. SEED SAMPLE CUSTOM PRODUCTS
INSERT INTO public.custom_products (name, description, category, price_range, images, is_active, display_order)
VALUES
  (
    'Preserved Wedding Garland',
    'Your precious wedding garland preserved forever in crystal-clear resin. A timeless keepsake that captures the beauty and fragrance of your special day.',
    'Preserved Florals',
    '₹4,500 – ₹12,000',
    '[{"url": "https://img.rocket.new/generatedImages/rocket_gen_img_131e1516a-1771900598704.png", "alt": "Preserved wedding garland encased in clear resin frame with gold accents"}]'::jsonb,
    true,
    1
  ),
  (
    'Resin Floral Frame',
    'Custom resin frames embedding your dried flowers, petals, or botanicals. Perfect for anniversaries, birthdays, and memorial pieces.',
    'Resin Art',
    '₹2,000 – ₹6,000',
    '[{"url": "https://img.rocket.new/generatedImages/rocket_gen_img_175a7bad5-1772144105475.png", "alt": "Resin frame with embedded dried flowers and gold leaf on white background"}]'::jsonb,
    true,
    2
  ),
  (
    'Custom Resin Tray',
    'Personalized resin serving trays with your choice of colors, dried botanicals, and gold/silver leaf. Functional art for your home.',
    'Home Decor',
    '₹1,800 – ₹4,500',
    '[{"url": "https://img.rocket.new/generatedImages/rocket_gen_img_131e1516a-1771900598704.png", "alt": "Custom resin tray with teal and gold swirls on marble surface"}]'::jsonb,
    true,
    3
  )
ON CONFLICT DO NOTHING;
