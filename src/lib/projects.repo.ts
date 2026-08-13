import { db, rowsToObjects } from "./db";

export interface ProjectRow {
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
  created_at: string;
  offers_enabled: boolean;
  bot_offers_enabled: boolean;
  exclusive_hours: number;
  is_exclusive: boolean;
  exclusive_until: string | null;
}

function mapRow(r: any): ProjectRow {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    description: r.description ?? null,
    location: r.location ?? null,
    duration: r.duration ?? null,
    cover_image: r.cover_image ?? null,
    images: (() => { try { return JSON.parse(r.images ?? "[]"); } catch { return []; } })(),
    pdf_file: r.pdf_file ?? null,
    created_by: r.created_by ?? null,
    status: String(r.status ?? "active"),
    admin_approval: String(r.admin_approval ?? "approved"),
    ad_id: r.ad_id ?? null,
    domain: r.domain ?? null,
    created_at: String(r.created_at ?? ""),
    offers_enabled: Number(r.offers_enabled ?? 1) !== 0,
    bot_offers_enabled: Number(r.bot_offers_enabled ?? 1) !== 0,
    exclusive_hours: Number(r.exclusive_hours ?? 6),
    is_exclusive: Number(r.is_exclusive ?? 0) !== 0,
    exclusive_until: r.exclusive_until ?? null,
  };
}

const COLS = "id,name,description,location,duration,cover_image,images,pdf_file,created_by,status,admin_approval,ad_id,domain,created_at,offers_enabled,bot_offers_enabled,exclusive_hours,is_exclusive,exclusive_until";

export function ensureOffersEnabledColumn(): Promise<void> {
  return Promise.all([
    db.execute(`ALTER TABLE projects ADD COLUMN offers_enabled INTEGER NOT NULL DEFAULT 1`).catch(() => undefined),
    db.execute(`ALTER TABLE projects ADD COLUMN bot_offers_enabled INTEGER NOT NULL DEFAULT 1`).catch(() => undefined),
    db.execute(`ALTER TABLE projects ADD COLUMN exclusive_hours INTEGER NOT NULL DEFAULT 6`).catch(() => undefined),
    db.execute(`ALTER TABLE projects ADD COLUMN is_exclusive INTEGER NOT NULL DEFAULT 0`).catch(() => undefined),
    db.execute(`ALTER TABLE projects ADD COLUMN exclusive_until TEXT`).catch(() => undefined),
  ]).then(() => undefined);
}

export async function listAllProjects(): Promise<ProjectRow[]> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT ${COLS} FROM projects WHERE admin_approval = 'approved' ORDER BY created_at DESC`);
  return rowsToObjects(r).map(mapRow);
}

export async function setOffersEnabled(id: string, enabled: boolean): Promise<void> {
  await ensureOffersEnabledColumn();
  await db.execute(`UPDATE projects SET offers_enabled = ?, updated_at = datetime('now') WHERE id = ?`, [enabled ? 1 : 0, id]);
}

export async function setAllOffersEnabled(enabled: boolean): Promise<void> {
  await ensureOffersEnabledColumn();
  await db.execute(`UPDATE projects SET offers_enabled = ?, updated_at = datetime('now')`, [enabled ? 1 : 0]);
}

export async function isOffersEnabled(id: string): Promise<boolean> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT offers_enabled FROM projects WHERE id = ? LIMIT 1`, [id]);
  return Number((rowsToObjects(r)[0] as any)?.offers_enabled ?? 1) !== 0;
}

export async function setBotOffersEnabled(id: string, enabled: boolean): Promise<void> {
  await ensureOffersEnabledColumn();
  await db.execute(`UPDATE projects SET bot_offers_enabled = ?, updated_at = datetime('now') WHERE id = ?`, [enabled ? 1 : 0, id]);
}

export async function setAllBotOffersEnabled(enabled: boolean): Promise<void> {
  await ensureOffersEnabledColumn();
  await db.execute(`UPDATE projects SET bot_offers_enabled = ?, updated_at = datetime('now')`, [enabled ? 1 : 0]);
}

export async function searchByName(query: string): Promise<ProjectRow[]> {
  const r = await db.execute(
    `SELECT ${COLS} FROM projects WHERE name LIKE ? COLLATE NOCASE ORDER BY created_at DESC LIMIT 50`,
    [`%${query}%`],
  );
  return rowsToObjects<ProjectRow>(r).map(mapRow);
}

export async function listByOwner(userId: string): Promise<ProjectRow[]> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT ${COLS} FROM projects WHERE created_by = ? ORDER BY created_at DESC`, [userId]);
  return rowsToObjects(r).map(mapRow);
}

export async function listPending(): Promise<ProjectRow[]> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT ${COLS} FROM projects WHERE admin_approval = 'pending' ORDER BY created_at DESC`);
  return rowsToObjects(r).map(mapRow);
}

export async function countPending(): Promise<number> {
  const r = await db.execute(`SELECT COUNT(*) AS n FROM projects WHERE admin_approval = 'pending'`);
  return Number((r.rows[0] as any)?.n ?? 0);
}

export async function getById(id: string): Promise<ProjectRow | null> {
  await ensureOffersEnabledColumn();
  const r = await db.execute(`SELECT ${COLS} FROM projects WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function findByOwnerAndName(userId: string, name: string, excludeId?: string): Promise<ProjectRow | null> {
  const sql = excludeId ? `SELECT id FROM projects WHERE created_by = ? AND name = ? AND id <> ? LIMIT 1` : `SELECT id FROM projects WHERE created_by = ? AND name = ? LIMIT 1`;
  const args = excludeId ? [userId, name, excludeId] : [userId, name];
  const r = await db.execute(sql, args);
  const rows = rowsToObjects(r);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function findByAdId(adId: string): Promise<ProjectRow | null> {
  const r = await db.execute(`SELECT id FROM projects WHERE ad_id = ? LIMIT 1`, [adId]);
  const rows = rowsToObjects(r);
  return rows[0] ? mapRow(rows[0]) : null;
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
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO projects (id,name,description,location,duration,cover_image,images,pdf_file,created_by,status,admin_approval,ad_id,created_at,updated_at,exclusive_hours,is_exclusive,exclusive_until)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, input.name, input.description ?? null, input.location ?? null, input.duration ?? null, input.cover_image ?? null, JSON.stringify(input.images ?? []), input.pdf_file ?? null, input.created_by ?? null, input.status ?? "active", input.admin_approval ?? "approved", input.ad_id ?? null, now, now, input.exclusive_hours ?? 6, (input.is_exclusive ?? false) ? 1 : 0, input.exclusive_until ?? null],
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
