GRANT INSERT ON public.vip_subscribers TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.vip_subscribers TO authenticated;
GRANT ALL ON public.vip_subscribers TO service_role;