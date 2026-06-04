
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Request status
CREATE TYPE public.request_status AS ENUM ('new', 'reviewing', 'accepted', 'rejected');
ALTER TABLE public.project_requests
  ADD COLUMN status public.request_status NOT NULL DEFAULT 'new',
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Allow public to search project_requests by company name (read-only)
CREATE POLICY "Public can view requests" ON public.project_requests
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.project_requests TO anon;

-- Staff can update status
CREATE POLICY "Staff can update requests" ON public.project_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'employee'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'employee'));

CREATE POLICY "Admins delete requests" ON public.project_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin CRUD on projects
CREATE POLICY "Admins insert projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete projects" ON public.projects
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view contact messages
CREATE POLICY "Staff view contact messages" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'employee'));

-- Storage policies for bid-pdfs: staff can read; anyone can upload (already public insert? bucket is private)
CREATE POLICY "Public can upload bids"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'bid-pdfs');
CREATE POLICY "Staff can read bids"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'bid-pdfs'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'employee'))
  );

-- Storage for project images bucket (create public bucket via tool; here just policies fallback)
-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_project_requests_updated_at
  BEFORE UPDATE ON public.project_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
