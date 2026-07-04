
CREATE POLICY "Autenticados leem imagens de anuncios"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'anuncios');

CREATE POLICY "Admin envia imagens de anuncios"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'anuncios' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admin atualiza imagens de anuncios"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'anuncios' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admin exclui imagens de anuncios"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'anuncios' AND public.has_role(auth.uid(),'admin'));
