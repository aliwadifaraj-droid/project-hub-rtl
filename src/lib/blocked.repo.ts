// Turso repository for `blocked_users` (companies/emails with block_type).
import { db, rowsToObjects } from "./db";

export type BlockType = "email" | "company" | "both";

export type BlockedRow = {
  id: string;
  company_name: string | null;
  email: string | null;
  block_type: BlockType;
  created_at: string;
};

function decode(r: any): BlockedRow {
  return {
    id: String(r.id),
    company_name: r.company_name ?? null,
    email: r.email ?? null,
    block_type: (r.block_type ?? "both") as BlockType,
    created_at: String(r.created_at ?? ""),
  };
}

export async function insertBlocked(input: {
  company_name?: string | null;
  email?: string | null;
  block_type?: BlockType;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO blocked_users (id, company_name, email, block_type, created_at) VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      input.company_name ?? null,
      input.email ?? null,
      input.block_type ?? "both",
      new Date().toISOString(),
    ],
  );
  return id;
}
export async function removeBlocked(id: any): Promise<void> {
  const realId = typeof id === 'object' ? id.id : id;
  await db.execute({sql: 'DELETE FROM blocked_users WHERE id = ?', args: [String(realId)]})
}

export async function listBlocked(): Promise<BlockedRow[]> {
  const r = await db.execute(`SELECT * FROM blocked_users ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function isBlocked(
  companyName?: string | null,
  email?: string | null,
): Promise<boolean> {
  const c = (companyName ?? "").trim().toLowerCase();
  const e = (email ?? "").trim().toLowerCase();
  if (!c && !e) return false;
  const r = await db.execute(
    `SELECT 1 FROM blocked_users
     WHERE (block_type IN ('company','both') AND ? != '' AND LOWER(TRIM(COALESCE(company_name,''))) = ?)
        OR (block_type IN ('email','both')   AND ? != '' AND LOWER(TRIM(COALESCE(email,''))) = ?)
     LIMIT 1`,
    [c, c, e, e],
  );
  return rowsToObjects(r).length > 0;
}
