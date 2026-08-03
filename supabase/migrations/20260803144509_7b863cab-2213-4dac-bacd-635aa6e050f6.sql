-- 1. Remove plaintext third-party API credentials from whatsapp_connections
ALTER TABLE public.whatsapp_connections
  DROP COLUMN IF EXISTS evolution_api_key,
  DROP COLUMN IF EXISTS evolution_api_url,
  DROP COLUMN IF EXISTS openai_api_key;

-- 2. Owner-only helper
CREATE OR REPLACE FUNCTION public.is_business_owner(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND business_id = _business_id AND role = 'owner'
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_business_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_business_owner(uuid) TO authenticated;

-- 3. finance_access: owner-only access, password_hash never readable by clients
DROP POLICY IF EXISTS "Members can view finance_access" ON public.finance_access;
DROP POLICY IF EXISTS "Members can insert finance_access" ON public.finance_access;
DROP POLICY IF EXISTS "Members can update finance_access" ON public.finance_access;

CREATE POLICY "Owners can view finance_access" ON public.finance_access
  FOR SELECT TO authenticated USING (public.is_business_owner(business_id));
CREATE POLICY "Owners can insert finance_access" ON public.finance_access
  FOR INSERT TO authenticated WITH CHECK (public.is_business_owner(business_id));
CREATE POLICY "Owners can update finance_access" ON public.finance_access
  FOR UPDATE TO authenticated USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

REVOKE SELECT ON public.finance_access FROM anon, authenticated;
GRANT SELECT (business_id, name, updated_at) ON public.finance_access TO authenticated;
GRANT INSERT, UPDATE ON public.finance_access TO authenticated;
GRANT ALL ON public.finance_access TO service_role;

-- 4. whatsapp_connections: restrict management to owners
DROP POLICY IF EXISTS "Members can view whatsapp" ON public.whatsapp_connections;
DROP POLICY IF EXISTS "Members can insert whatsapp" ON public.whatsapp_connections;
DROP POLICY IF EXISTS "Members can update whatsapp" ON public.whatsapp_connections;

CREATE POLICY "Owners can view whatsapp" ON public.whatsapp_connections
  FOR SELECT TO authenticated USING (public.is_business_owner(business_id));
CREATE POLICY "Owners can insert whatsapp" ON public.whatsapp_connections
  FOR INSERT TO authenticated WITH CHECK (public.is_business_owner(business_id));
CREATE POLICY "Owners can update whatsapp" ON public.whatsapp_connections
  FOR UPDATE TO authenticated USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

REVOKE ALL ON public.whatsapp_connections FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_connections TO authenticated;
GRANT ALL ON public.whatsapp_connections TO service_role;