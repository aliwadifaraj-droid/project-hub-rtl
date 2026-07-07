CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS TABLE(size_bytes bigint, size_pretty text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY SELECT pg_database_size(current_database())::bigint, pg_size_pretty(pg_database_size(current_database()));
END;
$$;

REVOKE ALL ON FUNCTION public.get_database_size() FROM public;
GRANT EXECUTE ON FUNCTION public.get_database_size() TO authenticated;