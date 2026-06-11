CREATE TABLE public.ad_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  contact text,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ad_comments_ad_id_idx ON public.ad_comments(ad_id, created_at DESC);
GRANT SELECT, INSERT ON public.ad_comments TO anon, authenticated;
GRANT ALL ON public.ad_comments TO service_role;
ALTER TABLE public.ad_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read comments on approved ads" ON public.ad_comments
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_id AND a.status = 'approved'));
CREATE POLICY "staff read all comments" ON public.ad_comments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'employee'));
CREATE POLICY "anyone insert comment" ON public.ad_comments
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin delete comments" ON public.ad_comments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));