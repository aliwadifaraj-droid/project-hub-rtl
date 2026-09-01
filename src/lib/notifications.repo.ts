// Repository for `notifications` on Turso. Server-only.
import { db, rowsToObjects } from "./db";

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

function decode(row: any): NotificationRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? ""),
    body: row.body ?? null,
    link: row.link ?? null,
    read: Number(row.read) === 1,
    created_at: String(row.created_at ?? ""),
  };
}

export async function listForUser(userId: string, limit = 50): Promise<NotificationRow[]> {
  const r = await db.execute(
    "SELECT id,user_id,title,body,link,read,created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
  return rowsToObjects(r).map(decode);
}

export async function countUnreadForUser(userId: string): Promise<number> {
  const r = await db.execute(
    "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0",
    [userId],
  );
  const rows = rowsToObjects<{ c: number }>(r);
  return Number(rows[0]?.c ?? 0);
}

export async function markRead(userId: string, id: string): Promise<void> {
  await db.execute(
    "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?",
    [id, userId],
  );
}

export async function markAllRead(userId: string): Promise<void> {
  await db.execute(
    "UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0",
    [userId],
  );
}

export type NotificationInsert = {
  user_id: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

async function notificationsEnabled(): Promise<boolean> {
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", ["notifications_enabled"]);
  const row = rowsToObjects<{ value: string | null }>(result)[0];
  const v = row?.value ? (JSON.parse(row.value) as { enabled?: boolean }) : {};
  return v.enabled !== false;
}

export async function insertOne(n: NotificationInsert): Promise<void> {
  if (!(await notificationsEnabled())) return;
  await db.execute(
    `INSERT INTO notifications (id, user_id, title, body, link, read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      crypto.randomUUID(),
      n.user_id,
      n.title,
      n.body ?? null,
      n.link ?? null,
      new Date().toISOString(),
    ],
  );
}

export async function insertMany(items: NotificationInsert[]): Promise<void> {
  if (!items.length) return;
  if (!(await notificationsEnabled())) return;
  await db.batch(
    items.map((n) => ({
      sql: `INSERT INTO notifications (id, user_id, title, body, link, read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?)`,
      args: [
        crypto.randomUUID(),
        n.user_id,
        n.title,
        n.body ?? null,
        n.link ?? null,
        new Date().toISOString(),
      ],
    })),
  );
}
