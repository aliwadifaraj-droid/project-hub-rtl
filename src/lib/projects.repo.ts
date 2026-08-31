// Turso repository for `projects`.
import { db, rowsToObjects } from "./db";
import webpush from "web-push";

export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  duration: string | null;
  cover_image: string | null;
  images: string[];
  pdf_file: string | null;
  created_by: string | null;
  status: string;
  admin_approval: string;
  ad_id: string | null;
  domain: string | null;
  offers_enabled: boolean;
  bot_offers_enabled: boolean;
  exclusive_hours: number;
  is_exclusive: boolean;
  exclusive_until: string | null;
  is_customer_request: boolean;
  created_at: string;
};

function decode(r: any): ProjectRow {
  let images: string[] = [];
  try { images = r.images ? JSON.parse(r.images) : []; } catch { images = []; }
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    description: r.description ?? null,
    location: r.location ?? null,
    duration: r.duration ?? null,
    cover_image: r.cover_image ?? null,
    images,
    pdf_file: r.pdf_file ?? null,
    created_by: r.created_by ?? null,
    status: String(r.status ?? "active"),
    admin_approval: String(r.admin_approval ?? "pending"),
    ad_id: r.ad_id ?? null,
    domain: r.domain ?? null,
    offers_enabled: Number(r.offers_enabled ?? 1) !== 0,
    bot_offers_enabled: Number(r.bot_offers_enabled ?? 1) !== 0,
    exclusive_hours: Number(r.exclusive_hours ?? 6),
    is_exclusive: Number(r.is_exclusive ?? 0) !== 0,
    exclusive_until: r.exclusive_until ?? null,
    is_customer_request: Number(r.is_customer_request ?? 0) !== 0,
    created_at: String(r.created_at ?? ""),
  };
}

const COLS = "id,name,description,location,duration,cover_image,images,pdf_file,created_by,status,admin_approval,ad_id,domain,created_at,offers_enabled,bot_offers_enabled,exclusive_hours,is_exclusive,exclusive_until,is_customer_request";

let _offersColReady: Promise<void> | null = null;
export function ensureOffersEnabledColumn(): Promise<void> {
  if (!_offersColReady) {
    _offersColReady = Promise.all([
      db.execute(`ALTER TABLE projects ADD COLUMN offers_enabled INTEGER NOT NULL DEFAULT 1`).catch(() => undefined),
      db.execute(`ALTER TABLE projects ADD COLUMN bot_offers_enabled INTEGER NOT NULL DEFAULT 1`).catch(() => undefined),
      db.execute(`ALTER TABLE projects ADD COLUMN exclusive_hours INTEGER NOT NULL DEFAULT 6`).catch(() => undefined),
      db.execute(`ALTER TABLE projects ADD COLUMN is_exclusive INTEGER NOT NULL DEFAULT 0`).catch(() => undefined),
      db.execute(`ALTER TABLE projects ADD COLUMN exclusive_until TEXT`).catch(() => undefined),
      db.execute(`ALTER TABLE projects ADD COLUMN is_customer_request INTEGER NOT NULL DEFAULT 0`).catch(() => undefined),
    ]).then(() => undefined);
  }
  return _offersColReady;
}

export async function listAllProjects(): Promise<ProjectRow[]> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT ${COLS} FROM projects ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function setOffersEnabled(id: string, enabled: boolean): Promise<void> {
  await ensureOffersEnabledColumn();
  await db.execute(`UPDATE projects SET offers_enabled = ?, updated_at = ? WHERE id = ?`, [enabled ? 1 : 0, new Date().toISOString(), id]);
}

export async function setAllOffersEnabled(enabled: boolean): Promise<void> {
  await ensureOffersEnabledColumn();
  await db.execute(`UPDATE projects SET offers_enabled = ?, updated_at = ?`, [enabled ? 1 : 0, new Date().toISOString()]);
}

