
-- 1. Alter professionals: add compensation fields
ALTER TABLE public.professionals
  ADD COLUMN compensation_type text NOT NULL DEFAULT 'percentage' CHECK (compensation_type IN ('percentage', 'salary')),
  ADD COLUMN commission_percentage numeric CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  ADD COLUMN salary_cents integer CHECK (salary_cents >= 0);

-- 2. Service executions (records when appointment is marked done)
CREATE TABLE public.service_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  professional_id uuid NOT NULL REFERENCES public.professionals(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  service_id uuid NOT NULL REFERENCES public.services(id),
  appointment_id uuid REFERENCES public.appointments(id),
  performed_at timestamptz NOT NULL DEFAULT now(),
  service_price_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view service_executions" ON public.service_executions FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Members can create service_executions" ON public.service_executions FOR INSERT WITH CHECK (is_business_member(business_id));
CREATE POLICY "Members can update service_executions" ON public.service_executions FOR UPDATE USING (is_business_member(business_id));
CREATE POLICY "Members can delete service_executions" ON public.service_executions FOR DELETE USING (is_business_member(business_id));

-- 3. Products
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  name text NOT NULL,
  stock_qty integer NOT NULL DEFAULT 0,
  price_cents integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view products" ON public.products FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Members can create products" ON public.products FOR INSERT WITH CHECK (is_business_member(business_id));
CREATE POLICY "Members can update products" ON public.products FOR UPDATE USING (is_business_member(business_id));
CREATE POLICY "Members can delete products" ON public.products FOR DELETE USING (is_business_member(business_id));

-- 4. Product movements
CREATE TABLE public.product_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  type text NOT NULL CHECK (type IN ('sale', 'consumption', 'adjustment')),
  qty integer NOT NULL CHECK (qty > 0),
  unit_price_cents integer,
  total_cents integer,
  client_id uuid REFERENCES public.clients(id),
  appointment_id uuid REFERENCES public.appointments(id),
  buyer_name text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view product_movements" ON public.product_movements FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Members can create product_movements" ON public.product_movements FOR INSERT WITH CHECK (is_business_member(business_id));
CREATE POLICY "Members can update product_movements" ON public.product_movements FOR UPDATE USING (is_business_member(business_id));
CREATE POLICY "Members can delete product_movements" ON public.product_movements FOR DELETE USING (is_business_member(business_id));

-- 5. Finance access (password-protected)
CREATE TABLE public.finance_access (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id),
  name text NOT NULL,
  password_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view finance_access" ON public.finance_access FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Members can insert finance_access" ON public.finance_access FOR INSERT WITH CHECK (is_business_member(business_id));
CREATE POLICY "Members can update finance_access" ON public.finance_access FOR UPDATE USING (is_business_member(business_id));

-- 6. Anti-furo policies
CREATE TABLE public.antifuro_policies (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id),
  policy_type text NOT NULL DEFAULT 'confirmation_only' CHECK (policy_type IN ('none', 'fixed_deposit', 'percentage_deposit', 'confirmation_only')),
  deposit_value_cents integer,
  deposit_percentage numeric,
  confirmation_hours integer DEFAULT 24,
  reminder_hours integer DEFAULT 2,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.antifuro_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view antifuro" ON public.antifuro_policies FOR SELECT USING (is_business_member(business_id));
CREATE POLICY "Members can insert antifuro" ON public.antifuro_policies FOR INSERT WITH CHECK (is_business_member(business_id));
CREATE POLICY "Members can update antifuro" ON public.antifuro_policies FOR UPDATE USING (is_business_member(business_id));

-- 7. Trigger: auto-create service_execution when appointment becomes 'done'
CREATE OR REPLACE FUNCTION public.handle_appointment_done()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    INSERT INTO public.service_executions (business_id, professional_id, client_id, service_id, appointment_id, performed_at, service_price_cents)
    SELECT NEW.business_id, NEW.professional_id, NEW.client_id, NEW.service_id, NEW.id, NEW.starts_at, s.price_cents
    FROM public.services s WHERE s.id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_appointment_done
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_appointment_done();

-- 8. Function to decrease product stock on movement
CREATE OR REPLACE FUNCTION public.handle_product_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_stock integer;
BEGIN
  IF NEW.type IN ('sale', 'consumption') THEN
    SELECT stock_qty INTO current_stock FROM public.products WHERE id = NEW.product_id;
    IF current_stock < NEW.qty THEN
      RAISE EXCEPTION 'Estoque insuficiente. Disponivel: %, solicitado: %', current_stock, NEW.qty;
    END IF;
    UPDATE public.products SET stock_qty = stock_qty - NEW.qty WHERE id = NEW.product_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE public.products SET stock_qty = stock_qty + NEW.qty WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_product_movement
  AFTER INSERT ON public.product_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_product_movement();
