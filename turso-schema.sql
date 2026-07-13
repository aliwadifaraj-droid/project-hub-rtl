-- Turso schema for tables migrated from Supabase.
-- Run this once against your Turso database (via `turso db shell <db>` or the web UI).
-- Auth-owned tables (auth.users, user_roles, profiles) STAY in Supabase.
-- Storage buckets STAY in Supabase.

-- ============ projects ============
CREATE TABLE IF NOT EXISTS projects (
  id           TEXT PRIMARY KEY,        -- uuid string
  name         TEXT NOT NULL,
  description  TEXT,
  location     TEXT,
  cover_url    TEXT,
  domain       TEXT,
  status       TEXT NOT NULL DEFAULT 'open',  -- open | delivered | canceled
  owner_id     TEXT,                    -- Supabase auth.users.id (uuid string)
  ad_id        TEXT,
  approved     INTEGER NOT NULL DEFAULT 0,
  rejected     INTEGER NOT NULL DEFAULT 0,
  reject_reason TEXT,
  metadata     TEXT,                    -- JSON stringified
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_owner   ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status  ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_approved ON projects(approved);

-- ============ bot_qa ============
CREATE TABLE IF NOT EXISTS bot_qa (
  id         TEXT PRIMARY KEY,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  keywords   TEXT NOT NULL DEFAULT '[]',   -- JSON array
  is_active  INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  action     TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ bot_settings (singleton) ============
CREATE TABLE IF NOT EXISTS bot_settings (
  id                          TEXT PRIMARY KEY,
  singleton                   INTEGER NOT NULL DEFAULT 1 UNIQUE,
  work_days                   TEXT NOT NULL DEFAULT '{"sun":true,"mon":true,"tue":true,"wed":true,"thu":true,"fri":false,"sat":false}',
  work_start                  TEXT NOT NULL DEFAULT '09:00:00',
  work_end                    TEXT NOT NULL DEFAULT '17:00:00',
  off_hours_message           TEXT NOT NULL DEFAULT '',
  fallback_message            TEXT NOT NULL DEFAULT '',
  allow_escalation            INTEGER NOT NULL DEFAULT 1,
  show_suggested_questions    INTEGER NOT NULL DEFAULT 1,
  local_enabled               INTEGER NOT NULL DEFAULT 1,
  local_system_prompt         TEXT NOT NULL DEFAULT '',
  groq_enabled                INTEGER NOT NULL DEFAULT 1,
  gemini_system_instruction   TEXT NOT NULL DEFAULT '',
  gemini_dialect              TEXT NOT NULL DEFAULT 'سعودي',
  gemini_bot_name             TEXT NOT NULL DEFAULT 'مساعد',
  gemini_blocked_replies      TEXT NOT NULL DEFAULT '[]',
  gemini_scope                TEXT NOT NULL DEFAULT '',
  created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ messages (generic messaging) ============
CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  from_user  TEXT,
  to_user    TEXT,
  body       TEXT NOT NULL,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ team_messages ============
CREATE TABLE IF NOT EXISTS team_messages (
  id         TEXT PRIMARY KEY,
  author_id  TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ notifications ============
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- ============ vip_subscribers ============
CREATE TABLE IF NOT EXISTS vip_subscribers (
  id             TEXT PRIMARY KEY,
  user_id        TEXT,
  email          TEXT,
  plan           TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  receipt_url    TEXT,
  starts_at      TEXT,
  expires_at     TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vip_user ON vip_subscribers(user_id);

-- ============ support_chats ============
CREATE TABLE IF NOT EXISTS support_chats (
  id            TEXT PRIMARY KEY,
  visitor_id    TEXT,
  user_id       TEXT,
  status        TEXT NOT NULL DEFAULT 'open',
  assigned_to   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ support_messages ============
CREATE TABLE IF NOT EXISTS support_messages (
  id         TEXT PRIMARY KEY,
  chat_id    TEXT NOT NULL,
  sender     TEXT NOT NULL,   -- visitor | bot | agent
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_support_messages_chat ON support_messages(chat_id, created_at);

-- ============ profiles ============
-- NOTE: The `profiles` row is created and secured via Supabase Auth triggers.
-- We keep a synced copy here only if you plan to read profile fields via db.execute().
-- Left OUT by default — read profiles through Supabase.
