// Repository for the `files` table on Turso. Server-only.
import { db, rowsToObjects } from "./db";

export type FileRow = {
  id: string;
  r2_key: string;
  filename: string;
  mime: string | null;
  size: number;
  purpose: string | null;   // project-image | bid-pdf | vip-receipt | other
  uploaded_by: string | null;
  created_at: string;
};

function decode(r: any): FileRow {
  return {
    id: String(r.id),
    r2_key: String(r.r2_key),
    filename: String(r.filename ?? ""),
    mime: r.mime ?? null,
    size: Number(r.size ?? 0),
    purpose: r.purpose ?? null,
    uploaded_by: r.uploaded_by ?? null,
    created_at: String(r.created_at ?? ""),
  };
}

export async function insertFile(input: {
  r2_key: string;
  filename: string;
  mime?: string | null;
  size: number;
  purpose?: string | null;
  uploaded_by?: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO files (id, r2_key, filename, mime, size, purpose, uploaded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.r2_key,
      input.filename,
      input.mime ?? null,
      input.size,
      input.purpose ?? null,
      input.uploaded_by ?? null,
      new Date().toISOString(),
    ],
  );
  return id;
}

export async function getFileById(id: string): Promise<FileRow | null> {
  const r = await db.execute("SELECT * FROM files WHERE id = ? LIMIT 1", [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function getFileByKey(key: string): Promise<FileRow | null> {
  const r = await db.execute("SELECT * FROM files WHERE r2_key = ? LIMIT 1", [key]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}

export async function deleteFileRow(id: string): Promise<void> {
  await db.execute("DELETE FROM files WHERE id = ?", [id]);
}
