ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS acesso_valido_ate TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS mp_payer_email TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_payment_id ON public.subscriptions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval_id ON public.subscriptions(mp_preapproval_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_acesso_valido_ate ON public.subscriptions(acesso_valido_ate);