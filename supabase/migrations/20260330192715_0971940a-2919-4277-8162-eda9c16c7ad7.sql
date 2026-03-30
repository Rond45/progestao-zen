
ALTER TABLE public.whatsapp_connections
  ADD COLUMN IF NOT EXISTS evolution_api_url text,
  ADD COLUMN IF NOT EXISTS evolution_api_key text,
  ADD COLUMN IF NOT EXISTS instance_name text,
  ADD COLUMN IF NOT EXISTS openai_api_key text,
  ADD COLUMN IF NOT EXISTS openai_model text DEFAULT 'gpt-4o-mini',
  ADD COLUMN IF NOT EXISTS system_prompt text DEFAULT 'Você é um atendente virtual simpático e profissional. Responda sempre em português brasileiro, seja cordial e objetivo. Você pode verificar horários disponíveis, fazer agendamentos e informar sobre serviços e preços. Nunca invente informações que não foram fornecidas.',
  ADD COLUMN IF NOT EXISTS working_hours text,
  ADD COLUMN IF NOT EXISTS services_info text,
  ADD COLUMN IF NOT EXISTS qr_code text;
