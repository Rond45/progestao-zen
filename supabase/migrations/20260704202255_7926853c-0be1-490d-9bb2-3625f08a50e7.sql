
-- Bloco 3: Anúncios (popups)
CREATE TABLE public.anuncios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  imagem_url text NOT NULL,
  link_checkout text,
  segmento text NOT NULL CHECK (segmento IN ('barbearia','salao','ambos')),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.anuncios TO authenticated;
GRANT ALL ON public.anuncios TO service_role;
ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem anuncios ativos"
  ON public.anuncios FOR SELECT TO authenticated
  USING (ativo = true);
CREATE POLICY "Admin gerencia anuncios"
  ON public.anuncios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_anuncios_updated_at
  BEFORE UPDATE ON public.anuncios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bloco 5: Avisos globais
CREATE TABLE public.avisos_globais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem text NOT NULL,
  tipo text NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','alerta')),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.avisos_globais TO authenticated;
GRANT ALL ON public.avisos_globais TO service_role;
ALTER TABLE public.avisos_globais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados leem avisos ativos"
  ON public.avisos_globais FOR SELECT TO authenticated
  USING (ativo = true);
CREATE POLICY "Admin gerencia avisos"
  ON public.avisos_globais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_avisos_globais_updated_at
  BEFORE UPDATE ON public.avisos_globais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bloco 6: Permitir leitura pública de configuração de planos (chaves plan_*)
GRANT SELECT ON public.platform_config TO anon, authenticated;
CREATE POLICY "Publico le configuracoes de planos"
  ON public.platform_config FOR SELECT
  USING (key LIKE 'plan_%');
