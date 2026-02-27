
-- Add email and avatar_url to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for client avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('client-avatars', 'client-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client avatars
CREATE POLICY "Anyone can view client avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-avatars');

CREATE POLICY "Authenticated users can upload client avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update client avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'client-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete client avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'client-avatars' AND auth.role() = 'authenticated');
