
DO $$ BEGIN
  CREATE TYPE public.platform_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.platform_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.platform_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::public.platform_role));

DROP POLICY IF EXISTS "Admins manage roles insert" ON public.user_roles;
CREATE POLICY "Admins manage roles insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.platform_role));

DROP POLICY IF EXISTS "Admins manage roles update" ON public.user_roles;
CREATE POLICY "Admins manage roles update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.platform_role));

DROP POLICY IF EXISTS "Admins manage roles delete" ON public.user_roles;
CREATE POLICY "Admins manage roles delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.platform_role));

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.platform_role FROM auth.users WHERE email = 'rondineliprof@gmail.com'
ON CONFLICT DO NOTHING;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS working_hours jsonb;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS antifuro_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS antifuro_snapshot text;

CREATE OR REPLACE FUNCTION public.check_appointment_working_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wh jsonb;
  day_keys text[] := ARRAY['dom','seg','ter','qua','qui','sex','sab'];
  day_key text;
  day_cfg jsonb;
  open_t time;
  close_t time;
  start_local time;
  end_local time;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  SELECT working_hours INTO wh FROM public.businesses WHERE id = NEW.business_id;
  IF wh IS NULL THEN
    RETURN NEW;
  END IF;

  day_key := day_keys[ extract(dow from NEW.starts_at)::int + 1 ];
  day_cfg := wh -> day_key;
  IF day_cfg IS NULL OR (day_cfg->>'enabled')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Fora da jornada: o estabelecimento não atende neste dia.';
  END IF;

  open_t  := (day_cfg->>'open')::time;
  close_t := (day_cfg->>'close')::time;
  start_local := NEW.starts_at::time;
  end_local   := NEW.ends_at::time;

  IF start_local < open_t OR end_local > close_t THEN
    RAISE EXCEPTION 'Horário fora da jornada de trabalho configurada (% - %).', open_t, close_t;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_appointment_working_hours_trigger ON public.appointments;
CREATE TRIGGER check_appointment_working_hours_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.check_appointment_working_hours();
