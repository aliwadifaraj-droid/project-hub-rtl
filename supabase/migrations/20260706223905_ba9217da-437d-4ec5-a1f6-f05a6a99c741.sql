CREATE TABLE public.bot_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  work_days JSONB NOT NULL DEFAULT '{"sun":true,"mon":true,"tue":true,"wed":true,"thu":true,"fri":false,"sat":false}'::jsonb,
  work_start TIME NOT NULL DEFAULT '09:00',
  work_end TIME NOT NULL DEFAULT '17:00',
  off_hours_message TEXT NOT NULL DEFAULT 'نحن خارج ساعات العمل حالياً. سنرد عليك في أقرب وقت.',
  allow_escalation BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bot_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.bot_settings TO authenticated;
GRANT ALL ON public.bot_settings TO service_role;

ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bot settings" ON public.bot_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert bot settings" ON public.bot_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update bot settings" ON public.bot_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_bot_settings_updated_at BEFORE UPDATE ON public.bot_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.bot_settings (singleton) VALUES (true) ON CONFLICT DO NOTHING;
