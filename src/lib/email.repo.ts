import { db, rowsToObjects } from "./db";

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const r = await db.execute(`SELECT id FROM suppressed_emails WHERE lower(email) = lower(?) LIMIT 1`, [email]);
  return rowsToObjects(r).length > 0;
}

export async function suppressEmail(email: string, reason: string, source = "app"): Promise<void> {
  await db.execute(
    `INSERT INTO suppressed_emails (id, email, reason, source, created_at)
     VALUES (?, lower(?), ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET reason = excluded.reason, source = excluded.source`,
    [crypto.randomUUID(), email, reason, source, new Date().toISOString()],
  );
}

export async function getUnsubscribeToken(token: string): Promise<{ id: string; email: string; token: string; used: boolean } | null> {
  const r = await db.execute(`SELECT id,email,token,used FROM email_unsubscribe_tokens WHERE token = ? LIMIT 1`, [token]);
  const row: any = rowsToObjects(r)[0];
  if (!row) return null;
  return { id: String(row.id), email: String(row.email), token: String(row.token), used: Number(row.used ?? 0) === 1 };
}

export async function getOrCreateUnsubscribeToken(email: string, tokenFactory: () => string): Promise<string> {
  const existing = await db.execute(`SELECT token,used FROM email_unsubscribe_tokens WHERE lower(email) = lower(?) LIMIT 1`, [email]);
  const row: any = rowsToObjects(existing)[0];
  if (row && Number(row.used ?? 0) !== 1) return String(row.token);
  const token = tokenFactory();
  await db.execute(
    `INSERT INTO email_unsubscribe_tokens (id, email, token, used, created_at) VALUES (?, lower(?), ?, 0, ?)`,
    [crypto.randomUUID(), email, token, new Date().toISOString()],
  );
  return token;
}

export async function markUnsubscribeTokenUsed(token: string): Promise<{ email: string } | null> {
  const row = await getUnsubscribeToken(token);
  if (!row || row.used) return null;
  await db.execute(`UPDATE email_unsubscribe_tokens SET used = 1 WHERE token = ? AND used = 0`, [token]);
  return { email: row.email };
}

export async function insertEmailLog(input: { to_email?: string | null; subject?: string | null; template?: string | null; status: string; error?: string | null; metadata?: unknown }) {
  await db.execute(
    `INSERT INTO email_send_log (id, to_email, subject, template, status, error, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), input.to_email ?? null, input.subject ?? null, input.template ?? null, input.status, input.error ?? null, input.metadata ? JSON.stringify(input.metadata) : null, new Date().toISOString()],
  );
}