
REVOKE SELECT ON public.finance_access FROM authenticated, anon;
GRANT SELECT (business_id, name, updated_at) ON public.finance_access TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.finance_access TO authenticated;
GRANT ALL ON public.finance_access TO service_role;
