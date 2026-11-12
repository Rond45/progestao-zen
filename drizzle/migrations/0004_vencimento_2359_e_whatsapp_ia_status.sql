CREATE OR REPLACE FUNCTION public.normalize_acesso_valido_ate()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.acesso_valido_ate IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.acesso_valido_ate IS DISTINCT FROM OLD.acesso_valido_ate) THEN
    NEW.acesso_valido_ate := ((NEW.acesso_valido_ate AT TIME ZONE 'America/Sao_Paulo')::date + time '23:59:00') AT TIME ZONE 'America/Sao_Paulo';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.normalize_acesso_valido_ate() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER normalize_acesso_valido_ate_trigger
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.normalize_acesso_valido_ate();

INSERT INTO public.platform_config (key, value) VALUES ('whatsapp_ia_disponivel_em', '') ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.whatsapp_ia_status()
RETURNS TABLE(habilitado boolean, disponivel_em date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT
    COALESCE((SELECT value = 'true' FROM public.platform_config WHERE key = 'whatsapp_connect_enabled' LIMIT 1), false),
    (SELECT CASE WHEN value ~ '^\d{4}-\d{2}-\d{2}$' THEN value::date ELSE NULL END FROM public.platform_config WHERE key = 'whatsapp_ia_disponivel_em' LIMIT 1);
$$;
REVOKE EXECUTE ON FUNCTION public.whatsapp_ia_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.whatsapp_ia_status() TO authenticated;