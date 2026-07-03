
-- A) Usuários sem assinatura recebem trial de 14 dias
INSERT INTO public.subscriptions (user_id, status, acesso_valido_ate)
SELECT u.id, 'trialing', now() + interval '14 days'
FROM auth.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id
WHERE s.id IS NULL
ON CONFLICT DO NOTHING;

-- B) Assinaturas em estado incompleto e sem pagamento real viram trial
UPDATE public.subscriptions
SET status = 'trialing',
    acesso_valido_ate = now() + interval '14 days',
    updated_at = now()
WHERE status IN ('incomplete', 'incomplete_expired', 'bloqueado', 'canceled', 'cancelled')
  AND metodo_pagamento IS NULL
  AND (mp_payment_id IS NULL OR mp_payment_id = '')
  AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '');
