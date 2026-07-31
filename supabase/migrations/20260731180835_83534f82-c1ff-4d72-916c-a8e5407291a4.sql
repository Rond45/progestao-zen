ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;

DROP POLICY IF EXISTS "logos_select_members" ON storage.objects;
DROP POLICY IF EXISTS "logos_insert_owner" ON storage.objects;
DROP POLICY IF EXISTS "logos_update_owner" ON storage.objects;
DROP POLICY IF EXISTS "logos_delete_owner" ON storage.objects;

CREATE POLICY "logos_select_members" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'logos'
  AND public.is_business_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "logos_insert_owner" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'owner'
      AND p.business_id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "logos_update_owner" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'owner'
      AND p.business_id = ((storage.foldername(name))[1])::uuid
  )
)
WITH CHECK (
  bucket_id = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'owner'
      AND p.business_id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "logos_delete_owner" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'owner'
      AND p.business_id = ((storage.foldername(name))[1])::uuid
  )
);