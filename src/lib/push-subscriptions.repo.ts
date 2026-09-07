// Repository for `push_subscriptions` on Turso. Server-only.
import { db, rowsToObjects } from "./db";

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

let _tableReady: Promise<void> | null = null;

export function ensurePushTable(): Promise<void> {
  if (!_tableReady) {
    _tableReady = (async () => {
      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )
        `);
        await db.execute(
          `CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id)`,
        );
        await db.execute(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_push_sub_endpoint ON push_subscriptions(endpoint)`,
        );
      } catch {
        // table/index already exists
      }
    })().catch((e) => {
      _tableReady = null;
      throw e;
    });
  }
  return _tableReady;
}

export async function saveSubscription(
  userId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
): Promise<string> {
  await ensurePushTable();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
    [id, userId, endpoint, p256dh, auth, new Date().toISOString()],
  );
  return id;
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await ensurePushTable();
  await db.execute(`DELETE FROM push_subscriptions WHERE endpoint = ?`, [endpoint]);
}

export async function listSubscriptionsForUser(userId: string): Promise<PushSubscriptionRow[]> {
  await ensurePushTable();
  const r = await db.execute(
    `SELECT id, user_id, endpoint, p256dh, auth, created_at FROM push_subscriptions WHERE user_id = ?`,
    [userId],
  );
  return rowsToObjects<PushSubscriptionRow>(r);
}

export async function listAllSubscriptions(): Promise<PushSubscriptionRow[]> {
  await ensurePushTable();
  const r = await db.execute(
    `SELECT id, user_id, endpoint, p256dh, auth, created_at FROM push_subscriptions`,
  );
  return rowsToObjects<PushSubscriptionRow>(r);
}