export async function isOffersEnabled(id: string): Promise<boolean> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT offers_enabled FROM projects WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects<any>(r)[0];
  return row ? Number(row.offers_enabled ?? 1) !== 0 : false;
}

export async function setBotOffersEnabled(id: string, enabled: boolean): Promise<void> {
  await ensureOffersEnabledColumn();
  await db.execute(`UPDATE projects SET bot_offers_enabled = ?, updated_at = ? WHERE id = ?`, [enabled ? 1 : 0, new Date().toISOString(), id]);
}

export async function setAllBotOffersEnabled(enabled: boolean): Promise<void> {
  await ensureOffersEnabledColumn();
  await db.execute(`UPDATE projects SET bot_offers_enabled = ?, updated_at = ?`, [enabled ? 1 : 0, new Date().toISOString()]);
}

export async function getByNameExact(name: string): Promise<ProjectRow | null> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM projects WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1`,
    [name.trim()],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function searchByName(query: string): Promise<ProjectRow[]> {
  const r = await db.execute(
    `SELECT ${COLS} FROM projects WHERE name LIKE ? COLLATE NOCASE ORDER BY created_at DESC LIMIT 50`,
    [`%${query}%`],
  );
  return rowsToObjects<ProjectRow>(r).map(decode);
}

export async function listByOwner(userId: string): Promise<ProjectRow[]> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT ${COLS} FROM projects WHERE created_by = ? ORDER BY created_at DESC`, [userId]);
  return rowsToObjects(r).map(decode);
}

export async function listPending(): Promise<ProjectRow[]> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT ${COLS} FROM projects WHERE admin_approval = 'pending' ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function countPending(): Promise<number> {
  const r = await db.execute(`SELECT COUNT(*) AS n FROM projects WHERE admin_approval = 'pending'`);
  return Number((r.rows[0] as any)?.n ?? 0);
}

export async function getById(id: string): Promise<ProjectRow | null> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT ${COLS} FROM projects WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function findByOwnerAndName(userId: string, name: string, excludeId?: string): Promise<ProjectRow | null> {
  const sql = excludeId ? `SELECT id FROM projects WHERE created_by = ? AND name = ? AND id <> ? LIMIT 1` : `SELECT id FROM projects WHERE created_by = ? AND name = ? LIMIT 1`;
  const args = excludeId ? [userId, name, excludeId] : [userId, name];
  const r = await db.execute(sql, args);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function findByAdId(adId: string): Promise<ProjectRow | null> {
  const r = await db.execute(`SELECT id FROM projects WHERE ad_id = ? LIMIT 1`, [adId]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function insertProject(input: {
  name: string;
  description?: string | null;
  location?: string | null;
  duration?: string | null;
  cover_image?: string | null;
  images?: string[];
  pdf_file?: string | null;
  created_by?: string | null;
  status?: string;
  admin_approval?: string;
  ad_id?: string | null;
  exclusive_hours?: number;
  is_exclusive?: boolean;
  exclusive_until?: string | null;
  is_customer_request?: boolean;
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO projects (id,name,description,location,duration,cover_image,images,pdf_file,created_by,status,admin_approval,ad_id,created_at,updated_at,exclusive_hours,is_exclusive,exclusive_until,is_customer_request)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, input.name, input.description ?? null, input.location ?? null, input.duration ?? null, input.cover_image ?? null, JSON.stringify(input.images ?? []), input.pdf_file ?? null, input.created_by ?? null, input.status ?? "active", input.admin_approval ?? "approved", input.ad_id ?? null, now, now, input.exclusive_hours ?? 6, (input.is_exclusive ?? false) ? 1 : 0, input.exclusive_until ?? null, (input.is_customer_request ?? false) ? 1 : 0],
  );

  // --- Send push notification to all subscribed clients ---
  try {
    const vapidEmail = process.env.VAPID_EMAIL ?? "mailto:admin@alamran.sa";
    const publicKey = process.env.VITE_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (publicKey && privateKey) {
      webpush.setVapidDetails(vapidEmail, publicKey, privateKey);
      const result = await db.execute(
        `SELECT endpoint, p256dh, auth FROM user_push_subscriptions`,
      );
      const subs = rowsToObjects<{ endpoint: string; p256dh: string; auth: string }>(result);
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: "مشروع جديد", body: `تم اضافة: ${input.name}` }),
          );
        } catch (e: any) {
          if (e?.statusCode === 410) {
            await db.execute(
              `DELETE FROM user_push_subscriptions WHERE endpoint = ?`,
              [sub.endpoint],
            );
          }
        }
      }
    }
  } catch (e) {
    console.error("[projects.repo] push notification failed", e);
  }

  return id;
}

