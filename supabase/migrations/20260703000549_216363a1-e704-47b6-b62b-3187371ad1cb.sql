
DROP POLICY IF EXISTS "staff can read messages" ON public.team_messages;
DROP POLICY IF EXISTS "staff can send messages" ON public.team_messages;
CREATE POLICY "authenticated can read messages" ON public.team_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can send messages" ON public.team_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
