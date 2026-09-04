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
  const v = row?.value ? (JSON.parse(row.value) as { enabled?: boolean }) : null;
  return v?.enabled !== false;
}

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
    user_id: String(row.user_id),
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
  status?: string | null;
};

export async function insertOfferNotificationMany(items: OfferNotificationInsert[]): Promise<string[]> {
  if (!items.length) return [];
  if (!(await notificationsEnabled())) return [];
  const now = new Date().toISOString();
  const ids: string[] = [];
  await db.batch(
    items.map((n) => {
      const id = crypto.randomUUID();
      ids.push(id);
      return {
        sql: `INSERT INTO notifications
          (id, user_id, title, body, link, project_id, project_name, company_name, email, facility_location, pdf_key, pdf_filename, amount, source, submitter_type, offer_status, status, read, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        args: [
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
          n.offer_status ?? null,
          n.status ?? null,
          now,
        ],
      };
    }),
  );
  return ids;
}

export async function checkDuplicateOffer(input: {
  projectName: string;
  companyName: string;
  projectId?: string | null;
}): Promise<boolean> {
  const projectName = (input.projectName ?? "").trim().toLowerCase();
  const companyName = (input.companyName ?? "").trim().toLowerCase();
  if (!projectName || !companyName) return false;
  const r = await db.execute(
    `SELECT 1 FROM notifications
      WHERE offer_status IS NOT NULL
        AND LOWER(TRIM(COALESCE(project_name, ''))) = ?
        AND LOWER(TRIM(COALESCE(company_name, ''))) = ?
        ${input.projectId ? "AND project_id = ?" : ""}
      LIMIT 1`,
    input.projectId
      ? [projectName, companyName, input.projectId]
      : [projectName, companyName],
  );
  return rowsToObjects(r).length > 0;
}

export async function getOfferNotificationById(id: string): Promise<OfferNotificationRow | null> {
  const r = await db.execute(
    `SELECT id, user_id, title, body, link, project_id, project_name, company_name, email, facility_location, pdf_key, pdf_filename, amount, source, submitter_type, offer_status, status, created_at
       FROM notifications
       WHERE id = ? AND offer_status IS NOT NULL LIMIT 1`,
    [id],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decodeOffer(rows[0]) : null;
}

export async function deleteOfferNotification(id: string): Promise<void> {
  await db.execute(`DELETE FROM notifications WHERE id = ?`, [id]);
}

export async function updateOfferNotificationStatus(id: string, status: string): Promise<void> {
  await db.execute(
    `UPDATE notifications SET offer_status = ? WHERE pdf_key = (SELECT pdf_key FROM notifications WHERE id = ?)`,
    [status, id],
  );
}

export async function deleteOfferNotificationsByPdfKey(pdfKey: string): Promise<void> {
  await db.execute(
    `DELETE FROM notifications WHERE pdf_key = ? AND offer_status IS NOT NULL`,
    [pdfKey],
  );
}

export async function listAllOfferNotifications(): Promise<OfferNotificationRow[]> {
  const r = await db.execute(
    `SELECT id, user_id, title, body, link, project_id, project_name, company_name, email, facility_location, pdf_key, pdf_filename, amount, source, submitter_type, offer_status, status, created_at
       FROM notifications
       WHERE offer_status IS NOT NULL
       ORDER BY created_at DESC`,
  );
  return rowsToObjects(r).map(decodeOffer);
}

export async function countNewOfferNotifications(): Promise<number> {
  const r = await db.execute(
    `SELECT COUNT(*) AS c FROM notifications WHERE offer_status = 'new'`,
  );
  const rows = rowsToObjects<{ c: number }>(r);
  return Number(rows[0]?.c ?? 0);
}

export async function existsDuplicateAddProjectNotification(email: string, companyName: string): Promise<boolean> {
  const e = (email ?? "").trim().toLowerCase();
  const c = (companyName ?? "").trim().toLowerCase();
  if (!e || !c) return false;
  const r = await db.execute(
    `SELECT 1 FROM notifications
      WHERE source = 'add_project'
        AND LOWER(TRIM(COALESCE(email, ''))) = ?
        AND LOWER(TRIM(COALESCE(company_name, ''))) = ?
      LIMIT 1`,
    [e, c],
  );
  return rowsToObjects(r).length > 0;
}

// ---------- Offer tracking for client portal ("my offers") ----------
// These are called by getMyOffers in client.functions.ts. They must always
// return an array (never null) so the client offers tab renders cleanly.

const OFFER_COLS =
  "project_id,project_name,company_name,email,facility_location,pdf_key,pdf_filename,amount,source,submitter_type,offer_status";

let _offerColsReady: Promise<void> | null = null;
async function ensureOfferColumns(): Promise<void> {
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

export async function searchOfferNotificationsByEmail(email: string, limit = 50): Promise<OfferNotificationRow[]> {
  await ensureOfferColumns();
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return [];
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications
     WHERE offer_status IS NOT NULL AND LOWER(TRIM(COALESCE(email,''))) = ?
     ORDER BY created_at DESC LIMIT ?`,
    [e, limit],
  );
  return rowsToObjects(r).map(decodeOffer);
}

export async function searchOfferNotificationsByCompany(name: string, limit = 50): Promise<OfferNotificationRow[]> {
  await ensureOfferColumns();
  const n = (name ?? "").trim().toLowerCase();
  if (!n) return [];
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications
     WHERE offer_status IS NOT NULL AND LOWER(TRIM(COALESCE(company_name,''))) LIKE ?
     ORDER BY created_at DESC LIMIT ?`,
    [`%${n}%`, limit],
  );
  return rowsToObjects(r).map(decodeOffer);
}
