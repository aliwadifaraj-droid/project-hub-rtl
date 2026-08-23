import { d as db, r as rowsToObjects } from "./db-BSVZwhof.mjs";
function decode(r) {
  return {
    id: Number(r.id),
    email: String(r.email ?? ""),
    company_name: String(r.company_name ?? ""),
    block_type: String(r.block_type ?? "حظر بالبريد والمؤسسة"),
    created_at: String(r.created_at ?? "")
  };
}
async function addBlockedUser(data) {
  const r = await db.execute(
    `INSERT INTO blocked_users (email, company_name, block_type) VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET company_name = excluded.company_name, block_type = excluded.block_type`,
    [
      data.email,
      data.company_name,
      data.block_type ?? "حظر بالبريد والمؤسسة"
    ]
  );
  return Number(r.lastInsertRowid ?? 0);
}
async function removeBlockedUser(data) {
  await db.execute(`DELETE FROM blocked_users WHERE email = ?`, [data.email]);
}
async function listBlocked() {
  const r = await db.execute(`SELECT * FROM blocked_users ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}
async function isBlocked(companyName, email) {
  const c = (companyName ?? "").trim().toLowerCase();
  const e = (email ?? "").trim().toLowerCase();
  if (!c && !e) return false;
  const r = await db.execute(
    `SELECT 1 FROM blocked_users
     WHERE (? != '' AND LOWER(TRIM(COALESCE(company_name,''))) = ?)
        OR (? != '' AND LOWER(TRIM(COALESCE(email,''))) = ?)
     LIMIT 1`,
    [c, c, e, e]
  );
  return rowsToObjects(r).length > 0;
}
export {
  addBlockedUser as a,
  isBlocked as i,
  listBlocked as l,
  removeBlockedUser as r
};
