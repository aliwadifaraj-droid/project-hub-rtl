// Password reset tokens — stored in Turso. Server-only.
import { db, rowsToObjects } from "./db";

export type PasswordResetTokenRow = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: number;
  created_at: string;
};

const TOKEN_TTL_MINUTES = 30;

let _tableReady: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (_tableReady) return _tableReady;
  _tableReady = db.execute(
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
  ).then(() => db.execute(
    `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`,
  )).then(() => undefined);
  return _tableReady;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  await ensureTable();
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
  await db.execute(
    `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)`,
    [id, userId, token, expiresAt, now.toISOString()],
  );
  return token;
}

export async function getValidPasswordResetToken(token: string): Promise<PasswordResetTokenRow | null> {
  await ensureTable();
  const r = await db.execute(
    `SELECT id, user_id, token, expires_at, used, created_at FROM password_reset_tokens WHERE token = ? LIMIT 1`,
    [token],
  );
  const row: any = rowsToObjects(r)[0];
  if (!row) return null;
  const used = Number(row.used ?? 0) === 1;
  const expired = new Date(String(row.expires_at)).getTime() < Date.now();
  if (used || expired) return null;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    token: String(row.token),
    expires_at: String(row.expires_at),
    used,
    created_at: String(row.created_at ?? ""),
  };
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await ensureTable();
  await db.execute(`UPDATE password_reset_tokens SET used = 1 WHERE token = ?`, [token]);
}
