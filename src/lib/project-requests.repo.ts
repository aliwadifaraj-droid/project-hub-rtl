// Turso repository for `project_requests`.
import { db, rowsToObjects } from "./db";

export type ProjectRequestRow = {
  id: string;
  project_id: string | null;
  company_name: string | null;
  facility_location: string | null;
  email: string | null;
  pdf_url: string | null;
  status: string;
  submitter_type: string | null;
  project_type: string | null;
  note: string | null;
  created_at: string;
};

function decode(r: any): ProjectRequestRow {
  return {
    id: String(r.id),
    project_id: r.project_id ?? null,
    company_name: r.company_name ?? null,
    facility_location: r.facility_location ?? null,
    email: r.email ?? null,
    pdf_url: r.pdf_url ?? null,
    status: String(r.status ?? "new"),
    submitter_type: r.submitter_type ?? null,
    project_type: r.project_type ?? null,
    note: r.note ?? null,
    created_at: String(r.created_at ?? ""),
  };
}
const COLS = "id,project_id,company_name,facility_location,email,pdf_url,status,submitter_type,project_type,note,created_at";

let _noteColReady: Promise<void> | null = null;
export function ensureNoteColumn(): Promise<void> {
  if (!_noteColReady) {
    _noteColReady = db
      .execute(`ALTER TABLE project_requests ADD COLUMN note TEXT`)
      .then(() => undefined)
      .catch(() => undefined);
  }
  return _noteColReady;
}

let _projectTypeColReady: Promise<void> | null = null;
export function ensureProjectTypeColumn(): Promise<void> {
  if (!_projectTypeColReady) {
    _projectTypeColReady = db
      .execute(`ALTER TABLE project_requests ADD COLUMN project_type TEXT NOT NULL DEFAULT 'platform'`)
      .then(() => undefined)
      .catch(() => undefined);
  }
  return _projectTypeColReady;
}

export async function listAllRequests(): Promise<ProjectRequestRow[]> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(`SELECT ${COLS} FROM project_requests ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function listRequestsBySource(source: "visitor" | "user"): Promise<ProjectRequestRow[]> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE submitter_type = ? ORDER BY created_at DESC`,
    [source],
  );
  return rowsToObjects(r).map(decode);
}

export async function listPlatformRequests(): Promise<ProjectRequestRow[]> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE project_type = 'platform' ORDER BY created_at DESC`,
  );
  return rowsToObjects(r).map(decode);
}

export async function listAddProjectRequests(): Promise<ProjectRequestRow[]> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE project_type = 'add_project' ORDER BY created_at DESC`,
  );
  return rowsToObjects(r).map(decode);
}

export async function searchRequestsByCompany(q: string): Promise<ProjectRequestRow[]> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE company_name LIKE ? ORDER BY created_at DESC LIMIT 50`,
    [`%${q}%`],
  );
  return rowsToObjects(r).map(decode);
}

export async function searchRequestsByEmail(email: string): Promise<ProjectRequestRow[]> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE lower(email) = lower(?) ORDER BY created_at DESC LIMIT 10`,
    [email.trim()],
  );
  return rowsToObjects(r).map(decode);
}

export async function getRequestById(id: string): Promise<ProjectRequestRow | null> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(`SELECT ${COLS} FROM project_requests WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function getRequestByPdfPath(path: string): Promise<ProjectRequestRow | null> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(`SELECT ${COLS} FROM project_requests WHERE pdf_url = ? LIMIT 1`, [path]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function insertRequest(input: {
  project_id: string;
  company_name: string;
  facility_location: string;
  email: string;
  pdf_url: string;
  submitter_type: string;
  project_type?: string;
}): Promise<string> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO project_requests (id,project_id,company_name,facility_location,email,pdf_url,status,submitter_type,project_type,created_at,updated_at)
     VALUES (?,?,?,?,?,?, 'new', ?, ?, ?, ?)`,
    [
      id, input.project_id, input.company_name, input.facility_location,
      input.email, input.pdf_url, input.submitter_type,
      input.project_type ?? 'platform',
      new Date().toISOString(), new Date().toISOString(),
    ],
  );
  return id;
}

export async function updateRequestStatus(id: string, status: string, note?: string | null): Promise<void> {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  if (note === undefined) {
    await db.execute(`UPDATE project_requests SET status = ?, updated_at = ? WHERE id = ?`, [
      status,
      new Date().toISOString(),
      id,
    ]);
    return;
  }
  await db.execute(`UPDATE project_requests SET status = ?, note = ?, updated_at = ? WHERE id = ?`, [
    status,
    note,
    new Date().toISOString(),
    id,
  ]);
}
