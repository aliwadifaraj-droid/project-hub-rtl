// Turso repository for `blocked_users` (companies/emails with block_type).
import { db, rowsToObjects } from "./db";

export type BlockedRow = {
  id: number;
  email: string;
  company_name: string;
  block_type: string;
  created_at: string;
};

function decode(r: any): BlockedRow {
  return {
    id: Number(r.id),
    email: String(r.email ?? ""),
    company_name: String(r.company_name ?? ""),
    block_type: String(r.block_type ?? "حظر بالبريد والمؤسسة"),
    created_at: String(r.created_at ?? ""),
  };
}

export async function addBlockedUser(data: {
  email: string;
  company_name: string;
  block_type?: string;
}): Promise<number> {
  const r = await db.execute(
    `INSERT INTO blocked_users (email, company_name, block_type) VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET company_name = excluded.company_name, block_type = excluded.block_type`,
    [
      data.email,
      data.company_name,
      data.block_type ?? "حظر بالبريد والمؤسسة",
    ],
  );
  return Number((r as any).lastInsertRowid ?? 0);
}

export async function removeBlockedUser(data: { email: string }): Promise<void> {
  await db.execute(`DELETE FROM blocked_users WHERE email = ?`, [data.email]);
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
    `SELECT block_type FROM blocked_users
     WHERE (? != '' AND LOWER(TRIM(COALESCE(company_name,''))) = ?)
        OR (? != '' AND LOWER(TRIM(COALESCE(email,''))) = ?)
     LIMIT 1`,
    [c, c, e, e],
  );
  const rows = rowsToObjects(r);
  if (rows.length === 0) return false;
  const blockType = String(rows[0].block_type ?? "حظر بالبريد والمؤسسة");
  if (blockType === "حظر بالبريد فقط") {
    return !!e;
  }
  if (blockType === "حظر بالمؤسسة فقط") {
    return !!c;
  }
  return true;
}
