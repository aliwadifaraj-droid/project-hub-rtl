GRANT SELECT ON public.bot_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_settings TO authenticated;
GRANT ALL ON public.bot_settings TO service_role;
NOTIFY pgrst, 'reload schema';