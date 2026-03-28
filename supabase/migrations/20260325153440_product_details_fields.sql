-- Add detailed product fields to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS additional_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS care_instructions text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sku text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS weight text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS dimensions text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
