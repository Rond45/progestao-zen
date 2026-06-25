
-- 1. SECURITY DEFINER functions: revoke broad EXECUTE; grant only what RLS needs.
REVOKE EXECUTE ON FUNCTION public.check_appointment_working_hours() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_appointment_done() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_product_movement() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_current_business_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, platform_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, platform_role) TO authenticated;

-- 2. Storage: client-avatars bucket. Drop broad listing policy and scope writes to business members
-- (path convention: <business_id>/<filename>).
DROP POLICY IF EXISTS "Anyone can view client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update client avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete client avatars" ON storage.objects;

CREATE POLICY "Business members can upload client avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'client-avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_business_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Business members can update client avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'client-avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_business_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Business members can delete client avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'client-avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_business_member(((storage.foldername(name))[1])::uuid)
);
-- No SELECT policy needed: public bucket serves files directly via CDN; this prevents listing via Storage API.

-- 3. platform_config: make inaccessibility explicit (no client-role grants).
REVOKE ALL ON public.platform_config FROM anon, authenticated;
GRANT ALL ON public.platform_config TO service_role;

-- 4. professionals: hide salary_cents / commission_percentage from non-owners via column-level grants.
REVOKE SELECT ON public.professionals FROM authenticated;
GRANT SELECT (id, business_id, name, specialty, active, created_at, compensation_type) ON public.professionals TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.professionals TO authenticated;

-- Owner-only function returns compensation fields.
CREATE OR REPLACE FUNCTION public.get_professional_compensation(_professional_id uuid)
RETURNS TABLE (compensation_type text, commission_percentage numeric, salary_cents integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.professionals p
    JOIN public.profiles pr ON pr.business_id = p.business_id
    WHERE p.id = _professional_id
      AND pr.user_id = auth.uid()
      AND pr.role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Access denied: only business owners can view compensation';
  END IF;

  RETURN QUERY
  SELECT p.compensation_type, p.commission_percentage, p.salary_cents
  FROM public.professionals p
  WHERE p.id = _professional_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_professional_compensation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_professional_compensation(uuid) TO authenticated;
