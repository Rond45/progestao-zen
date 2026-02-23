-- Migration: Criar tabela de assinaturas Stripe
-- Data: 2026-02-23

-- Tabela principal de assinaturas
create table if not exists public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    stripe_customer_id text unique,
    stripe_subscription_id text unique,
    stripe_price_id text,
    plan_name text check (plan_name in ('basico', 'pro', 'premium')),
    status text check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')) default 'incomplete',
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean default false,
    canceled_at timestamptz,
    trial_end timestamptz,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
  );

-- Habilitar RLS
alter table public.subscriptions enable row level security;

-- Policies: usuário só vê/edita a própria assinatura
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (true)
  with check (true);

-- Index para busca rápida por user_id
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);

-- Trigger para atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();
