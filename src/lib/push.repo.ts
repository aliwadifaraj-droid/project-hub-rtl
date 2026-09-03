// Repository for Web Push subscriptions stored in Turso.
import { db, rowsToObjects } from "./db";

export interface PushSubscriptionRow {
  id: number;
  user_id: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export async function ensurePushSubscriptionsTable(): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS user_push_subscriptions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT,
      endpoint    TEXT NOT NULL,
      p256dh      TEXT NOT NULL,
      auth        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  );
}

export async function insertSubscription(params: {
  userId: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<number> {
  await ensurePushSubscriptionsTable();
  const r = await db.execute({
    sql: `INSERT OR IGNORE INTO user_push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)`,
    args: [params.userId ?? null, params.endpoint, params.p256dh, params.auth],
  });
  return Number(r.lastInsertRowid ?? 0);
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await db.execute({
    sql: `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
    args: [endpoint],
  });
}

export async function listAllSubscriptions(): Promise<PushSubscriptionRow[]> {
  await ensurePushSubscriptionsTable();
  const r = await db.execute(`SELECT id, user_id, endpoint, p256dh, auth, created_at FROM user_push_subscriptions`);
  return rowsToObjects<PushSubscriptionRow>(r);
}

export async function listSubscriptionsByUserId(userId: string): Promise<PushSubscriptionRow[]> {
  await ensurePushSubscriptionsTable();
  const r = await db.execute({
    sql: `SELECT id, user_id, endpoint, p256dh, auth, created_at FROM user_push_subscriptions WHERE user_id = ?`,
    args: [userId],
  });
  return rowsToObjects<PushSubscriptionRow>(r);
}
