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
    created_at: String(r.created_at ?? ""),
  };
}
const COLS = "id,project_id,company_name,facility_location,email,pdf_url,status,submitter_type,created_at";

export async function listAllRequests(): Promise<ProjectRequestRow[]> {
  const r = await db.execute(`SELECT ${COLS} FROM project_requests ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function searchRequestsByCompany(q: string): Promise<ProjectRequestRow[]> {
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE company_name LIKE ? ORDER BY created_at DESC LIMIT 50`,
    [`%${q}%`],
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
  project_id: string;
  company_name: string;
  facility_location: string;
  email: string;
  pdf_url: string;
  submitter_type: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO project_requests (id,project_id,company_name,facility_location,email,pdf_url,status,submitter_type,created_at,updated_at)
     VALUES (?,?,?,?,?,?, 'new', ?, ?, ?)`,
    [
      id, input.project_id, input.company_name, input.facility_location,
      input.email, input.pdf_url, input.submitter_type,
      new Date().toISOString(), new Date().toISOString(),
    ],
  );
  return id;
}

export async function updateRequestStatus(id: string, status: string): Promise<void> {
  await db.execute(
    `UPDATE project_requests SET status = ?, updated_at = ? WHERE id = ?`,
    [status, new Date().toISOString(), id],
  );
}
