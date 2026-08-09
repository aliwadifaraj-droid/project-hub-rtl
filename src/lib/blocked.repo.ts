// Turso repository for `blocked` companies/emails.
import { db, rowsToObjects } from "./db";

export type BlockedRow = {
  id: string;
  company_name: string | null;
  email: string | null;
  created_at: string;
};

function decode(r: any): BlockedRow {
  return {
    id: String(r.id),
    company_name: r.company_name ?? null,
    email: r.email ?? null,
    created_at: String(r.created_at ?? ""),
  };
}

let _tableReady: Promise<void> | null = null;

export function ensureBlockedTable(): Promise<void> {
  if (_tableReady) return _tableReady;
  _tableReady = db.execute(
    `CREATE TABLE IF NOT EXISTS blocked (
      id           TEXT PRIMARY KEY,
      company_name TEXT,
      email        TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ).then(() => undefined).catch(() => undefined);
  return _tableReady;
}

export async function insertBlocked(input: {
  company_name?: string | null;
  email?: string | null;
}): Promise<string> {
  await ensureBlockedTable();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO blocked (id, company_name, email, created_at) VALUES (?, ?, ?, ?)`,
    [id, input.company_name ?? null, input.email ?? null, new Date().toISOString()],
  );
  return id;
}

export async function removeBlocked(id: string): Promise<void> {
  await ensureBlockedTable();
  await db.execute(`DELETE FROM blocked WHERE id = ?`, [id]);
}

export async function listBlocked(): Promise<BlockedRow[]> {
  await ensureBlockedTable();
  const r = await db.execute(`SELECT * FROM blocked ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function isBlocked(companyName?: string | null, email?: string | null): Promise<boolean> {
  await ensureBlockedTable();
  const c = (companyName ?? "").trim().toLowerCase();
  const e = (email ?? "").trim().toLowerCase();
  if (!c && !e) return false;
  const r = await db.execute(
    `SELECT 1 FROM blocked
     WHERE (? != '' AND LOWER(TRIM(COALESCE(company_name,''))) = ?)
        OR (? != '' AND LOWER(TRIM(COALESCE(email,''))) = ?)
     LIMIT 1`,
    [c, c, e, e],
  );
  return rowsToObjects(r).length > 0;
}
