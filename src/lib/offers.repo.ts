// Turso repository for `offers` (price offers submitted from the support bot and add-project form).
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
  source: string;
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
    source: String(r.source ?? "platform"),
    created_at: String(r.created_at ?? ""),
  };
}

export type OfferInsert = Omit<OfferRow, "id" | "created_at" | "status" | "source"> & { status?: string; source?: string };

let _sourceColReady: Promise<void> | null = null;
export function ensureSourceColumn(): Promise<void> {
  if (!_sourceColReady) {
    _sourceColReady = db
      .execute(`ALTER TABLE offers ADD COLUMN source TEXT NOT NULL DEFAULT 'platform'`)
      .then(() => undefined)
      .catch(() => undefined);
  }
  return _sourceColReady;
}

export async function insertOffer(o: OfferInsert): Promise<string> {
  await ensureSourceColumn();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO offers (id, project_id, project_name, company_name, email, amount, duration, pdf_key, pdf_filename, status, visitor_token, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      o.project_id ?? null,
      o.project_name,
      o.company_name,
      o.email,
      o.amount,
      o.duration ?? null,
      o.pdf_key ?? null,
      o.pdf_filename ?? null,
      o.status ?? "new",
      o.visitor_token ?? null,
      o.source ?? "platform",
      new Date().toISOString(),
    ],
  );
  return id;
}

export async function listOffers(limit = 200): Promise<OfferRow[]> {
  await ensureSourceColumn();
  const r = await db.execute(
    `SELECT o.* FROM offers o
     LEFT JOIN projects p ON o.project_id = p.id
     WHERE o.project_id IS NOT NULL
       AND (p.is_customer_request = 0 OR p.is_customer_request IS NULL)
     ORDER BY o.created_at DESC LIMIT ?`,
    [limit],
  );
  return rowsToObjects(r).map(decode);
}

export async function listCustomerRequestOffers(limit = 200): Promise<OfferRow[]> {
  await ensureSourceColumn();
  const { ensureOffersEnabledColumn } = await import("./projects.repo");
  await ensureOffersEnabledColumn();
  const r = await db.execute(
    `SELECT o.* FROM offers o
     INNER JOIN projects p ON o.project_id = p.id
     WHERE p.is_customer_request = 1
     ORDER BY o.created_at DESC LIMIT ?`,
    [limit],
  );
  return rowsToObjects(r).map(decode);
}

export async function listOffersBySource(source: "platform" | "add_project", limit = 200): Promise<OfferRow[]> {
  await ensureSourceColumn();
  const r = await db.execute(
    `SELECT * FROM offers WHERE source = ? ORDER BY created_at DESC LIMIT ?`,
    [source, limit],
  );
  return rowsToObjects(r).map(decode);
}

export async function countNewOffers(): Promise<number> {
  const r = await db.execute(`SELECT COUNT(*) AS c FROM offers WHERE status = 'new'`);
  return Number(rowsToObjects<{ c: number }>(r)[0]?.c ?? 0);
}

export async function updateOfferStatus(id: string, status: string, note?: string): Promise<void> {
  if (note === undefined) {
    await db.execute(`UPDATE offers SET status = ? WHERE id = ?`, [status, id]);
    return;
  }
  await db.execute(`UPDATE offers SET status = ? WHERE id = ?`, [status, id]);
}

export async function deleteOffer(id: string): Promise<void> {
  await db.execute(`DELETE FROM offers WHERE id = ?`, [id]);
}

/** Find a project by (fuzzy) name to attach its id + duration to the offer. */
export async function findProjectForOffer(name: string): Promise<{ id: string; name: string; duration: string | null; offers_enabled: boolean; bot_offers_enabled: boolean } | null> {
  const n = (name ?? "").trim();
  if (!n) return null;
  const { ensureOffersEnabledColumn } = await import("./projects.repo");
  await ensureOffersEnabledColumn();
  const r = await db.execute(
    `SELECT id, name, duration, offers_enabled, bot_offers_enabled FROM projects WHERE name = ? OR name LIKE ? ORDER BY LENGTH(name) ASC LIMIT 1`,
    [n, `%${n}%`],
  );
  const row = rowsToObjects<any>(r)[0];
  return row
    ? {
        id: String(row.id),
        name: String(row.name),
        duration: row.duration ?? null,
        offers_enabled: Number(row.offers_enabled ?? 1) !== 0,
        bot_offers_enabled: Number(row.bot_offers_enabled ?? 1) !== 0,
      }
    : null;
}

export async function listAdminUserIds(): Promise<string[]> {
  const r = await db.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
  return rowsToObjects<{ user_id: string }>(r).map((x) => String(x.user_id));
}

export async function getOfferById(id: string): Promise<OfferRow | null> {
  await ensureSourceColumn();
  const r = await db.execute(`SELECT * FROM offers WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects<any>(r)[0];
  return row ? decode(row) : null;
}

export async function getOfferByPdfPath(path: string): Promise<OfferRow | null> {
  await ensureSourceColumn();
  const r = await db.execute(`SELECT * FROM offers WHERE pdf_key = ? LIMIT 1`, [path]);
  const row = rowsToObjects<any>(r)[0];
  return row ? decode(row) : null;
}

export async function searchOffersByEmail(email: string): Promise<OfferRow[]> {
  const r = await db.execute(
    `SELECT * FROM offers WHERE lower(email) = lower(?) ORDER BY created_at DESC LIMIT 10`,
    [email.trim()],
  );
  return rowsToObjects(r).map(decode);
}

export async function searchOffersByCompany(q: string): Promise<OfferRow[]> {
  const r = await db.execute(
    `SELECT * FROM offers WHERE company_name LIKE ? ORDER BY created_at DESC LIMIT 10`,
    [`%${q}%`],
  );
  return rowsToObjects(r).map(decode);
}

/** True when an offer/request already exists for the same project + (email or company). */
export async function existsDuplicateOffer(
  projectName: string,
  email: string,
  companyName: string,
): Promise<boolean> {
  const p = (projectName ?? "").trim().toLowerCase();
  const e = (email ?? "").trim().toLowerCase();
  const c = (companyName ?? "").trim().toLowerCase();

  const o = await db.execute(
    `SELECT 1 FROM offers
     WHERE LOWER(TRIM(project_name)) = ?
       AND (LOWER(TRIM(email)) = ? OR LOWER(TRIM(company_name)) = ?)
     LIMIT 1`,
    [p, e, c],
  );
  if (rowsToObjects(o).length > 0) return true;

  try {
    const r = await db.execute(
      `SELECT 1 FROM project_requests
       WHERE LOWER(TRIM(COALESCE(facility_location,''))) = ?
         AND (LOWER(TRIM(COALESCE(email,''))) = ? OR LOWER(TRIM(COALESCE(company_name,''))) = ?)
       LIMIT 1`,
      [p, e, c],
    );
    return rowsToObjects(r).length > 0;
  } catch {
    return false;
  }
}
