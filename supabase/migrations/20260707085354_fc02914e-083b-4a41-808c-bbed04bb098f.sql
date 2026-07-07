ALTER TABLE public.bot_settings ADD COLUMN IF NOT EXISTS show_suggested_questions boolean NOT NULL DEFAULT true;
NOTIFY pgrst, 'reload schema';