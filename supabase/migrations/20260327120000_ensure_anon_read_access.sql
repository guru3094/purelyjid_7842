-- Ensure custom_products table has RLS disabled for anon key read access
-- Admin uses cookie-based auth, not Supabase auth
ALTER TABLE IF EXISTS public.custom_products DISABLE ROW LEVEL SECURITY;

-- Also ensure wishlist and notification_preferences tables are accessible
ALTER TABLE IF EXISTS public.wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_preferences DISABLE ROW LEVEL SECURITY;

-- Grant SELECT on all frontend-facing tables to anon role explicitly
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.story_content TO anon;
GRANT SELECT ON public.workshop_catalogues TO anon;
GRANT SELECT ON public.workshops TO anon;
GRANT SELECT ON public.custom_products TO anon;
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.delivery_pincodes TO anon;
GRANT SELECT ON public.shipping_zones TO anon;
GRANT SELECT ON public.courier_partners TO anon;
