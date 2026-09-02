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
  const v = row?.value ? (JSON.parse(row.value) as { enabled?: boolean })?.enabled : true;
  return v !== false;
}

export async function insertOne(n: NotificationInsert): Promise<void> {
  if (!(await notificationsEnabled())) return;
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO notifications (id, user_id, title, body, link, read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [id, n.user_id, n.title, n.body ?? null, n.link ?? null, new Date().toISOString()],
  );
}

export async function insertMany(items: NotificationInsert[]): Promise<void> {
  if (!(await notificationsEnabled())) return;
  if (!items.length) return;
  const now = new Date().toISOString();
  for (const n of items) {
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO notifications (id, user_id, title, body, link, read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [id, n.user_id, n.title, n.body ?? null, n.link ?? null, now],
    );
  }
}

// ---------- Offer notifications (stored as notifications with offer_status) ----------

export type OfferNotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
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
  status: string | null;
  created_at: string;
};

function decodeOffer(row: any): OfferNotificationRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id ?? ""),
    title: String(row.title ?? ""),
    body: row.body ?? null,
    link: row.link ?? null,
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
    status: row.status ?? null,
    created_at: String(row.created_at ?? ""),
  };
}

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

let _offerColsReady: Promise<void> | null = null;

export function ensureOfferColumns(): Promise<void> {
  if (_offerColsReady) return _offerColsReady;
  _offerColsReady = Promise.all([
    db.execute(`ALTER TABLE notifications ADD COLUMN project_id TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN project_name TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN company_name TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN email TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN facility_location TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN pdf_key TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN pdf_filename TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN amount TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN source TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN submitter_type TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN offer_status TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE notifications ADD COLUMN status TEXT`).catch(() => undefined),
  ]).then(() => undefined);
  return _offerColsReady;
}

export async function insertOfferNotificationMany(items: OfferNotificationInsert[]): Promise<void> {
  await ensureOfferColumns();
  if (!items.length) return;
  const now = new Date().toISOString();
  for (const n of items) {
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO notifications
        (id, user_id, title, body, link, project_id, project_name, company_name, email, facility_location, pdf_key, pdf_filename, amount, source, submitter_type, offer_status, status, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        id,
        n.user_id,
        n.title,
        n.body ?? null,
        n.link ?? null,
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
        n.offer_status ?? "new",
        now,
      ],
    );
  }
}

export async function checkDuplicateOffer(input: {
  projectName: string;
  company_name: string;
  email: string;
  projectId?: string | null;
}): Promise<boolean> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT 1 FROM notifications
     WHERE offer_status IS NOT NULL
       AND LOWER(TRIM(COALESCE(project_name, ''))) = ?
       AND LOWER(TRIM(COALESCE(company_name, ''))) = ?
       ${input.projectId ? "AND project_id = ?" : ""}
     LIMIT 1`,
    input.projectId
      ? [input.projectName.trim().toLowerCase(), input.company_name.trim().toLowerCase(), input.projectId]
      : [input.projectName.trim().toLowerCase(), input.company_name.trim().toLowerCase()],
  );
  if (rowsToObjects(r).length > 0) return true;
  try {
    const r2 = await db.execute(
      `SELECT 1 FROM project_requests
       WHERE LOWER(TRIM(COALESCE(facility_location, ''))) = ?
         AND (LOWER(TRIM(COALESCE(email, ''))) = ? OR LOWER(TRIM(COALESCE(company_name, ''))) = ?)
       LIMIT 1`,
      [input.projectName.trim().toLowerCase(), input.email.trim().toLowerCase(), input.company_name.trim().toLowerCase()],
    );
    return rowsToObjects(r2).length > 0;
  } catch {
    return false;
  }
}

export async function getOfferNotificationById(id: string): Promise<OfferNotificationRow | null> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id, user_id, title, body, link, project_id, project_name, company_name, email, facility_location, pdf_key, pdf_filename, amount, source, submitter_type, offer_status, status, created_at
     FROM notifications
     WHERE id = ? AND offer_status IS NOT NULL
     LIMIT 1`,
    [id],
  );
  const row = rowsToObjects<any>(r)[0];
  return row ? decodeOffer(row) : null;
}

export async function deleteOfferNotification(id: string): Promise<void> {
  await db.execute(`DELETE FROM notifications WHERE id = ? AND offer_status IS NOT NULL`, [id]);
}

export async function updateOfferNotificationStatus(id: string, status: string): Promise<void> {
  await db.execute(
    `UPDATE notifications SET offer_status = ?, status = ? WHERE id = ? AND offer_status IS NOT NULL`,
    [status, status, id],
  );
}

export async function listAllOfferNotifications(): Promise<OfferNotificationRow[]> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id, user_id, title, body, link, project_id, project_name, company_name, email, facility_location, pdf_key, pdf_filename, amount, source, submitter_type, offer_status, status, created_at
     FROM notifications
     WHERE offer_status IS NOT NULL
     ORDER BY created_at DESC`
  );
  return rowsToObjects(r).map(decodeOffer);
}

export async function countNewOfferNotifications(): Promise<number> {
  const r = await db.execute(
    `SELECT COUNT(*) AS c FROM notifications WHERE offer_status = 'new'`
  );
  const rows = rowsToObjects<{ c: number }>(r);
  return Number(rows[0]?.c ?? 0);
}

export async function searchOfferNotificationsByEmail(email: string, limit = 200): Promise<OfferNotificationRow[]> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id, user_id, title, body, link, project_id, project_name, company_name, email, facility_location, pdf_key, pdf_filename, amount, source, submitter_type, offer_status, status, created_at
     FROM notifications
     WHERE offer_status IS NOT NULL
       AND LOWER(TRIM(COALESCE(email, ''))) = LOWER(TRIM(?))
     ORDER BY created_at DESC
     LIMIT ?`,
    [email.trim(), limit],
  );
  return rowsToObjects(r).map(decodeOffer);
}

export async function searchOfferNotificationsByCompany(companyName: string, limit = 200): Promise<OfferNotificationRow[]> {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id, user_id, title, body, link, project_id, project_name, company_name, email, facility_location, pdf_key, pdf_filename, amount, source, submitter_type, offer_status, status, created_at
     FROM notifications
     WHERE offer_status IS NOT NULL
       AND LOWER(TRIM(COALESCE(company_name, ''))) = LOWER(TRIM(?))
     ORDER BY created_at DESC
     LIMIT ?`,
    [companyName.trim(), limit],
  );
  return rowsToObjects(r).map(decodeOffer);
}
