
ALTER TABLE public.bot_settings
  ADD COLUMN IF NOT EXISTS gemini_system_instruction text NOT NULL DEFAULT 'أنت مساعد دعم لمنصة العمران. رد باللهجة السعودية، ودود ومختصر جدًا (سطر أو سطرين). لا تخترع معلومات.',
  ADD COLUMN IF NOT EXISTS gemini_dialect text NOT NULL DEFAULT 'سعودي',
  ADD COLUMN IF NOT EXISTS gemini_bot_name text NOT NULL DEFAULT 'مساعد العمران',
  ADD COLUMN IF NOT EXISTS gemini_blocked_replies text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS gemini_scope text NOT NULL DEFAULT 'الرد على أسئلة العملاء المتعلقة بمنصة العمران والمشاريع فقط.';
