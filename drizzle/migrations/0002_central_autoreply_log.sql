CREATE TABLE public.central_autoreply_log (phone text PRIMARY KEY, last_sent_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.central_autoreply_log TO service_role;
ALTER TABLE public.central_autoreply_log ENABLE ROW LEVEL SECURITY;