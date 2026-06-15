DROP POLICY IF EXISTS "Approved projects are public" ON public.projects;

CREATE POLICY "Approved projects visible to visitors"
ON public.projects FOR SELECT
TO anon
USING (admin_approval = 'approved');