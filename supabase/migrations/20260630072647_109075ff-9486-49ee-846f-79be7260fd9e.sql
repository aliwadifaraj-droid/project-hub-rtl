GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='site_settings_pkey') THEN
    ALTER TABLE public.site_settings ADD PRIMARY KEY (key);
  END IF;
END $$;

DROP POLICY IF EXISTS "admins manage settings" ON public.site_settings;
CREATE POLICY "admins manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));