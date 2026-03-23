-- Migration: Add coupons table and inventory columns to products
-- Timestamp: 20260321200000

-- ─── Add inventory columns to products ───────────────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

-- ─── Coupons table ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  min_order_amount numeric(10,2) DEFAULT NULL,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS for coupons ─────────────────────────────────────────────────────────

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Public read for active coupons (for checkout validation)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_public_read'
  ) THEN
    CREATE POLICY coupons_public_read ON public.coupons
      FOR SELECT USING (is_active = true);
  END IF;

  -- Admin full access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_admin_all'
  ) THEN
    CREATE POLICY coupons_admin_all ON public.coupons
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ─── Seed sample coupons ─────────────────────────────────────────────────────

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, is_active)
VALUES
  ('WELCOME10', 'Welcome discount — 10% off your first order', 'percentage', 10, NULL, 500, true),
  ('SAVE20', '20% off orders above ₹500', 'percentage', 20, 500, 200, true),
  ('FLAT100', 'Flat ₹100 off on orders above ₹800', 'fixed', 100, 800, 100, true)
ON CONFLICT (code) DO NOTHING;
