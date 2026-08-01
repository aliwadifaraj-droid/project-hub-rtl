// Turso repository for `offers` (price offers submitted from the support bot).
import { db, rowsToObjects } from "./db";

export type OfferRow = {
  id: string;
  project_id: string | null;
  project_name: string;
  company_name: string;
  email: string;
  amount: string;
  duration: string | null;
  pdf_key: string | null;
  pdf_filename: string | null;
  status: string;
  visitor_token: string | null;
  created_at: string;
};

function decode(r: any): OfferRow {
  return {
    id: String(r.id),
    project_id: r.project_id ?? null,
    project_name: String(r.project_name ?? ""),
    company_name: String(r.company_name ?? ""),
    email: String(r.email ?? ""),
    amount: String(r.amount ?? ""),
    duration: r.duration ?? null,
    pdf_key: r.pdf_key ?? null,
    pdf_filename: r.pdf_filename ?? null,
    status: String(r.status ?? "new"),
    visitor_token: r.visitor_token ?? null,
    created_at: String(r.created_at ?? ""),
  };
}

export type OfferInsert = Omit<OfferRow, "id" | "created_at" | "status"> & { status?: string };

export async function insertOffer(o: OfferInsert): Promise<string> {
  // 1. تحقق أول شي إذا المشروع موجود
  const project = await findProjectForOffer(o.project_name);
  if (!project) {
    throw new Error("المشروع غير موجود في المنصة");
  }

  // 2. لو موجود سجل العرض
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO offers (id, project_id, project_name, company_name, email, amount, duration, pdf_key, pdf_filename, status, visitor_token, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      project.id,
      project.name,
      o.company_name,
      o.email,
      o.amount,
      project.duration ?? o.duration,
      o.pdf_key ?? null,
      o.pdf_filename ?? null,
      o.status ?? "new",
      o.visitor_token ?? null,
      new Date().toISOString(),
    ],
  );
  return id;
}
}
}

export async function listOffers(limit = 200): Promise<OfferRow[]> {
  const r = await db.execute(`SELECT * FROM offers ORDER BY created_at DESC LIMIT ?`, [limit]);
  return rowsToObjects(r).map(decode);
}

export async function countNewOffers(): Promise<number> {
  const r = await db.execute(`SELECT COUNT(*) AS c FROM offers WHERE status = 'new'`);
  return Number(rowsToObjects<{ c: number }>(r)[0]?.c ?? 0);
}

export async function updateOfferStatus(id: string, status: string): Promise<void> {
  await db.execute(`UPDATE offers SET status = ? WHERE id = ?`, [status, id]);
}

export async function deleteOffer(id: string): Promise<void> {
  await db.execute(`DELETE FROM offers WHERE id = ?`, [id]);
}

/** Find a project by (fuzzy) name to attach its id + duration to the offer. */
export async function findProjectForOffer(name: string): Promise<{ id: string; name: string; duration: string | null } | null> {
  const n = (name ?? "").trim();
  if (!n) return null;
  const r = await db.execute(
    `SELECT id, name, duration FROM projects WHERE name = ? OR name LIKE ? ORDER BY LENGTH(name) ASC LIMIT 1`,
    [n, `%${n}%`],
  );
  const row = rowsToObjects<any>(r)[0];
  return row ? { id: String(row.id), name: String(row.name), duration: row.duration ?? null } : null;
}

export async function listAdminUserIds(): Promise<string[]> {
  const r = await db.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
  return rowsToObjects<{ user_id: string }>(r).map((x) => String(x.user_id));
}
