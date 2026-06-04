
DROP POLICY IF EXISTS "Public can view requests" ON public.project_requests;

CREATE POLICY "Staff view requests" ON public.project_requests
FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'employee'::app_role));

CREATE POLICY "Staff update bid pdfs" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id='bid-pdfs' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'employee'::app_role)))
WITH CHECK (bucket_id='bid-pdfs' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'employee'::app_role)));

CREATE POLICY "Staff delete bid pdfs" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id='bid-pdfs' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'employee'::app_role)));
