// Turso repository for `project_requests` - FIXED: no ALTER at runtime
import { db, rowsToObjects } from "./db";

export type ProjectRequestRow = {
  id: string;
  project_id: string | null;
  company_name: string | null;
  project_name: string | null;
  facility_location: string | null;
  email: string | null;
  pdf_url: string | null;
  status: string;
  submitter_type: string | null;
  project_type: string | null;
  note: string | null;
  created_at: string;
  updated_at?: string | null;
};

function decode(r: any): ProjectRequestRow {
  return {
    id: String(r.id),
    project_id: r.project_id ?? null,
    company_name: r.company_name ?? null,
    project_name: r.project_name ?? null,
    facility_location: r.facility_location ?? null,
    email: r.email ?? null,
    pdf_url: r.pdf_url ?? null,
    status: String(r.status ?? "new"),
    submitter_type: r.submitter_type ?? null,
    project_type: r.project_type ?? null,
    note: r.note ?? null,
    created_at: String(r.created_at ?? ""),
    updated_at: r.updated_at ?? null,
  };
}
const COLS = "id,project_id,company_name,project_name,facility_location,email,pdf_url,status,submitter_type,project_type,note,created_at,updated_at";

// دوال ensure صارت no-op لأن الأعمدة موجودة فعلاً - لا تلمس قاعدة البيانات
export function ensureNoteColumn(): Promise<void> { return Promise.resolve(); }
export function ensureUpdatedAtColumn(): Promise<void> { return Promise.resolve(); }
export function ensureProjectTypeColumn(): Promise<void> { return Promise.resolve(); }
export function ensureProjectNameColumn(): Promise<void> { return Promise.resolve(); }

export async function listAllRequests(): Promise<ProjectRequestRow[]> {
  const r = await db.execute(`SELECT ${COLS} FROM project_requests ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function searchRequestsByCompany(q: string): Promise<ProjectRequestRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE company_name LIKE ? ORDER BY created_at DESC LIMIT 50`,
    [`%${trimmed}%`],
  );
  return rowsToObjects(r).map(decode);
}

export async function searchRequestsByEmail(email: string): Promise<ProjectRequestRow[]> {
  const trimmed = email.trim();
  if (!trimmed) return [];
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE lower(email) = lower(?) ORDER BY created_at DESC LIMIT 10`,
    [trimmed],
  );
  return rowsToObjects(r).map(decode);
}

export async function getRequestById(id: string): Promise<ProjectRequestRow | null> {
  const r = await db.execute(`SELECT ${COLS} FROM project_requests WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function getRequestByPdfPath(path: string): Promise<ProjectRequestRow | null> {
  const r = await db.execute(`SELECT ${COLS} FROM project_requests WHERE pdf_url = ? LIMIT 1`, [path]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function insertRequest(input: {
  project_id: string; company_name: string; project_name: string;
  facility_location: string; email: string; pdf_url: string;
  submitter_type: string; project_type?: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO project_requests (id,project_id,company_name,project_name,facility_location,email,pdf_url,status,submitter_type,project_type,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?, 'new', ?, ?, ?, ?)`,
    [id, input.project_id, input.company_name, input.project_name, input.facility_location, input.email, input.pdf_url, input.submitter_type, input.project_type ?? 'platform', new Date().toISOString(), new Date().toISOString()],
  );
  return id;
}

export async function updateRequestStatus(id: string, status: string, note?: string | null): Promise<void> {
  if (note === undefined) {
    await db.execute(`UPDATE project_requests SET status = ?, updated_at = ? WHERE id = ?`, [status, new Date().toISOString(), id]);
    return;
  }
  await db.execute(`UPDATE project_requests SET status = ?, note = ?, updated_at = ? WHERE id = ?`, [status, note, new Date().toISOString(), id]);
}

export async function existsDuplicateRequestByCompanyOrEmail(email: string, companyName: string): Promise<boolean> {
  const e = (email ?? "").trim().toLowerCase(); const c = (companyName ?? "").trim().toLowerCase();
  const r = await db.execute(`SELECT 1 FROM project_requests WHERE LOWER(TRIM(COALESCE(email,''))) = ? OR LOWER(TRIM(COALESCE(company_name,''))) = ? LIMIT 1`, [e, c]);
  return rowsToObjects(r).length > 0;
}

export async function existsDuplicateRequestForProject(projectId: string, email: string, companyName: string): Promise<boolean> {
  const e = (email ?? "").trim().toLowerCase(); const c = (companyName ?? "").trim().toLowerCase();
  const r = await db.execute(`SELECT 1 FROM project_requests WHERE project_id = ? AND LOWER(TRIM(COALESCE(email,''))) = ? AND LOWER(TRIM(COALESCE(company_name,''))) = ? LIMIT 1`, [projectId, e, c]);
  return rowsToObjects(r).length > 0;
}

export async function listRequestsBySource(source: "visitor" | "user"): Promise<ProjectRequestRow[]> {
  const r = await db.execute(`SELECT ${COLS} FROM project_requests WHERE submitter_type = ? ORDER BY created_at DESC`, [source]);
  return rowsToObjects(r).map(decode);
}

export async function listPlatformRequests(): Promise<ProjectRequestRow[]> {
  const r = await db.execute(`SELECT ${COLS} FROM project_requests WHERE project_type = 'platform' OR project_type IS NULL ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}
