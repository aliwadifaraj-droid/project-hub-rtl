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
    created_at: String(r.created_at ?? ""),
  };
}

const COLS = "id,name,description,location,duration,cover_image,images,pdf_file,created_by,status,admin_approval,ad_id,domain,created_at";

export async function listAllProjects(): Promise<ProjectRow[]> {
  const r = await db.execute(`SELECT ${COLS} FROM projects ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function listByOwner(userId: string): Promise<ProjectRow[]> {
  const r = await db.execute(
    `SELECT ${COLS} FROM projects WHERE created_by = ? ORDER BY created_at DESC`,
    [userId],
  );
  return rowsToObjects(r).map(decode);
}

export async function listPending(): Promise<ProjectRow[]> {
  const r = await db.execute(
    `SELECT ${COLS} FROM projects WHERE admin_approval = 'pending' ORDER BY created_at DESC`,
  );
  return rowsToObjects(r).map(decode);
}

export async function countPending(): Promise<number> {
  const r = await db.execute(`SELECT COUNT(*) AS n FROM projects WHERE admin_approval = 'pending'`);
  return Number((r.rows[0] as any)?.n ?? 0);
}

export async function getById(id: string): Promise<ProjectRow | null> {
  const r = await db.execute(`SELECT ${COLS} FROM projects WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function findByOwnerAndName(userId: string, name: string, excludeId?: string): Promise<ProjectRow | null> {
  const sql = excludeId
    ? `SELECT id FROM projects WHERE created_by = ? AND name = ? AND id <> ? LIMIT 1`
    : `SELECT id FROM projects WHERE created_by = ? AND name = ? LIMIT 1`;
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
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO projects (id,name,description,location,duration,cover_image,images,pdf_file,created_by,status,admin_approval,ad_id,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.name,
      input.description ?? null,
      input.location ?? null,
      input.duration ?? null,
      input.cover_image ?? null,
      JSON.stringify(input.images ?? []),
      input.pdf_file ?? null,
      input.created_by ?? null,
      input.status ?? "active",
      input.admin_approval ?? "approved",
      input.ad_id ?? null,
      now,
      now,
    ],
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
}
