-- ============================================================
-- Migration: Wishlist, Courier Partners, Story Content
-- ============================================================

-- 1. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL DEFAULT '',
  product_image TEXT,
  product_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);

-- 2. COURIER PARTNERS TABLE
CREATE TABLE IF NOT EXISTS public.courier_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL DEFAULT '',
  base_url TEXT NOT NULL DEFAULT '',
  tracking_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. STORY CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.story_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  image_alt TEXT,
  quote TEXT,
  quote_author TEXT,
  extra_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. RLS POLICIES

-- Wishlists: users manage their own
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wishlists' AND policyname='Users can manage their own wishlist') THEN
    CREATE POLICY "Users can manage their own wishlist"
      ON public.wishlists FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Courier partners: admin only write, authenticated read
ALTER TABLE public.courier_partners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='courier_partners' AND policyname='Admins manage courier partners') THEN
    CREATE POLICY "Admins manage courier partners"
      ON public.courier_partners FOR ALL
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
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='courier_partners' AND policyname='Authenticated users read courier partners') THEN
    CREATE POLICY "Authenticated users read courier partners"
      ON public.courier_partners FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Story content: admin write, public read
ALTER TABLE public.story_content ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='story_content' AND policyname='Public read story content') THEN
    CREATE POLICY "Public read story content"
      ON public.story_content FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='story_content' AND policyname='Admins manage story content') THEN
    CREATE POLICY "Admins manage story content"
      ON public.story_content FOR ALL
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
  END IF;
END $$;

-- 5. SEED DEFAULT STORY CONTENT
INSERT INTO public.story_content (section_key, title, subtitle, body, image_url, image_alt, quote, quote_author, extra_data)
VALUES (
  'our_story',
  'Art born from Pure Intention.',
  'The Perspective',
  'PurelyJid started in a small Dallas kitchen in 2021. Jida Al-Rashid, a self-taught resin artist, began pouring her creativity into custom pieces for friends — and never stopped. Today, every item ships directly from her studio, still made by hand.',
  'https://img.rocket.new/generatedImages/rocket_gen_img_131e1516a-1771900598704.png',
  'Artisan hands carefully pouring tinted resin into a circular mold with gold leaf',
  'Every piece holds the exact moment I poured it — no two will ever be the same.',
  'Jida Al-Rashid',
  '{"founder_image": "https://img.rocket.new/generatedImages/rocket_gen_img_175a7bad5-1772144105475.png", "founder_image_alt": "Jida, founder of PurelyJid, smiling woman with warm expression", "founder_title": "Founder, PurelyJid", "features": [{"icon": "SparklesIcon", "title": "Hand-Poured", "desc": "Every piece made in small batches — never mass produced."}, {"icon": "GlobeAltIcon", "title": "Eco Pigments", "desc": "Non-toxic, skin-safe resin and natural mineral pigments."}, {"icon": "HeartIcon", "title": "Gift Ready", "desc": "Arrives in a signature PurelyJid keepsake box."}, {"icon": "StarIcon", "title": "5-Star Studio", "desc": "Rated 4.9 across 2,400+ verified purchases."}]}'::jsonb
)
ON CONFLICT (section_key) DO NOTHING;
