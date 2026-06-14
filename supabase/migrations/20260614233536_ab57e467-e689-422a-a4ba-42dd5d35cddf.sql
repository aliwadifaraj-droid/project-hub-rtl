
-- 1) projects: admin_approval + created_by
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS admin_approval text NOT NULL DEFAULT 'pending'
    CHECK (admin_approval IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- existing rows are approved
UPDATE public.projects SET admin_approval = 'approved' WHERE admin_approval = 'pending' AND created_at < now();

-- replace public SELECT policy to hide pending/rejected from public
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;
CREATE POLICY "Approved projects are public"
  ON public.projects FOR SELECT
  USING (admin_approval = 'approved');
CREATE POLICY "Creator can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = owner_id);
CREATE POLICY "Admins view all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- allow employees (any authenticated) to insert their own pending project
DROP POLICY IF EXISTS "Employees insert pending projects" ON public.projects;
CREATE POLICY "Employees insert pending projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- 2) notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
