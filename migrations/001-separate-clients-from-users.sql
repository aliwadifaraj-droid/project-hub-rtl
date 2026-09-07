-- Migration: Move misplaced clients from `users` to `clients` table.
-- Run once against your Turso database.
--
-- Problem: Some clients registered through /client-login, which stored them
-- in the `users` table (admin/employee table). They could then log into the
-- admin panel. This migration:
--   1. Creates the `clients` table if it doesn't exist.
--   2. Finds users whose email also exists in `client_profiles` but who have
--      NO admin/employee role — those are misplaced clients.
--   3. Copies them into `clients` (with their password_hash).
--   4. Deletes them from `users`, `user_roles`, and `profiles`.
--   5. Ensures UNIQUE constraints on email in both tables.

-- Step 1: Create the clients table
CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  company_name  TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  cr_number     TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Step 2: Insert misplaced clients into the clients table.
-- A user is "misplaced" if:
--   - Their email exists in client_profiles (they registered as a client), AND
--   - They do NOT have admin or employee role in user_roles.
-- We use INSERT OR IGNORE to avoid duplicates if run multiple times.
INSERT OR IGNORE INTO clients (id, email, password_hash, company_name, phone, city, cr_number, bio, status, created_at, updated_at)
SELECT
  u.id,
  u.email,
  u.password_hash,
  COALESCE(cp.company_name, ''),
  COALESCE(cp.phone, ''),
  COALESCE(cp.city, ''),
  COALESCE(cp.cr_number, ''),
  COALESCE(cp.bio, ''),
  COALESCE(cp.status, 'active'),
  u.created_at,
  u.created_at
FROM users u
INNER JOIN client_profiles cp ON cp.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = u.id AND ur.role IN ('admin', 'employee')
);

-- Step 3: Delete misplaced clients from user_roles
DELETE FROM user_roles
WHERE user_id IN (
  SELECT u.id FROM users u
  INNER JOIN client_profiles cp ON cp.user_id = u.id
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role IN ('admin', 'employee')
  )
);

-- Step 4: Delete misplaced clients from profiles
DELETE FROM profiles
WHERE user_id IN (
  SELECT u.id FROM users u
  INNER JOIN client_profiles cp ON cp.user_id = u.id
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role IN ('admin', 'employee')
  )
);

-- Step 5: Delete misplaced clients from users
DELETE FROM users
WHERE id IN (
  SELECT u.id FROM users u
  INNER JOIN client_profiles cp ON cp.user_id = u.id
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role IN ('admin', 'employee')
  )
);

-- Step 6: Ensure UNIQUE on email in users table (already has UNIQUE in schema,
-- but enforce the index if it was somehow dropped).
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(lower(email));

-- Step 7: Ensure UNIQUE on email in clients table.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email_unique ON clients(lower(email));
