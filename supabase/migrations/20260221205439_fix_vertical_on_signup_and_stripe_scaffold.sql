-- Fix: set business vertical based on signup metadata (2 em 1 real)
-- This updates the trigger function that creates a business/profile when a user is created.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_business_id UUID;
  v public.business_vertical;
BEGIN
  -- vertical comes from auth.users.raw_user_meta_data->>'vertical'
  -- fallback: barbearia
  v := COALESCE(NULLIF(NEW.raw_user_meta_data->>'vertical','')::public.business_vertical, 'barbearia');

  INSERT INTO public.businesses (name, vertical)
  VALUES ('Meu Negócio', v)
  RETURNING id INTO new_business_id;

  INSERT INTO public.profiles (user_id, business_id, name, role)
  VALUES (
    NEW.id,
    new_business_id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: Stripe subscription scaffolding will be added in a dedicated migration
-- once Stripe keys/priceIds are ready.
