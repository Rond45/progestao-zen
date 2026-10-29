ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS is_on_biz_app boolean NOT NULL DEFAULT false;
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS phone_number text;