DROP POLICY IF EXISTS "Public can upload bids" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload bid PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can create project requests" ON public.project_requests;
DROP POLICY IF EXISTS "Public can create project requests" ON public.project_requests;
DROP POLICY IF EXISTS "Public can insert project requests" ON public.project_requests;