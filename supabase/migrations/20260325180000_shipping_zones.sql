-- SHIPPING ZONES TABLE
-- Allows admin to define shipping charges by area, city, or distance range
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'city', -- 'city', 'area', 'distance', 'state'
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  area_keywords TEXT NOT NULL DEFAULT '', -- comma-separated keywords to match area names
  min_distance_km NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_distance_km NUMERIC(10,2) NOT NULL DEFAULT 9999,
  shipping_charge INTEGER NOT NULL DEFAULT 0, -- in paise (smallest currency unit)
  free_shipping_above INTEGER NOT NULL DEFAULT 0, -- order amount above which shipping is free (in paise), 0 = never free
  delivery_days INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0, -- higher priority wins when multiple zones match
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_active ON public.shipping_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_city ON public.shipping_zones(city);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_type ON public.shipping_zones(zone_type);

-- Add free_shipping_above to delivery_pincodes if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'delivery_pincodes' AND column_name = 'free_shipping_above'
  ) THEN
    ALTER TABLE public.delivery_pincodes ADD COLUMN free_shipping_above INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- RLS for shipping_zones
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shipping_zones' AND policyname='Public read shipping zones') THEN
    CREATE POLICY "Public read shipping zones"
      ON public.shipping_zones FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shipping_zones' AND policyname='Admins manage shipping zones') THEN
    CREATE POLICY "Admins manage shipping zones"
      ON public.shipping_zones FOR ALL
      USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
