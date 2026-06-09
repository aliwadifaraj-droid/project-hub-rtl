
-- Staff can upload ads images
CREATE POLICY "Staff upload ads images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-images'
    AND (storage.foldername(name))[1] = 'ads'
    AND (public.has_role(auth.uid(), 'admin'::public.app_role)
         OR public.has_role(auth.uid(), 'employee'::public.app_role))
  );

CREATE POLICY "Staff update ads images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-images'
    AND (storage.foldername(name))[1] = 'ads'
    AND (public.has_role(auth.uid(), 'admin'::public.app_role)
         OR public.has_role(auth.uid(), 'employee'::public.app_role))
  );

CREATE POLICY "Staff delete ads images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-images'
    AND (storage.foldername(name))[1] = 'ads'
    AND (public.has_role(auth.uid(), 'admin'::public.app_role)
         OR public.has_role(auth.uid(), 'employee'::public.app_role))
  );

-- Anonymous visitors can upload submission images
CREATE POLICY "Public upload submissions images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'project-images'
    AND (storage.foldername(name))[1] = 'submissions'
  );
