// Turso repository for `project_submissions`.
import { db, rowsToObjects } from "./db";

export type ProjectSubmissionRow = {
  id: string;
  submitter_id: string | null;
  name: string | null;
  description: string | null;
  location: string | null;
  duration: string | null;
  cover_image: string | null;
  images: string[];
  contact_phone: string | null;
  status: string;
  approved_project_id: string | null;
  created_at: string;
};

function decode(r: any): ProjectSubmissionRow {
  let images: string[] = [];
  try { images = r.images ? JSON.parse(r.images) : []; } catch { images = []; }
  return {
    id: String(r.id),
    submitter_id: r.submitter_id ?? null,
    name: r.name ?? null,
    description: r.description ?? null,
    location: r.location ?? null,
    duration: r.duration ?? null,
    cover_image: r.cover_image ?? null,
    images,
    contact_phone: r.contact_phone ?? null,
    status: String(r.status ?? "pending"),
    approved_project_id: r.approved_project_id ?? null,
    created_at: String(r.created_at ?? ""),
  };
}

const COLS = "id,submitter_id,name,description,location,duration,cover_image,images,contact_phone,status,approved_project_id,created_at";

let _contactPhoneColReady: Promise<void> | null = null;
export function ensureContactPhoneColumn(): Promise<void> {
  if (!_contactPhoneColReady) {
    _contactPhoneColReady = db
      .execute(`ALTER TABLE project_submissions ADD COLUMN contact_phone TEXT`)
      .then(() => undefined)
      .catch(() => undefined);
  }
  return _contactPhoneColReady;
}

let _approvedProjectIdColReady: Promise<void> | null = null;
export function ensureApprovedProjectIdColumn(): Promise<void> {
  if (!_approvedProjectIdColReady) {
    _approvedProjectIdColReady = db
      .execute(`ALTER TABLE project_submissions ADD COLUMN approved_project_id TEXT`)
      .then(() => undefined)
      .catch(() => undefined);
  }
  return _approvedProjectIdColReady;
}

async function ensureColumns(): Promise<void> {
  await ensureContactPhoneColumn();
  await ensureApprovedProjectIdColumn();
}

export async function listAllSubmissions(): Promise<ProjectSubmissionRow[]> {
  await ensureColumns();
  const r = await db.execute(`SELECT ${COLS} FROM project_submissions ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function getSubmissionById(id: string): Promise<ProjectSubmissionRow | null> {
  await ensureColumns();
  const r = await db.execute(`SELECT ${COLS} FROM project_submissions WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function insertSubmission(input: {
  name: string;
  description: string;
  location: string;
  contact_phone: string;
  images: string[];
  submitter_id?: string | null;
  duration?: string | null;
  cover_image?: string | null;
}): Promise<string> {
  await ensureColumns();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO project_submissions (id,submitter_id,name,description,location,duration,cover_image,images,contact_phone,status,created_at)
     VALUES (?,?,?,?,?,?,?,?,?, 'pending', ?)`,
    [
      id,
      input.submitter_id ?? null,
      input.name,
      input.description,
      input.location,
      input.duration ?? null,
      input.cover_image ?? null,
      JSON.stringify(input.images ?? []),
      input.contact_phone,
      now,
    ],
  );
  return id;
}

export async function markSubmissionApproved(id: string, approvedProjectId: string): Promise<void> {
  await ensureColumns();
  await db.execute(
    `UPDATE project_submissions SET status = 'approved', approved_project_id = ? WHERE id = ?`,
    [approvedProjectId, id],
  );
}

export async function deleteSubmission(id: string): Promise<void> {
  await db.execute(`DELETE FROM project_submissions WHERE id = ?`, [id]);
}
