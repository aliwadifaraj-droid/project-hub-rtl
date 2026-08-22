// Turso repository for `project_exclusive`.
import { db, rowsToObjects } from "./db";

export type ProjectExclusiveRow = {
  id: string;
  project_id: string;
  vip_start_at: string | null;
  vip_end_at: string | null;
  created_at: string;
  duration_hours: number | null;
  is_exclusive: boolean;
  remaining_hours: number | null;
  exclusive_until: string | null;
  company_name: string | null;
  facility_location: string | null;
  email: string | null;
  phone: string | null;
  pdf_url: string | null;
  status: string;
  submitter_type: string | null;
  note: string | null;
};

function decode(r: any): ProjectExclusiveRow {
  return {
    id: String(r.id),
    project_id: String(r.project_id ?? ""),
    vip_start_at: r.vip_start_at ?? null,
    vip_end_at: r.vip_end_at ?? null,
    created_at: String(r.created_at ?? ""),
    duration_hours: r.duration_hours == null ? null : Number(r.duration_hours),
    is_exclusive: Number(r.is_exclusive ?? 0) !== 0,
    remaining_hours: r.remaining_hours == null ? null : Number(r.remaining_hours),
    exclusive_until: r.exclusive_until ?? null,
    company_name: r.company_name ?? null,
    facility_location: r.facility_location ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    pdf_url: r.pdf_url ?? null,
    status: String(r.status ?? "new"),
    submitter_type: r.submitter_type ?? null,
    note: r.note ?? null,
  };
}

export async function insertExclusive(input: {
  project_id: string;
  company_name: string;
  facility_location: string;
  email: string;
  phone?: string | null;
  pdf_url: string;
  submitter_type: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO project_exclusive (id, project_id, company_name, facility_location, email, phone, pdf_url, status, submitter_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    [
      id,
      input.project_id,
      input.company_name,
      input.facility_location,
      input.email,
      input.phone ?? null,
      input.pdf_url,
      input.submitter_type,
      new Date().toISOString(),
    ],
  );
  return id;
}

export async function listAllExclusive(): Promise<ProjectExclusiveRow[]> {
  const r = await db.execute(`SELECT * FROM project_exclusive ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function updateExclusiveStatus(id: string, status: string, note?: string | null): Promise<void> {
  if (note === undefined) {
    await db.execute(`UPDATE project_exclusive SET status = ? WHERE id = ?`, [status, id]);
    return;
  }
  await db.execute(`UPDATE project_exclusive SET status = ?, note = ? WHERE id = ?`, [status, note, id]);
}

export async function getExclusiveById(id: string): Promise<ProjectExclusiveRow | null> {
  const r = await db.execute(`SELECT * FROM project_exclusive WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects<any>(r)[0];
  return row ? decode(row) : null;
}

export async function deleteExclusive(id: string): Promise<void> {
  await db.execute(`DELETE FROM project_exclusive WHERE id = ?`, [id]);
}

export async function searchExclusiveByEmail(email: string): Promise<ProjectExclusiveRow[]> {
  const r = await db.execute(
    `SELECT * FROM project_exclusive WHERE lower(email) = lower(?) ORDER BY created_at DESC LIMIT 10`,
    [email.trim()],
  );
  return rowsToObjects(r).map(decode);
}

export async function searchExclusiveByCompany(q: string): Promise<ProjectExclusiveRow[]> {
  const r = await db.execute(
    `SELECT * FROM project_exclusive WHERE company_name LIKE ? ORDER BY created_at DESC LIMIT 10`,
    [`%${q}%`],
  );
  return rowsToObjects(r).map(decode);
}

export async function setExclusiveWindow(input: {
  project_id: string;
  vip_start_at: string;
  vip_end_at: string;
  duration_hours: number;
}): Promise<void> {
  await db.execute(
    `INSERT INTO project_exclusive
      (id, project_id, vip_start_at, vip_end_at, created_at, duration_hours, is_exclusive, remaining_hours, exclusive_until)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(project_id) DO UPDATE SET
       vip_start_at = excluded.vip_start_at,
       vip_end_at = excluded.vip_end_at,
       duration_hours = excluded.duration_hours,
       is_exclusive = 1,
       remaining_hours = excluded.remaining_hours,
       exclusive_until = excluded.exclusive_until`,
    [
      crypto.randomUUID(),
      input.project_id,
      input.vip_start_at,
      input.vip_end_at,
      new Date().toISOString(),
      input.duration_hours,
      input.duration_hours,
      input.vip_end_at,
    ],
  );
}

export async function getExclusiveWindow(projectId: string): Promise<{
  vip_start_at: string;
  vip_end_at: string;
  duration_hours: number;
  is_exclusive: boolean;
  remaining_hours: number;
  exclusive_until: string;
} | null> {
  const r = await db.execute(
    `SELECT vip_start_at, vip_end_at, duration_hours, is_exclusive, remaining_hours, exclusive_until
       FROM project_exclusive
      WHERE project_id = ? AND is_exclusive = 1
      LIMIT 1`,
    [projectId],
  );
  const row = rowsToObjects<any>(r)[0];
  if (!row || !row.vip_end_at || Number(row.is_exclusive) === 0) return null;
  const remaining = Math.max(0, (new Date(String(row.vip_end_at)).getTime() - Date.now()) / 3600000);
  if (remaining <= 0) return null;
  return {
    vip_start_at: String(row.vip_start_at ?? ""),
    vip_end_at: String(row.vip_end_at),
    duration_hours: Number(row.duration_hours ?? 0),
    is_exclusive: true,
    remaining_hours: remaining,
    exclusive_until: String(row.exclusive_until ?? row.vip_end_at),
  };
}
