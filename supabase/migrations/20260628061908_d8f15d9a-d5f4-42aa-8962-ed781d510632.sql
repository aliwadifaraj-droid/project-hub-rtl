GRANT INSERT ON public.vip_subscribers TO anon;
GRANT INSERT ON public.vip_subscribers TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.vip_subscribers TO authenticated;
GRANT ALL ON public.vip_subscribers TO service_role;
NOTIFY pgrst, 'reload schema';