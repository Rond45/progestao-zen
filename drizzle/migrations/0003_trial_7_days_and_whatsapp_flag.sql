CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_business_id UUID;
BEGIN
  INSERT INTO public.businesses (name, vertical) VALUES ('Meu Negocio', 'barbearia') RETURNING id INTO new_business_id;
  INSERT INTO public.profiles (user_id, business_id, name, role) VALUES (NEW.id, new_business_id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'), 'owner');
  INSERT INTO public.subscriptions (user_id, status, acesso_valido_ate)
  VALUES (NEW.id, 'trialing', now() + interval '7 days')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

INSERT INTO public.platform_config (key, value) VALUES ('whatsapp_connect_enabled', 'false') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.whatsapp_connect_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT value = 'true' FROM public.platform_config WHERE key = 'whatsapp_connect_enabled' LIMIT 1), false)
$$;

REVOKE EXECUTE ON FUNCTION public.whatsapp_connect_enabled() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.whatsapp_connect_enabled() TO authenticated;