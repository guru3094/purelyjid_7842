-- Workshop details table for admin-managed workshops
CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  location TEXT,
  workshop_date TIMESTAMPTZ,
  duration TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT true,
  catalogue_id UUID REFERENCES public.workshop_catalogues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workshops_is_active ON public.workshops(is_active);
CREATE INDEX IF NOT EXISTS idx_workshops_workshop_date ON public.workshops(workshop_date);
CREATE INDEX IF NOT EXISTS idx_workshops_catalogue_id ON public.workshops(catalogue_id);

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

-- Public can read active workshops
DROP POLICY IF EXISTS "public_read_workshops" ON public.workshops;
CREATE POLICY "public_read_workshops"
ON public.workshops
FOR SELECT
TO public
USING (is_active = true);

-- Admins can manage all workshops
DROP POLICY IF EXISTS "admin_manage_workshops" ON public.workshops;
CREATE POLICY "admin_manage_workshops"
ON public.workshops
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Also ensure workshop_catalogues has public read policy
DROP POLICY IF EXISTS "public_read_workshop_catalogues" ON public.workshop_catalogues;
CREATE POLICY "public_read_workshop_catalogues"
ON public.workshop_catalogues
FOR SELECT
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_workshop_catalogues" ON public.workshop_catalogues;
CREATE POLICY "admin_manage_workshop_catalogues"
ON public.workshop_catalogues
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
