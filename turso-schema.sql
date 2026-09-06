-- This file defines the schema for the Turso (libSQL) database.
-- It is used for local development and can be applied to a remote database.

-- ============ roles ==========
CREATE TABLE IF NOT EXISTS roles (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL
);

-- ============ users ==========
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  company_name  TEXT,
  phone         TEXT,
  city          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ user_roles ==========
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ============ projects ==========
CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  location        TEXT,
  city            TEXT,
  duration        TEXT,
  image_url       TEXT,
  admin_approval  TEXT NOT NULL DEFAULT 'approved',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_city ON projects(city);

-- ============ project_exclusive ==========
CREATE TABLE IF NOT EXISTS project_exclusive (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL UNIQUE,
  vip_end_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ project_requests ==========
CREATE TABLE IF NOT EXISTS project_requests (
  id          TEXT PRIMARY KEY,
  project_id  TEXT,
  company_name TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'new',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_project_requests_email ON project_requests(email);
CREATE INDEX IF NOT EXISTS idx_project_requests_company ON project_requests(company_name);

-- ============ bot_qa ==========
CREATE TABLE IF NOT EXISTS bot_qa (
  id         TEXT PRIMARY KEY,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  keywords  TEXT NOT NULL DEFAULT '[]',
  is_active  INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  action     TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ bot_settings ==========
CREATE TABLE IF NOT EXISTS bot_settings (
  id                          TEXT PRIMARY KEY,
  singleton                   INTEGER NOT NULL DEFAULT 1,
  work_days                   TEXT NOT NULL DEFAULT '{"sun":true,"mon":true,"tue":true,"wed":true,"thu":true,"fri":false,"sat":false}',
  work_start                  TEXT NOT NULL DEFAULT '09:00',
  work_end                    TEXT NOT NULL DEFAULT '17:00',
  off_hours_message          TEXT NOT NULL DEFAULT '',
  fallback_message           TEXT NOT NULL DEFAULT '',
  allow_escalation           INTEGER NOT NULL DEFAULT 1,
  show_suggested_questions   INTEGER NOT NULL DEFAULT 1,
  local_enabled              INTEGER NOT NULL DEFAULT 1,
  local_system_prompt        TEXT NOT NULL DEFAULT '',
  cerebras_enabled           INTEGER NOT NULL DEFAULT 1,
  gemini_system_instruction  TEXT NOT NULL DEFAULT '',
  gemini_dialect             TEXT NOT NULL DEFAULT 'سعودي',
  gemini_bot_name            TEXT NOT NULL DEFAULT 'مساعد',
  gemini_blocked_replies     TEXT NOT NULL DEFAULT '[]',
  gemini_scope               TEXT NOT NULL DEFAULT '',
  created_at                 TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                 TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ team_messages ==========
CREATE TABLE IF NOT EXISTS team_messages (
  id         TEXT PRIMARY KEY,
  author_id  TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ notifications ==========
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

-- ============ vip_subscribers ==========
CREATE TABLE IF NOT EXISTS vip_subscribers (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  plan TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  receipt_key TEXT,
  starts_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vip_user ON vip_subscribers(user_id);

-- ============ support_chats ==========
CREATE TABLE IF NOT EXISTS support_chats (
  id          TEXT PRIMARY KEY,
  visitor_id  TEXT,
  user_id     TEXT,
  status      TEXT NOT NULL DEFAULT 'open',
  assigned_to TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ support_messages ==========
CREATE TABLE IF NOT EXISTS support_messages (
  id         TEXT PRIMARY KEY,
  chat_id    TEXT NOT NULL,
  sender     TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_support_messages_chat ON support_messages(chat_id, created_at);

-- ============ email_send_log / email_send_state / suppressed_emails / email_unsubscribe_tokens ==========
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
  id           TEXT PRIMARY KEY,
  key          TEXT UNIQUE,
  state        TEXT,
  attempts     INTEGER NOT NULL DEFAULT 0,
  last_error   TEXT,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
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

-- ============ messages ==========
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

CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  project_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  amount TEXT NOT NULL,
  duration TEXT,
  pdf_key TEXT,
  pdf_filename TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  visitor_token TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_offers_created ON offers(created_at DESC);

-- ============ blocked_users ==========
CREATE TABLE IF NOT EXISTS blocked_users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  company_name TEXT NOT NULL DEFAULT '',
  block_type   TEXT NOT NULL DEFAULT 'حظر بالبريد والمؤسسة',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_blocked_users_company ON blocked_users(company_name);
