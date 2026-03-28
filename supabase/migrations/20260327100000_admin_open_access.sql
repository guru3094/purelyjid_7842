-- Admin Open Access Migration
-- The admin panel uses cookie-based auth (not Supabase auth), so anon key must have full access
-- to all admin-managed tables. Disable RLS on these tables.

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_catalogues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_pincodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_enquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