export async function updateProject(id: string, patch: Partial<{
  name: string;
  description: string | null;
  location: string | null;
  duration: string | null;
  cover_image: string | null;
  images: string[];
  pdf_file: string | null;
  status: string;
  admin_approval: string;
  exclusive_hours: number;
  is_exclusive: boolean;
  exclusive_until: string | null;
}>): Promise<void> {
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    sets.push(`${k} = ?`);
    args.push(k === "images" ? JSON.stringify(v ?? []) : v as any);
  }
  if (!sets.length) return;
  sets.push(`updated_at = ?`);
  args.push(new Date().toISOString());
  args.push(id);
  await db.execute(`UPDATE projects SET ${sets.join(", ")} WHERE id = ?`, args);
}

export async function deleteProject(id: string): Promise<void> {
  await db.execute(`DELETE FROM projects WHERE id = ?`, [id]);
  await db.execute(`DELETE FROM project_exclusive WHERE project_id = ?`, [id]).catch(() => undefined);
}

// ---------- project_exclusive (time-based) ----------

let _exclReady: Promise<void> | null = null;
function ensureExclusiveTable(): Promise<void> {
  if (_exclReady) return _exclReady;
  _exclReady = db.execute(
    `CREATE TABLE IF NOT EXISTS project_exclusive (
       id           TEXT PRIMARY KEY,
       project_id   TEXT NOT NULL UNIQUE,
       vip_start_at TEXT NOT NULL,
       vip_end_at   TEXT NOT NULL,
       created_at   TEXT NOT NULL DEFAULT (datetime('now'))
     )`,
  ).then(() => undefined).catch(() => undefined);
  return _exclReady;
}

export async function setProjectExclusive(
  projectId: string,
  vipStartAt: string,
  vipEndAt: string,
): Promise<void> {
  await ensureExclusiveTable();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO project_exclusive (id, project_id, vip_start_at, vip_end_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(project_id) DO UPDATE SET vip_start_at = excluded.vip_start_at, vip_end_at = excluded.vip_end_at`,
    [id, projectId, vipStartAt, vipEndAt],
  );
}

export async function getProjectExclusive(projectId: string): Promise<{
  vip_start_at: string;
  vip_end_at: string;
} | null> {
  await ensureExclusiveTable();
  const r = await db.execute(`SELECT vip_start_at, vip_end_at FROM project_exclusive WHERE project_id = ? LIMIT 1`, [projectId]);
  const row = rowsToObjects<any>(r)[0];
  return row ? { vip_start_at: String(row.vip_start_at), vip_end_at: String(row.vip_end_at) } : null;
}

export async function clearProjectExclusive(projectId: string): Promise<void> {
  await ensureExclusiveTable();
  await db.execute(`DELETE FROM project_exclusive WHERE project_id = ?`, [projectId]);
}

export async function clearExpiredExclusivity(): Promise<number> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(
    `UPDATE projects SET is_exclusive = 0, exclusive_until = NULL, updated_at = ?
      WHERE is_exclusive = 1 AND exclusive_until IS NOT NULL
        AND datetime(exclusive_until) <= datetime('now')`,
    [new Date().toISOString()],
  );
  return r.rowsAffected ?? 0;
}
