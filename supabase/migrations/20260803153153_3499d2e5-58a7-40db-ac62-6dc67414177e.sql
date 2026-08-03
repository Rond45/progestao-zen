DROP POLICY IF EXISTS "logos_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "logos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "logos_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;

CREATE POLICY "logos_member_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'logos' AND public.is_business_member(((storage.foldername(name))[1])::uuid));

CREATE POLICY "logos_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos' AND public.is_business_owner(((storage.foldername(name))[1])::uuid));

CREATE POLICY "logos_owner_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'logos' AND public.is_business_owner(((storage.foldername(name))[1])::uuid))
WITH CHECK (bucket_id = 'logos' AND public.is_business_owner(((storage.foldername(name))[1])::uuid));

CREATE POLICY "logos_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos' AND public.is_business_owner(((storage.foldername(name))[1])::uuid));