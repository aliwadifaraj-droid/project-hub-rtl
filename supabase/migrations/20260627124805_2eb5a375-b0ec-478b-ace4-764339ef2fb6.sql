
ALTER TABLE public.vip_subscribers
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Allow anyone (anon/auth) to upload into vip-receipts bucket
DROP POLICY IF EXISTS "vip receipts upload" ON storage.objects;
CREATE POLICY "vip receipts upload"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'vip-receipts');

DROP POLICY IF EXISTS "vip receipts admin read" ON storage.objects;
CREATE POLICY "vip receipts admin read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vip-receipts' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "vip receipts admin delete" ON storage.objects;
CREATE POLICY "vip receipts admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vip-receipts' AND public.has_role(auth.uid(), 'admin'::app_role));
