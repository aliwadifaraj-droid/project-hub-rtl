CREATE TABLE public.vip_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_subscribers TO authenticated;
GRANT INSERT ON public.vip_subscribers TO anon;
GRANT ALL ON public.vip_subscribers TO service_role;
ALTER TABLE public.vip_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can subscribe" ON public.vip_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins manage" ON public.vip_subscribers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));