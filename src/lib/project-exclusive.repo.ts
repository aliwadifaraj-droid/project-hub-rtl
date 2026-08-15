// Turso repository for `project_exclusive` (offers submitted from platform project pages).
import { db, rowsToObjects } from "./db";

export type ProjectExclusiveRow = {
  id: string;
  project_id: string;
  company_name: string;
  facility_location: string;
  email: string;
  phone: string | null;
  pdf_url: string | null;
  status: string;
  submitter_type: string | null;
  note: string | null;
  created_at: string;
};

function decode(r: any): ProjectExclusiveRow {
  return {
    id: String(r.id),
    project_id: String(r.project_id ?? ""),
    company_name: String(r.company_name ?? ""),
    facility_location: String(r.facility_location ?? ""),
    email: String(r.email ?? ""),
    phone: r.phone ?? null,
    pdf_url: r.pdf_url ?? null,
    status: String(r.status ?? "new"),
    submitter_type: r.submitter_type ?? null,
    note: r.note ?? null,
    created_at: String(r.created_at ?? ""),
  };
}

let _tableReady: Promise<void> | null = null;
export function ensureTable(): Promise<void> {
  if (!_tableReady) {
    _tableReady = db
      .execute(
        `CREATE TABLE IF NOT EXISTS project_exclusive (
          id                TEXT PRIMARY KEY,
          project_id        TEXT NOT NULL,
          company_name      TEXT,
          facility_location TEXT,
          email             TEXT,
          phone             TEXT,
          pdf_url           TEXT,
          status            TEXT NOT NULL DEFAULT 'new',
          submitter_type    TEXT,
          note              TEXT,
          created_at        TEXT NOT NULL
        )`,
      )
      .then(() => db.execute(`ALTER TABLE project_exclusive ADD COLUMN company_name TEXT`).catch(() => undefined))
      .then(() => db.execute(`ALTER TABLE project_exclusive ADD COLUMN facility_location TEXT`).catch(() => undefined))
      .then(() => db.execute(`ALTER TABLE project_exclusive ADD COLUMN email TEXT`).catch(() => undefined))
      .then(() => db.execute(`ALTER TABLE project_exclusive ADD COLUMN phone TEXT`).catch(() => undefined))
      .then(() => db.execute(`ALTER TABLE project_exclusive ADD COLUMN pdf_url TEXT`).catch(() => undefined))
      .then(() => db.execute(`ALTER TABLE project_exclusive ADD COLUMN status TEXT NOT NULL DEFAULT 'new'`).catch(() => undefined))
      .then(() => db.execute(`ALTER TABLE project_exclusive ADD COLUMN submitter_type TEXT`).catch(() => undefined))
      .then(() => db.execute(`ALTER TABLE project_exclusive ADD COLUMN note TEXT`).catch(() => undefined))
      .then(() => db.execute(`CREATE INDEX IF NOT EXISTS idx_project_exclusive_project ON project_exclusive(project_id)`))
      .then(() => db.execute(`CREATE INDEX IF NOT EXISTS idx_project_exclusive_created ON project_exclusive(created_at DESC)`))
      .then(() => undefined)
      .catch(() => undefined);
  }
  return _tableReady;
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
  await ensureTable();
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
  await ensureTable();
  const r = await db.execute(`SELECT * FROM project_exclusive ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function updateExclusiveStatus(id: string, status: string, note?: string | null): Promise<void> {
  await ensureTable();
  if (note === undefined) {
    await db.execute(`UPDATE project_exclusive SET status = ? WHERE id = ?`, [status, id]);
    return;
  }
  await db.execute(`UPDATE project_exclusive SET status = ?, note = ? WHERE id = ?`, [status, note, id]);
}

export async function getExclusiveById(id: string): Promise<ProjectExclusiveRow | null> {
  await ensureTable();
  const r = await db.execute(`SELECT * FROM project_exclusive WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects<any>(r)[0];
  return row ? decode(row) : null;
}

export async function deleteExclusive(id: string): Promise<void> {
  await ensureTable();
  await db.execute(`DELETE FROM project_exclusive WHERE id = ?`, [id]);
}

export async function searchExclusiveByEmail(email: string): Promise<ProjectExclusiveRow[]> {
  await ensureTable();
  const r = await db.execute(
    `SELECT * FROM project_exclusive WHERE lower(email) = lower(?) ORDER BY created_at DESC LIMIT 10`,
    [email.trim()],
  );
  return rowsToObjects(r).map(decode);
}

export async function searchExclusiveByCompany(q: string): Promise<ProjectExclusiveRow[]> {
  await ensureTable();
  const r = await db.execute(
    `SELECT * FROM project_exclusive WHERE company_name LIKE ? ORDER BY created_at DESC LIMIT 10`,
    [`%${q}%`],
  );
  return rowsToObjects(r).map(decode);
}
