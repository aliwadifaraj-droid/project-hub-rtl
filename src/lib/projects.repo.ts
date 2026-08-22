// Turso repository for `projects`.
import { db, rowsToObjects } from "./db";

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
  await db.execute(`DELETE FROM project_vip_windows WHERE project_id = ?`, [id]).catch(() => undefined);
}

/** Recalculate the exclusivity window from "now" for the given duration. */
export async function updateProjectExclusivity(projectId: string, durationHours: number): Promise<void> {
  const now = new Date();
  const endAt = new Date(now.getTime() + durationHours * 3600_000);
  const { setVipWindow } = await import("./exclusive-window");
  await setVipWindow(projectId, now.toISOString(), endAt.toISOString());
  await updateProject(projectId, {
    is_exclusive: durationHours > 0,
    exclusive_until: durationHours > 0 ? endAt.toISOString() : null,
    exclusive_hours: durationHours > 0 ? durationHours : undefined,
  });
}

/** Convenience: set is_exclusive flag + exclusive_hours on a project. */
export async function setExclusive(projectId: string, enabled: boolean, hours: number): Promise<void> {
  if (enabled) {
    const now = new Date();
    const endAt = new Date(now.getTime() + hours * 3600_000);
    const { setVipWindow } = await import("./exclusive-window");
    await setVipWindow(projectId, now.toISOString(), endAt.toISOString());
    await updateProject(projectId, { is_exclusive: true, exclusive_until: endAt.toISOString(), exclusive_hours: hours });
  } else {
    await updateProject(projectId, { is_exclusive: false, exclusive_until: null });
  }
}

// ---------- project_vip_windows (time-based exclusivity) ----------
// Backward-compatible wrappers around exclusive-window.ts.
// Old code referenced vip_start_at / vip_end_at; the new table uses
// locked_from / locked_until but we expose the old names here.

export async function setProjectExclusive(
  projectId: string,
  vipStartAt: string,
  vipEndAt: string,
): Promise<void> {
  const { setVipWindow } = await import("./exclusive-window");
  await setVipWindow(projectId, vipStartAt, vipEndAt);
}

export async function getProjectExclusive(projectId: string): Promise<{
  vip_start_at: string;
  vip_end_at: string;
} | null> {
  const { getVipWindow } = await import("./exclusive-window");
  const w = await getVipWindow(projectId);
  if (!w) return null;
  return { vip_start_at: w.locked_from, vip_end_at: w.locked_until };
}
