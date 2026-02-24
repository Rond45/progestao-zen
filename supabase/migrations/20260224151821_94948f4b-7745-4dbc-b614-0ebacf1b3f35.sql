
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;
