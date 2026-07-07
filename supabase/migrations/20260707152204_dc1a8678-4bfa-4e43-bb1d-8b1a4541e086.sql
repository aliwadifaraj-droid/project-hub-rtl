ALTER TABLE public.bot_qa ADD COLUMN IF NOT EXISTS action text NOT NULL DEFAULT 'none' CHECK (action IN ('none','escalate'));
NOTIFY pgrst, 'reload schema';