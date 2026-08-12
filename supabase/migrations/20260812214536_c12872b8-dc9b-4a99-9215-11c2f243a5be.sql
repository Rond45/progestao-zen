ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS access_token TEXT;

REVOKE SELECT (access_token) ON public.whatsapp_connections FROM anon, authenticated;