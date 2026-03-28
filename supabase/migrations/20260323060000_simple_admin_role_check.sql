-- ============================================================
-- Simplest possible admin role check:
-- 1. Drop the recursive admin_read_all_user_profiles policy
-- 2. Create a SECURITY DEFINER function that reads role
--    directly, bypassing RLS entirely
-- ============================================================

-- Drop the policy that causes infinite recursion
-- (it calls is_admin_from_auth() which queries user_profiles,
--  which triggers the policy again → infinite loop)
DROP POLICY IF EXISTS "admin_read_all_user_profiles" ON public.user_profiles;

-- Simple SECURITY DEFINER function: reads the current user's role
-- bypassing RLS so there is no recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::TEXT
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
