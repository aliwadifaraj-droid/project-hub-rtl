import { db, rowsToObjects } from "./db";

export type VipSubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  status: "active" | "rejected" | "pending";
  project_id: string | null;
  created_at: string;
  expires_at: string | null;
};

function decode(row: any): VipSubscriberRow {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    name: row.name ?? null,
    phone: row.phone ?? null,
    city: row.city ?? null,
    status: String(row.status ?? "pending") as VipSubscriberRow["status"],
    project_id: row.project_id ?? null,
    created_at: String(row.created_at ?? ""),
    expires_at: row.expires_at ?? null,
  };
}

let _cityColReady: Promise<void> | null = null;
function ensureCityColumn(): Promise<void> {
  if (_cityColReady) return _cityColReady;
  _cityColReady = db
    .execute(`ALTER TABLE vip_subscribers ADD COLUMN city TEXT`)
    .catch(() => undefined);
  return _cityColReady;
}

export async function listVipSubscribers(): Promise<VipSubscriberRow[]> {
  await ensureCityColumn();
  const r = await db.execute(`SELECT * FROM vip_subscribers ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function listVipWithProjectNames(): Promise<(VipSubscriberRow & { project_name: string | null })[]> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT v.*, p.name AS project_name FROM vip_subscribers v LEFT JOIN projects p ON v.project_id = p.id ORDER BY v.created_at DESC`,
  );
  return rowsToObjects(r).map((row: any) => ({
    ...decode(row),
    project_name: row.project_name ?? null,
  }));
}

export async function approveByProject(projectId: string): Promise<VipSubscriberRow | null> {
  await ensureCityColumn();
  const r = await db.execute(
    `UPDATE vip_subscribers SET status = 'active' WHERE project_id = ? AND status = 'pending' RETURNING *`,
    [projectId],
  );
  const row = rowsToObjects(r)[0];
  return row ? decode(row) : null;
}

export async function approveById(id: string): Promise<void> {
  await db.execute(`UPDATE vip_subscribers SET status = 'active' WHERE id = ?`, [id]);
}

export async function rejectById(id: string): Promise<void> {
  await db.execute(`UPDATE vip_subscribers SET status = 'rejected' WHERE id = ?`, [id]);
}

export async function listApprovedByProject(projectId: string): Promise<VipSubscriberRow[]> {
  await ensureCityColumn();
  const r = await db.execute(`SELECT * FROM vip_subscribers WHERE project_id = ? AND status = 'active'`, [projectId]);
  return rowsToObjects(r).map(decode);
}

export async function listActiveByCity(city: string): Promise<VipSubscriberRow[]> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT * FROM vip_subscribers WHERE city = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now'))`,
    [city],
  );
  return rowsToObjects(r).map(decode);
}

export async function getActiveVipByEmail(email: string): Promise<VipSubscriberRow | null> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT * FROM vip_subscribers WHERE email = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now')) LIMIT 1`,
    [email],
  );
  const row = rowsToObjects(r)[0];
  return row ? decode(row) : null;
}

export async function createTrialVip(email: string, durationMinutes: number): Promise<VipSubscriberRow> {
  await ensureCityColumn();
  const id = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + durationMinutes * 60_000);
  await db.execute(
    `INSERT INTO vip_subscribers (id, email, status, created_at, expires_at) VALUES (?, ?, 'active', ?, ?)`,
    [id, email, now.toISOString(), expires.toISOString()],
  );
  return { id, email, name: null, phone: null, city: null, status: "active", project_id: null, created_at: now.toISOString(), expires_at: expires.toISOString() };
}

export async function findExpiringSoon(hoursWithin: number): Promise<VipSubscriberRow[]> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT * FROM vip_subscribers WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at > datetime('now') AND expires_at <= datetime('now', '+' || ? || ' hours')`,
    [hoursWithin],
  );
  return rowsToObjects(r).map(decode);
}

export async function markExpired(): Promise<{ expired: number; rows: VipSubscriberRow[] }> {
  await ensureCityColumn();
  const sel = await db.execute(
    `SELECT * FROM vip_subscribers WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= datetime('now')`,
  );
  const rows = rowsToObjects(sel).map(decode);
  if (rows.length > 0) {
    await db.execute(
      `UPDATE vip_subscribers SET status = 'rejected' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= datetime('now')`,
    );
  }
  return { expired: rows.length, rows };
}

export async function updateVipStatus(id: string, status: "active" | "rejected"): Promise<VipSubscriberRow | null> {
  await db.execute(`UPDATE vip_subscribers SET status = ? WHERE id = ?`, [status, id]);
  const r = await db.execute(`SELECT * FROM vip_subscribers WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects(r)[0];
  return row ? decode(row) : null;
}
