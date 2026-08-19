// Repository for `notifications` on Turso. Server-only.
// Also stores price offers (bid requests) so they surface in the notifications feed.
import { db, rowsToObjects } from "./db";

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
  // offer-related fields (nullable for plain notifications)
  project_id: string | null;
  project_name: string | null;
  company_name: string | null;
  email: string | null;
  facility_location: string | null;
  pdf_key: string | null;
  pdf_filename: string | null;
  amount: string | null;
  source: string | null;
  submitter_type: string | null;
  offer_status: string | null;
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
    project_id: row.project_id ?? null,
    project_name: row.project_name ?? null,
    company_name: row.company_name ?? null,
    email: row.email ?? null,
    facility_location: row.facility_location ?? null,
    pdf_key: row.pdf_key ?? null,
    pdf_filename: row.pdf_filename ?? null,
    amount: row.amount ?? null,
    source: row.source ?? null,
    submitter_type: row.submitter_type ?? null,
    offer_status: row.offer_status ?? null,
  };
}

const OFFER_COLS =
  "project_id,project_name,company_name,email,facility_location,pdf_key,pdf_filename,amount,source,submitter_type,offer_status";

// --- column migration helpers (idempotent) ---
let _offerColsReady: Promise<void> | null = null;
export function ensureOfferColumns(): Promise<void> {
  if (!_offerColsReady) {
    _offerColsReady = (async () => {
      const cols = [
        "project_id TEXT",
        "project_name TEXT",
        "company_name TEXT",
        "email TEXT",
        "facility_location TEXT",
        "pdf_key TEXT",
        "pdf_filename TEXT",
        "amount TEXT",
        "source TEXT",
        "submitter_type TEXT",
        "offer_status TEXT",
      ];
      for (const c of cols) {
        const colName = c.split(" ")[0];
        try {
          await db.execute(`ALTER TABLE notifications ADD COLUMN ${c}`);
        } catch {
          // column already exists
        }
      }
    })().catch((e) => {
      _offerColsReady = null;
      throw e;
    });
  }
  return _offerColsReady;
}

export async function listForUser(userId: string, limit = 50): Promise<NotificationRow[]> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
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

export async function insertOne(n: NotificationInsert): Promise<void> {
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

// ---------------------------------------------------------------------------
// Offer-as-notification helpers
// ---------------------------------------------------------------------------

export type OfferNotificationInsert = {
  user_id: string;
  title: string;
  body?: string | null;
  link?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  facility_location?: string | null;
  pdf_key?: string | null;
  pdf_filename?: string | null;
  amount?: string | null;
  source?: string | null;
  submitter_type?: string | null;
  offer_status?: string | null;
};

export async function insertOfferNotification(n: OfferNotificationInsert): Promise<string> {
  await ensureOfferColumns();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO notifications (id, user_id, title, body, link, read, created_at, ${OFFER_COLS})
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      n.user_id,
      n.title,
      n.body ?? null,
      n.link ?? null,
      new Date().toISOString(),
      n.project_id ?? null,
      n.project_name ?? null,
      n.company_name ?? null,
      n.email ?? null,
      n.facility_location ?? null,
      n.pdf_key ?? null,
      n.pdf_filename ?? null,
      n.amount ?? null,
      n.source ?? null,
      n.submitter_type ?? null,
      n.offer_status ?? "new",
    ],
  );
  return id;
}

export async function insertOfferNotificationMany(items: OfferNotificationInsert[]): Promise<string[]> {
  if (!items.length) return [];
  await ensureOfferColumns();
  const ids = items.map(() => crypto.randomUUID());
  const now = new Date().toISOString();
  await db.batch(
    items.map((n, i) => ({
      sql: `INSERT INTO notifications (id, user_id, title, body, link, read, created_at, ${OFFER_COLS})
            VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        ids[i],
        n.user_id,
        n.title,
        n.body ?? null,
        n.link ?? null,
        now,
        n.project_id ?? null,
        n.project_name ?? null,
        n.company_name ?? null,
        n.email ?? null,
        n.facility_location ?? null,
        n.pdf_key ?? null,
        n.pdf_filename ?? null,
        n.amount ?? null,
        n.source ?? null,
        n.submitter_type ?? null,
        n.offer_status ?? "new",
      ],
    })),
  );
  return ids;
}

export async function listOfferNotificationsBySource(source: string, limit = 500): Promise<NotificationRow[]> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications
     WHERE source = ? AND offer_status IS NOT NULL
     ORDER BY created_at DESC LIMIT ?`,
    [source, limit],
  );
  return rowsToObjects(r).map(decode);
}

export async function listAllOfferNotifications(limit = 500): Promise<NotificationRow[]> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications
     WHERE offer_status IS NOT NULL
     ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  return rowsToObjects(r).map(decode);
}

export async function getOfferNotificationById(id: string): Promise<NotificationRow | null> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications WHERE id = ? LIMIT 1`,
    [id],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function getOfferNotificationByPdfPath(path: string): Promise<NotificationRow | null> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications WHERE pdf_key = ? LIMIT 1`,
    [path],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function updateOfferNotificationStatus(id: string, status: string): Promise<void> {
  await ensureOfferColumns();
  await db.execute(`UPDATE notifications SET offer_status = ? WHERE id = ?`, [status, id]);
}

export async function deleteOfferNotification(id: string): Promise<void> {
  await db.execute(`DELETE FROM notifications WHERE id = ?`, [id]);
}

export async function countNewOfferNotifications(): Promise<number> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT COUNT(*) AS c FROM notifications WHERE offer_status = 'new'`,
  );
  return Number(rowsToObjects<{ c: number }>(r)[0]?.c ?? 0);
}

export async function existsDuplicateOfferNotification(
  projectName: string,
  email: string,
  companyName: string,
): Promise<boolean> {
  await ensureOfferColumns();
  const p = (projectName ?? "").trim().toLowerCase();
  const e = (email ?? "").trim().toLowerCase();
  const c = (companyName ?? "").trim().toLowerCase();
  const r = await db.execute(
    `SELECT 1 FROM notifications
     WHERE offer_status IS NOT NULL
       AND LOWER(TRIM(COALESCE(project_name,''))) = ?
       AND (LOWER(TRIM(COALESCE(email,''))) = ? OR LOWER(TRIM(COALESCE(company_name,''))) = ?)
     LIMIT 1`,
    [p, e, c],
  );
  return rowsToObjects(r).length > 0;
}

export async function existsDuplicateAddProjectNotification(
  email: string,
  companyName: string,
): Promise<boolean> {
  await ensureOfferColumns();
  const e = (email ?? "").trim().toLowerCase();
  const c = (companyName ?? "").trim().toLowerCase();
  const r = await db.execute(
    `SELECT 1 FROM notifications
     WHERE source = 'add_project'
       AND offer_status IS NOT NULL
       AND (LOWER(TRIM(COALESCE(email,''))) = ? OR LOWER(TRIM(COALESCE(company_name,''))) = ?)
     LIMIT 1`,
    [e, c],
  );
  return rowsToObjects(r).length > 0;
}
