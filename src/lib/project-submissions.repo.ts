// Turso repository for `project_submissions`.
import { db, rowsToObjects } from "./db";

export type SubmissionRow = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  contact_phone: string | null;
  images: string[];
  status: string;
  approved_project_id: string | null;
  created_at: string;
};

function decode(r: any): SubmissionRow {
  let images: string[] = [];
  try { images = r.images ? JSON.parse(r.images) : []; } catch { images = []; }
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    description: r.description ?? null,
    location: r.location ?? null,
    contact_phone: r.contact_phone ?? null,
    images,
    status: String(r.status ?? "pending"),
    approved_project_id: r.approved_project_id ?? null,
    created_at: String(r.created_at ?? ""),
  };
}
const COLS = "id,name,description,location,contact_phone,images,status,approved_project_id,created_at";

export async function listAllSubmissions(): Promise<SubmissionRow[]> {
  const r = await db.execute(`SELECT ${COLS} FROM project_submissions ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function getSubmissionById(id: string): Promise<SubmissionRow | null> {
  const r = await db.execute(`SELECT ${COLS} FROM project_submissions WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function insertSubmission(input: {
  name: string; description: string; location: string;
  contact_phone: string; images: string[];
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO project_submissions (id,name,description,location,contact_phone,images,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?, 'pending', ?, ?)`,
    [
      id, input.name, input.description, input.location, input.contact_phone,
      JSON.stringify(input.images ?? []),
      new Date().toISOString(), new Date().toISOString(),
    ],
  );
  return id;
}

export async function markSubmissionApproved(id: string, projectId: string): Promise<void> {
  await db.execute(
    `UPDATE project_submissions SET status = 'approved', approved_project_id = ?, updated_at = ? WHERE id = ?`,
    [projectId, new Date().toISOString(), id],
  );
}

export async function deleteSubmission(id: string): Promise<void> {
  await db.execute(`DELETE FROM project_submissions WHERE id = ?`, [id]);
}
