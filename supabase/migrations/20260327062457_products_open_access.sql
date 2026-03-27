-- Ensure products table has RLS disabled for full anon access
-- (Admin uses cookie-based auth, not Supabase auth, so anon key needs write access)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies that would block anon writes
DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
DROP POLICY IF EXISTS "public_read_products" ON public.products;
