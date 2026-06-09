ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ads;
ALTER TABLE public.ads REPLICA IDENTITY FULL;