
CREATE TABLE public.aceites_legais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  versao_termos text NOT NULL,
  versao_privacidade text NOT NULL,
  data_aceite timestamptz NOT NULL DEFAULT now(),
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.aceites_legais TO authenticated;
GRANT ALL ON public.aceites_legais TO service_role;
ALTER TABLE public.aceites_legais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own aceites" ON public.aceites_legais FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own aceites" ON public.aceites_legais FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
