-- Turso schema. Run once against your Turso database.
-- Storage/Auth all live in Turso + Cloudflare R2. Supabase is no longer used.

-- ============ clients (customer login) ============
CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- ============ client_profiles (client registration data) ============
CREATE TABLE IF NOT EXISTS client_profiles (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL UNIQUE,       -- references clients.id
  company_name TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  city         TEXT NOT NULL DEFAULT '',
  cr_number    TEXT NOT NULL DEFAULT '',
  bio          TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'active',
  push_enabled INTEGER NOT NULL DEFAULT 0,
  push_token   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(lower(email));

-- ============ users (auth) ============
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============ user_roles ==========
CREATE TABLE IF NOT EXISTS user_roles (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  role       TEXT NOT NULL,          -- 'admin' | 'moderator' | 'user' | ...
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- ============ profiles ==========
CREATE TABLE IF NOT EXISTS profiles (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL UNIQUE,
  full_name    TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

-- ============ projects ============
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT '',
  budget      REAL NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'open',
  client_id   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

-- ============ project_requests ============
CREATE TABLE IF NOT EXISTS project_requests (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL,
  client_id   TEXT NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_project_requests_project ON project_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_client ON project_requests(client_id);

-- ============ ads ============
CREATE TABLE IF NOT EXISTS ads (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price       REAL NOT NULL DEFAULT 0,
  category    TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  client_id   TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_city ON ads(city);

-- ============ subscriptions (newsletter) ============
CREATE TABLE IF NOT EXISTS subscriptions (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);

-- ============ contact_messages ============
CREATE TABLE IF NOT EXISTS contact_messages (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- ============ blocked_users ============
CREATE TABLE IF NOT EXISTS blocked_users (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  block_type   TEXT NOT NULL DEFAULT 'حظر بالبريد والمؤسسة',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_blocked_users_company ON blocked_users(company_name);

-- ============ teachers_market (حراج المعلمين) ==========
CREATE TABLE IF NOT EXISTS teachers_market (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  cv TEXT,
  password TEXT,
  entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  exit_date DATETIME,
  status TEXT DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_teachers_market_email ON teachers_market(email);
CREATE INDEX IF NOT EXISTS idx_teachers_market_status ON teachers_market(status);
