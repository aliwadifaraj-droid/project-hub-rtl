// Turso (libSQL) client — server-only.
// Do NOT import this from client-side code.
// Used for all non-auth application data. Supabase remains for Auth, RLS,
// user_roles, profiles-linked-to-auth.users, and Storage.

import { createClient, type Client, type InArgs } from "@libsql/client";

let _client: Client | null = null;

export function getDb(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  _client = createClient({ url, authToken });
  return _client;
}

/**
 * Convenience wrapper. Prefer this over `getDb().execute(...)` at call sites.
 * Usage:
 *   const rows = await db.execute("SELECT * FROM projects WHERE id = ?", [id]);
 */
export const db = {
  execute(sql: string, args: InArgs = []) {
    return getDb().execute({ sql, args });
  },
  batch(statements: Array<{ sql: string; args?: InArgs }>) {
    return getDb().batch(
      statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    );
  },
  raw() {
    return getDb();
  },
};

/** Map libSQL result rows to plain objects (libSQL Rows are already keyed). */
export function rowsToObjects<T = Record<string, unknown>>(result: {
  rows: readonly unknown[];
}): T[] {
  return (result.rows as unknown[]).map((r) => ({ ...(r as object) })) as T[];
}
