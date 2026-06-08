
CREATE TABLE public.team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.team_messages TO authenticated;
GRANT ALL ON public.team_messages TO service_role;

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff can read messages"
  ON public.team_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'employee'));

CREATE POLICY "staff can send messages"
  ON public.team_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'employee'))
  );

CREATE POLICY "sender or admin can delete"
  ON public.team_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX team_messages_created_at_idx ON public.team_messages (created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
