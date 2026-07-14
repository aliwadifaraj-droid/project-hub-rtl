-- Turso schema. Run once against your Turso database.
-- Storage/Auth all live in Turso + Cloudflare R2. Supabase is no longer used.

-- ============ users (auth) ============
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============ user_roles ============
CREATE TABLE IF NOT EXISTS user_roles (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  role       TEXT NOT NULL,          -- 'admin' | 'moderator' | 'user' | ...
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- ============ profiles ============
CREATE TABLE IF NOT EXISTS profiles (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ roles (label lookup) ============
CREATE TABLE IF NOT EXISTS roles (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);

-- ============ files (R2 pointers) ============
CREATE TABLE IF NOT EXISTS files (
  id           TEXT PRIMARY KEY,
  r2_key       TEXT NOT NULL UNIQUE,
  filename     TEXT NOT NULL,
  mime         TEXT,
  size         INTEGER NOT NULL DEFAULT 0,
  purpose      TEXT,                    -- 'project-image' | 'bid-pdf' | 'vip-receipt' | 'other'
  uploaded_by  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_purpose ON files(purpose);

-- ============ projects ============
CREATE TABLE IF NOT EXISTS projects (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  description    TEXT,
  location       TEXT,
  duration       TEXT,
  cover_image    TEXT,
  images         TEXT NOT NULL DEFAULT '[]',   -- JSON array of file keys
  pdf_file       TEXT,
  created_by     TEXT,
  status         TEXT NOT NULL DEFAULT 'active',   -- active | delivered | cancelled
  admin_approval TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reject_reason  TEXT,
  metadata       TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_owner    ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status   ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_approval ON projects(admin_approval);

-- ============ ads ============
CREATE TABLE IF NOT EXISTS ads (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  body         TEXT,
  image_key    TEXT,
  link         TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_by   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active);

-- ============ ad_comments ============
CREATE TABLE IF NOT EXISTS ad_comments (
  id         TEXT PRIMARY KEY,
  ad_id      TEXT NOT NULL,
  user_id    TEXT,
  author     TEXT,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ad_comments_ad ON ad_comments(ad_id);

-- ============ project_requests ============
CREATE TABLE IF NOT EXISTS project_requests (
  id                TEXT PRIMARY KEY,
  project_id        TEXT,
  company_name      TEXT,
  facility_location TEXT,
  email             TEXT,
  phone             TEXT,
  pdf_url           TEXT,
  submitter_type    TEXT,
  status            TEXT NOT NULL DEFAULT 'new',
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_project_requests_project ON project_requests(project_id);

-- ============ project_submissions ============
CREATE TABLE IF NOT EXISTS project_submissions (
  id           TEXT PRIMARY KEY,
  submitter_id TEXT,
  name         TEXT,
  description  TEXT,
  location     TEXT,
  duration     TEXT,
  cover_image  TEXT,
  images       TEXT NOT NULL DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ contact_messages ============
CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT,
  email      TEXT,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ site_settings (singleton) ============
CREATE TABLE IF NOT EXISTS site_settings (
  id         TEXT PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ bot_qa ============
CREATE TABLE IF NOT EXISTS bot_qa (
  id         TEXT PRIMARY KEY,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  keywords   TEXT NOT NULL DEFAULT '[]',
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
  id           TEXT PRIMARY KEY,
  user_id      TEXT,
  email        TEXT,
  plan         TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',
  receipt_key  TEXT,          -- R2 object key
  starts_at    TEXT,
  expires_at   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vip_user ON vip_subscribers(user_id);

-- ============ support_chats ============
CREATE TABLE IF NOT EXISTS support_chats (
  id          TEXT PRIMARY KEY,
  visitor_id  TEXT,
  user_id     TEXT,
  status      TEXT NOT NULL DEFAULT 'open',
  assigned_to TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
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

-- ============ email_send_log / email_send_state / suppressed_emails / email_unsubscribe_tokens ============
CREATE TABLE IF NOT EXISTS email_send_log (
  id           TEXT PRIMARY KEY,
  to_email     TEXT,
  subject      TEXT,
  template     TEXT,
  status       TEXT,
  error        TEXT,
  metadata     TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_send_state (
  id             TEXT PRIMARY KEY,
  key            TEXT UNIQUE,
  state          TEXT,
  attempts       INTEGER NOT NULL DEFAULT 0,
  last_error     TEXT,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS suppressed_emails (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  reason     TEXT,
  source     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_unsubscribe_tokens (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ messages ============
CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  from_user  TEXT,
  to_user    TEXT,
  body       TEXT NOT NULL,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed default roles
INSERT OR IGNORE INTO roles (id, name, label) VALUES
  (lower(hex(randomblob(16))), 'admin', 'مدير'),
  (lower(hex(randomblob(16))), 'moderator', 'مشرف'),
  (lower(hex(randomblob(16))), 'user', 'مستخدم');
