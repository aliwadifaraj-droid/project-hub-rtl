
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable by all" ON public.site_settings FOR SELECT USING (true);
INSERT INTO public.site_settings(key, value) VALUES ('vip_maintenance', '{"enabled": false}'::jsonb) ON CONFLICT (key) DO NOTHING;
