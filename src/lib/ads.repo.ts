// Turso repository for `ads` and `ad_comments`.
import { db, rowsToObjects } from "./db";

export type AdRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  status: string; // pending | approved | rejected
  rejection_reason: string | null;
  contact_email: string | null;
  created_by: string | null;
  created_at: string;
};

function decodeAd(r: any): AdRow {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    description: r.description ?? null,
    image_url: r.image_url ?? null,
    link_url: r.link_url ?? null,
    status: String(r.status ?? "pending"),
    rejection_reason: r.rejection_reason ?? null,
    contact_email: r.contact_email ?? null,
    created_by: r.created_by ?? null,
    created_at: String(r.created_at ?? ""),
  };
}
const AD_COLS = "id,title,description,image_url,link_url,status,rejection_reason,contact_email,created_by,created_at";

export async function listAdsByStatus(status: string): Promise<AdRow[]> {
  const r = await db.execute(
    `SELECT ${AD_COLS} FROM ads WHERE status = ? ORDER BY created_at DESC LIMIT 200`,
    [status],
  );
  return rowsToObjects(r).map(decodeAd);
}

export async function countAdsByStatus(status: string): Promise<number> {
  const r = await db.execute(`SELECT COUNT(*) AS n FROM ads WHERE status = ?`, [status]);
  return Number((r.rows[0] as any)?.n ?? 0);
}

export async function getAdById(id: string): Promise<AdRow | null> {
  const r = await db.execute(`SELECT ${AD_COLS} FROM ads WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decodeAd(rows[0]) : null;
}

export async function insertAd(input: {
  title: string;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  status?: string;
  contact_email?: string | null;
  created_by?: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO ads (id,title,description,image_url,link_url,status,contact_email,created_by,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.title,
      input.description ?? null,
      input.image_url ?? null,
      input.link_url ?? null,
      input.status ?? "pending",
      input.contact_email ?? null,
      input.created_by ?? null,
      now,
      now,
    ],
  );
  return id;
}

export async function updateAd(id: string, patch: Partial<{
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  status: string;
  rejection_reason: string | null;
}>): Promise<void> {
  const sets: string[] = []; const args: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    sets.push(`${k} = ?`); args.push(v as any);
  }
  if (!sets.length) return;
  sets.push(`updated_at = ?`); args.push(new Date().toISOString()); args.push(id);
  await db.execute(`UPDATE ads SET ${sets.join(", ")} WHERE id = ?`, args);
}

export async function deleteAd(id: string): Promise<void> {
  await db.execute(`DELETE FROM ads WHERE id = ?`, [id]);
}

// ---- ad_comments ----
export type AdCommentRow = {
  id: string;
  ad_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
};

export async function listAdComments(adId: string): Promise<AdCommentRow[]> {
  const r = await db.execute(
    `SELECT id,ad_id,author_name,body,created_at FROM ad_comments WHERE ad_id = ? ORDER BY created_at DESC LIMIT 100`,
    [adId],
  );
  return rowsToObjects(r).map((x: any) => ({
    id: String(x.id), ad_id: String(x.ad_id),
    author_name: x.author_name ?? null,
    body: String(x.body ?? ""),
    created_at: String(x.created_at ?? ""),
  }));
}

export async function insertAdComment(input: {
  ad_id: string; author_name: string; contact?: string | null; body: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO ad_comments (id,ad_id,author_name,contact,body,created_at) VALUES (?,?,?,?,?,?)`,
    [id, input.ad_id, input.author_name, input.contact ?? null, input.body, new Date().toISOString()],
  );
  return id;
}
