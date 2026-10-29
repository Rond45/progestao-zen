CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  language text NOT NULL DEFAULT 'pt_BR',
  category text NOT NULL DEFAULT 'UTILITY',
  body text NOT NULL,
  footer text,
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  meta_template_id text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.whatsapp_templates (name, category, language, body, footer, buttons, body_examples, status)
VALUES ('lembrete_agendamento_v1', 'UTILITY', 'pt_BR',
  'Olá, {{1}}! Passando para lembrar do seu horário na {{2}}: {{3}} às {{4}}, com {{5}}. Serviço: {{6}}. Você confirma sua presença?',
  'Lembrete automático do ProGestão+. Responda SAIR para parar.',
  '["Confirmar","Cancelar"]'::jsonb,
  '["Carlos","Barbearia do João","quinta-feira, 30/10","15:00","Pedro","Corte masculino"]'::jsonb,
  'draft')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  business_id uuid NOT NULL,
  to_phone text NOT NULL,
  kind text NOT NULL DEFAULT 'before',
  template_name text NOT NULL,
  provider_message_id text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz DEFAULT now(),
  response text,
  responded_at timestamptz,
  UNIQUE (appointment_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_business_sent ON public.appointment_reminders (business_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_phone ON public.appointment_reminders (to_phone, sent_at);
GRANT SELECT ON public.appointment_reminders TO authenticated;
GRANT ALL ON public.appointment_reminders TO service_role;
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view reminders" ON public.appointment_reminders
  FOR SELECT TO authenticated USING (public.is_business_member(business_id));

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS reminders_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS reminder_hours_before integer NOT NULL DEFAULT 24;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_reminder_hours_before_check CHECK (reminder_hours_before IN (2,4,24));
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS whatsapp_opt_out boolean NOT NULL DEFAULT false;

INSERT INTO public.platform_config (key, value) VALUES
  ('central_waba_id','1818756119040114'),
  ('reminder_cap_basico','100'),
  ('reminder_cap_pro','300'),
  ('reminder_cap_premium','600'),
  ('reminder_cap_free','30')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

CREATE OR REPLACE FUNCTION public.get_my_reminder_usage()
RETURNS TABLE(cap integer, sent integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _biz uuid;
  _plan text;
  _cap integer;
BEGIN
  SELECT business_id INTO _biz FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
  IF _biz IS NULL THEN RETURN; END IF;
  SELECT s.plan_name INTO _plan FROM public.profiles p JOIN public.subscriptions s ON s.user_id = p.user_id
    WHERE p.business_id = _biz AND p.role = 'owner' ORDER BY s.updated_at DESC LIMIT 1;
  SELECT NULLIF(value,'')::integer INTO _cap FROM public.platform_config WHERE key = 'reminder_cap_' || COALESCE(_plan,'free');
  RETURN QUERY SELECT COALESCE(_cap, 30),
    (SELECT count(*)::integer FROM public.appointment_reminders r
      WHERE r.business_id = _biz AND r.status = 'sent'
        AND r.sent_at >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_reminder_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_reminder_usage() TO authenticated;