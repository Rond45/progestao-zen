
REVOKE SELECT ON public.finance_access FROM authenticated;
REVOKE SELECT ON public.finance_access FROM anon;
GRANT SELECT (business_id, name, updated_at) ON public.finance_access TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_finance_access(_business_id uuid, _name text, _password text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.finance_access fa
    WHERE fa.business_id = _business_id
      AND fa.name = _name
      AND fa.password_hash = _password
      AND public.is_business_member(_business_id)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.verify_finance_access(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_finance_access(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.verify_finance_access(uuid, text, text) TO authenticated;
