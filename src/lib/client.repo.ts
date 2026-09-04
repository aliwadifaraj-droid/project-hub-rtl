// Turso repository for client profiles (work contractors/companies).
// Server-only. Stores registration data for the client portal.
import { db, rowsToObjects } from "./db";

export type ClientProfile = {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  phone: string;
  city: string;
  cr_number: string;
  bio: string;
  status: string;
  push_enabled: boolean;
  push_token: string | null;
  created_at: string;
  updated_at: string;
};

let _tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (_tableReady) return _tableReady;
  _tableReady = db.execute(
    `CREATE TABLE IF NOT EXISTS client_profiles (
       id          TEXT PRIMARY KEY,
       user_id     TEXT NOT NULL UNIQUE,
       company_name TEXT NOT NULL DEFAULT '',
       email       TEXT NOT NULL DEFAULT '',
       phone       TEXT NOT NULL DEFAULT '',
       city        TEXT NOT NULL DEFAULT '',
       cr_number   TEXT NOT NULL DEFAULT '',
       bio         TEXT NOT NULL DEFAULT '',
       status      TEXT NOT NULL DEFAULT 'active',
       created_at  TEXT NOT NULL DEFAULT (datetime('now')),
       updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
     )`,
  )
    .then(() => db.execute(`ALTER TABLE client_profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`).catch(() => undefined))
    .then(() => db.execute(`ALTER TABLE client_profiles ADD COLUMN push_enabled INTEGER NOT NULL DEFAULT 0`).catch(() => undefined))
    .then(() => db.execute(`ALTER TABLE client_profiles ADD COLUMN push_token TEXT`).catch(() => undefined))
    .then(() => undefined)
    .catch(() => undefined);
  return _tableReady;
}

function decode(r: any): ClientProfile {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    company_name: String(r.company_name ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    city: String(r.city ?? ""),
    cr_number: String(r.cr_number ?? ""),
    bio: String(r.bio ?? ""),
    status: String(r.status ?? "active"),
    push_enabled: Number(r.push_enabled ?? 0) === 1,
    push_token: r.push_token ?? null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  };
}

export async function getClientProfile(userId: string): Promise<ClientProfile | null> {
  await ensureTable();
  const r = await db.execute(
    `SELECT * FROM client_profiles WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function getClientProfileByEmail(email: string): Promise<ClientProfile | null> {
  await ensureTable();
  const r = await db.execute(
    `SELECT * FROM client_profiles WHERE lower(email) = lower(?) LIMIT 1`,
    [email.trim()],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function isClientBlockedByEmail(email: string): Promise<boolean> {
  const profile = await getClientProfileByEmail(email);
  return profile?.status === "blocked";
}

export async function listAllClientProfiles(): Promise<ClientProfile[]> {
  await ensureTable();
  const r = await db.execute(
    `SELECT * FROM client_profiles ORDER BY created_at DESC`,
  );
  return rowsToObjects(r).map(decode);
}

export async function createClientProfile(
  userId: string,
  email: string,
  data: {
    company_name: string;
    phone: string;
    city: string;
    cr_number?: string;
    bio?: string;
  },
): Promise<ClientProfile> {
  await ensureTable();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO client_profiles (id, user_id, company_name, email, phone, city, cr_number, bio, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, data.company_name, email, data.phone, data.city, data.cr_number ?? "", data.bio ?? "", now, now],
  );
  return (await getClientProfile(userId))!;
}

export async function updateClientProfile(
  userId: string,
  patch: Partial<{
    company_name: string;
    phone: string;
    city: string;
    cr_number: string;
    bio: string;
  }>,
): Promise<void> {
  await ensureTable();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    sets.push(`${k} = ?`);
    args.push(v);
  }
  if (!sets.length) return;
  sets.push(`updated_at = ?`);
  args.push(new Date().toISOString());
  args.push(userId);
  await db.execute(`UPDATE client_profiles SET ${sets.join(", ")} WHERE user_id = ?`, args);
}

export async function updateClientStatusByEmail(
  email: string,
  status: "active" | "blocked",
): Promise<void> {
  await ensureTable();
  await db.execute(
    `UPDATE client_profiles SET status = ?, updated_at = ? WHERE lower(email) = lower(?)`,
    [status, new Date().toISOString(), email.trim()],
  );
}

export async function updateClientPushByEmail(
  email: string,
  push_enabled: boolean,
): Promise<void> {
  await ensureTable();
  await db.execute(
    `UPDATE client_profiles SET push_enabled = ?, updated_at = ? WHERE lower(email) = lower(?)`,
    [push_enabled ? 1 : 0, new Date().toISOString(), email.trim()],
  );
}

export async function updateAllClientsPush(push_enabled: boolean): Promise<void> {
  await ensureTable();
  await db.execute(
    `UPDATE client_profiles SET push_enabled = ?, updated_at = ?`,
    [push_enabled ? 1 : 0, new Date().toISOString()],
  );
}

export async function deleteClientProfileByEmail(email: string): Promise<string | null> {
  await ensureTable();
  const profile = await getClientProfileByEmail(email);
  if (!profile) return null;
  await db.execute(
    `DELETE FROM client_profiles WHERE user_id = ?`,
    [profile.user_id],
  );
  return profile.user_id;
}
