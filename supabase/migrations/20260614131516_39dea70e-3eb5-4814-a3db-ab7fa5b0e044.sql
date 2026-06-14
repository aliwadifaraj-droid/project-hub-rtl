DROP POLICY IF EXISTS "anyone read comments on approved ads" ON public.ad_comments;
DROP POLICY IF EXISTS "Public upload submissions images" ON storage.objects;
CREATE POLICY "Authenticated upload submissions images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-images' AND (storage.foldername(name))[1] = 'submissions');