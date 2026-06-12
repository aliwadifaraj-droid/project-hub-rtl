
-- Add domain to ads
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS domain text;

-- Add owner + domain + source ad to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL;

-- Relax not-null constraints (auto-created from ads may lack these)
ALTER TABLE public.projects ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN location DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN duration DROP NOT NULL;
ALTER TABLE public.projects ALTER COLUMN cover_image DROP NOT NULL;

-- Owners can delete their own projects (in addition to admin policy)
DROP POLICY IF EXISTS "Owners delete their projects" ON public.projects;
CREATE POLICY "Owners delete their projects" ON public.projects
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Owners can read their own (already public-readable, but keep)
-- Owners can delete their own ads (in addition to admin policy)
DROP POLICY IF EXISTS "Owners delete their ads" ON public.ads;
CREATE POLICY "Owners delete their ads" ON public.ads
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Owners can read their own ads regardless of status
DROP POLICY IF EXISTS "Owners read their ads" ON public.ads;
CREATE POLICY "Owners read their ads" ON public.ads
  FOR SELECT TO authenticated USING (auth.uid() = created_by);
