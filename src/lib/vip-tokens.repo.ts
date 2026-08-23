import { db, rowsToObjects } from "./db";

export type VipTokenRow = {
  id: string;
  token: string;
  project_id: string;
  vip_email: string;
  expires_at: string;
  used: number;
  created_at: string;
};

let _tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (_tableReady) return _tableReady;
  _tableReady = db
    .execute(
      `CREATE TABLE IF NOT EXISTS vip_tokens (
         id          TEXT PRIMARY KEY,
         token       TEXT NOT NULL UNIQUE,
         project_id  TEXT NOT NULL,
         vip_email   TEXT NOT NULL,
         expires_at  TEXT NOT NULL,
         used        INTEGER NOT NULL DEFAULT 0,
         created_at  TEXT NOT NULL DEFAULT (datetime('now'))
       )`,
    )
    .then(() =>
      db
        .execute(
          `CREATE INDEX IF NOT EXISTS idx_vip_tokens_token ON vip_tokens(token)`,
        )
        .catch(() => undefined),
    )
    .then(() => undefined)
    .catch(() => undefined);
  return _tableReady;
}

export async function createVipToken(
  projectId: string,
  vipEmail: string,
  expiresAt: string,
): Promise<string> {
  await ensureTable();
  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  await db.execute(
    `INSERT INTO vip_tokens (id, token, project_id, vip_email, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, token, projectId, vipEmail, expiresAt],
  );
  return token;
}

export async function validateVipToken(
  token: string,
  projectId: string,
): Promise<{ valid: boolean; email: string | null }> {
  await ensureTable();
  const r = await db.execute(
    `SELECT vip_email, expires_at, used FROM vip_tokens
      WHERE token = ? AND project_id = ? LIMIT 1`,
    [token, projectId],
  );
  const row = rowsToObjects<any>(r)[0];
  if (!row) return { valid: false, email: null };
  if (Number(row.used) !== 0) return { valid: false, email: null };
  const expired = new Date(row.expires_at).getTime() < Date.now();
  if (expired) return { valid: false, email: null };
  return { valid: true, email: String(row.vip_email) };
}

export async function consumeVipToken(token: string): Promise<void> {
  await ensureTable();
  await db.execute(`UPDATE vip_tokens SET used = 1 WHERE token = ?`, [token]);
}
