-- ============================================================
-- Fix admin role check: update is_admin_from_auth() to also
-- check the role column in user_profiles table directly.
-- This ensures users with role='admin' in user_profiles can
-- access the admin panel even without JWT metadata set.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = auth.uid()
  AND (
    au.raw_user_meta_data->>'role' = 'admin'
    OR au.raw_app_meta_data->>'role' = 'admin'
  )
)
OR EXISTS (
  SELECT 1 FROM public.user_profiles up
  WHERE up.id = auth.uid()
  AND up.role = 'admin'::public.user_role
)
$$;
