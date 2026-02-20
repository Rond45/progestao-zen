
-- App role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'professional', 'reception');

-- Appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'cancelled', 'done');

-- Business vertical enum
CREATE TYPE public.business_vertical AS ENUM ('barbearia', 'salao');

-- 1. businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vertical public.business_vertical NOT NULL DEFAULT 'barbearia',
  phone TEXT,
  address TEXT,
  opening_time TIME DEFAULT '09:00',
  closing_time TIME DEFAULT '19:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. professionals
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  price_cents INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. WhatsApp tables (prepared, not connected yet)
CREATE TABLE public.whatsapp_connections (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'disconnected',
  phone_number TEXT,
  phone_number_id TEXT,
  waba_id TEXT,
  connected_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  from_phone TEXT,
  to_phone TEXT,
  body TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function: get business_id for current user
CREATE OR REPLACE FUNCTION public.get_current_business_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Helper function: check if user is member of a business
CREATE OR REPLACE FUNCTION public.is_business_member(_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND business_id = _business_id
  )
$$;

-- Trigger for updated_at on appointments
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON public.whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointment conflict check function
CREATE OR REPLACE FUNCTION public.check_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE professional_id = NEW.professional_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND status NOT IN ('cancelled')
      AND starts_at < NEW.ends_at
      AND ends_at > NEW.starts_at
  ) THEN
    RAISE EXCEPTION 'Conflito de horario: este profissional ja possui agendamento neste periodo.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_appointment_conflict_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.check_appointment_conflict();

-- Auto-create profile + business on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_business_id UUID;
BEGIN
  INSERT INTO public.businesses (name, vertical) VALUES ('Meu Negocio', 'barbearia') RETURNING id INTO new_business_id;
  INSERT INTO public.profiles (user_id, business_id, name, role) VALUES (NEW.id, new_business_id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'), 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS: businesses
CREATE POLICY "Users can view own business" ON public.businesses FOR SELECT USING (public.is_business_member(id));
CREATE POLICY "Users can update own business" ON public.businesses FOR UPDATE USING (public.is_business_member(id));

-- RLS: profiles
CREATE POLICY "Users can view profiles in business" ON public.profiles FOR SELECT USING (public.is_business_member(business_id));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- RLS: clients
CREATE POLICY "Members can view clients" ON public.clients FOR SELECT USING (public.is_business_member(business_id));
CREATE POLICY "Members can create clients" ON public.clients FOR INSERT WITH CHECK (public.is_business_member(business_id));
CREATE POLICY "Members can update clients" ON public.clients FOR UPDATE USING (public.is_business_member(business_id));
CREATE POLICY "Members can delete clients" ON public.clients FOR DELETE USING (public.is_business_member(business_id));

-- RLS: professionals
CREATE POLICY "Members can view professionals" ON public.professionals FOR SELECT USING (public.is_business_member(business_id));
CREATE POLICY "Members can create professionals" ON public.professionals FOR INSERT WITH CHECK (public.is_business_member(business_id));
CREATE POLICY "Members can update professionals" ON public.professionals FOR UPDATE USING (public.is_business_member(business_id));
CREATE POLICY "Members can delete professionals" ON public.professionals FOR DELETE USING (public.is_business_member(business_id));

-- RLS: services
CREATE POLICY "Members can view services" ON public.services FOR SELECT USING (public.is_business_member(business_id));
CREATE POLICY "Members can create services" ON public.services FOR INSERT WITH CHECK (public.is_business_member(business_id));
CREATE POLICY "Members can update services" ON public.services FOR UPDATE USING (public.is_business_member(business_id));
CREATE POLICY "Members can delete services" ON public.services FOR DELETE USING (public.is_business_member(business_id));

-- RLS: appointments
CREATE POLICY "Members can view appointments" ON public.appointments FOR SELECT USING (public.is_business_member(business_id));
CREATE POLICY "Members can create appointments" ON public.appointments FOR INSERT WITH CHECK (public.is_business_member(business_id));
CREATE POLICY "Members can update appointments" ON public.appointments FOR UPDATE USING (public.is_business_member(business_id));
CREATE POLICY "Members can delete appointments" ON public.appointments FOR DELETE USING (public.is_business_member(business_id));

-- RLS: whatsapp
CREATE POLICY "Members can view whatsapp" ON public.whatsapp_connections FOR SELECT USING (public.is_business_member(business_id));
CREATE POLICY "Members can update whatsapp" ON public.whatsapp_connections FOR UPDATE USING (public.is_business_member(business_id));
CREATE POLICY "Members can insert whatsapp" ON public.whatsapp_connections FOR INSERT WITH CHECK (public.is_business_member(business_id));

-- RLS: conversations
CREATE POLICY "Members can view conversations" ON public.conversations FOR SELECT USING (public.is_business_member(business_id));
CREATE POLICY "Members can create conversations" ON public.conversations FOR INSERT WITH CHECK (public.is_business_member(business_id));
CREATE POLICY "Members can update conversations" ON public.conversations FOR UPDATE USING (public.is_business_member(business_id));

-- RLS: messages
CREATE POLICY "Members can view messages" ON public.messages FOR SELECT USING (public.is_business_member(business_id));
CREATE POLICY "Members can create messages" ON public.messages FOR INSERT WITH CHECK (public.is_business_member(business_id));
