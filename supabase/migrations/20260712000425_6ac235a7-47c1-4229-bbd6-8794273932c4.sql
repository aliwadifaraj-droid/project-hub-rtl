ALTER TABLE public.bot_settings
  ADD COLUMN IF NOT EXISTS local_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS groq_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS local_system_prompt text NOT NULL DEFAULT '';