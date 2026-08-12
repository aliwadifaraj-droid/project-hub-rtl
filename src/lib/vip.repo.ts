import { db, rowsToObjects } from "./db";

export type VipSubscriberRow = {
  id: string;
  name: string | null;
  email: string | null;
  plan: string | null;
  city: string | null;
  status: string;
  project_id: string | null;
  expires_at: string | null;
  receipt_path: string | null;
  receipt_key: string | null;
  notes: string | null;
  created_at: string;
};

function decode(row: any): VipSubscriberRow {
  const receipt = row.receipt_path ?? row.receipt_key ?? null;
  return {
    id: String(row.id),
    name: row.name ?? null,
    email: row.email ?? null,
    plan: row.plan ?? null,
    city: row.city ?? null,
    status: String(row.status ?? "pending"),
    project_id: row.project_id ?? null,
    expires_at: row.expires_at ?? null,
    receipt_path: receipt,
    receipt_key: receipt,
    notes: row.notes ?? null,
    created_at: String(row.created_at ?? ""),
  };
}

let _colsReady: Promise<void> | null = null;
function ensureColumns(): Promise<void> {
  if (_colsReady) return _colsReady;
  _colsReady = Promise.all([
    db.execute(`ALTER TABLE vip_subscribers ADD COLUMN city TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE vip_subscribers ADD COLUMN project_id TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE vip_subscribers ADD COLUMN expires_at TEXT`).catch(() => undefined),
  ]).then(() => undefined);
  return _colsReady;
}

export function ensureCityColumn(): Promise<void> {
  return ensureColumns();
}

export async function listVipSubscribers(): Promise<VipSubscriberRow[]> {
  await ensureColumns();
  const r = await db.execute(`SELECT * FROM vip_subscribers ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function listVipWithProjectNames(): Promise<(VipSubscriberRow & { project_name: string | null })[]> {
  await ensureColumns();
  const r = await db.execute(
    `SELECT v.*, p.name AS project_name
     FROM vip_subscribers v
     LEFT JOIN projects p ON p.id = v.project_id
     ORDER BY v.created_at DESC`,
  );
  return rowsToObjects(r).map((row: any) => ({
    ...decode(row),
    project_name: row.project_name ?? null,
  }));
}

export async function approveByProject(projectId: string): Promise<VipSubscriberRow | null> {
  await ensureColumns();
  const expiresAt = new Date(Date.now() + 6 * 3600_000).toISOString();
  await db.execute(
    `UPDATE vip_subscribers SET status = 'approved', expires_at = ? WHERE project_id = ?`,
    [expiresAt, projectId],
  );
  const r = await db.execute(
    `SELECT * FROM vip_subscribers WHERE project_id = ? ORDER BY created_at DESC LIMIT 1`,
    [projectId],
  );
  const row = rowsToObjects(r)[0];
  return row ? decode(row) : null;
}

export async function cancelByProject(projectId: string): Promise<void> {
  await ensureColumns();
  await db.execute(
    `UPDATE vip_subscribers SET status = 'rejected', expires_at = NULL WHERE project_id = ?`,
    [projectId],
  );
}

export async function listAllApprovedWithProject(): Promise<{ project_id: string; expires_at: string | null }[]> {
  await ensureColumns();
  const r = await db.execute(
    `SELECT project_id, expires_at FROM vip_subscribers
      WHERE status = 'approved' AND project_id IS NOT NULL
      ORDER BY created_at DESC`,
  );
  return rowsToObjects(r).map((row: any) => ({
    project_id: String(row.project_id),
    expires_at: row.expires_at ?? null,
  }));
}

export async function listApprovedByProject(projectId: string): Promise<VipSubscriberRow[]> {
  await ensureColumns();
  const r = await db.execute(
    `SELECT * FROM vip_subscribers WHERE project_id = ? AND status = 'approved' AND expires_at IS NOT NULL ORDER BY created_at DESC`,
    [projectId],
  );
  return rowsToObjects(r).map(decode);
}

/** Active subscribers whose city matches (case/space-insensitive). */
export async function listActiveByCity(city: string): Promise<VipSubscriberRow[]> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT * FROM vip_subscribers
      WHERE status = 'active'
        AND email IS NOT NULL AND TRIM(email) <> ''
        AND city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?))`,
    [city],
  );
  return rowsToObjects(r).map(decode);
}

/** Count active VIP subscribers whose city matches (case/space-insensitive). */
export async function countActiveByCity(city: string): Promise<number> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT COUNT(*) AS cnt FROM vip_subscribers
      WHERE status = 'active'
        AND city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?))`,
    [city],
  );
  const row = rowsToObjects(r)[0] as { cnt?: number } | undefined;
  return Number(row?.cnt ?? 0);
}

/** Count active VIP subscribers grouped by city. */
export async function countActiveByCityAll(): Promise<{ city: string; count: number }[]> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT TRIM(city) AS city, COUNT(*) AS cnt FROM vip_subscribers
      WHERE status = 'active' AND city IS NOT NULL AND TRIM(city) <> ''
      GROUP BY TRIM(LOWER(city))
      ORDER BY cnt DESC`,
  );
  return rowsToObjects(r).map((row: any) => ({
    city: String(row.city ?? ""),
    count: Number(row.cnt ?? 0),
  }));
}

export async function insertVipSubscriber(input: {
  name: string;
  email: string;
  plan: string;
  city: string;
  receipt_path: string;
}) {
  await ensureCityColumn();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO vip_subscribers (id, name, email, plan, city, status, receipt_key, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [id, input.name, input.email, input.plan, input.city, input.receipt_path, new Date().toISOString()],
  );
  return id;
}

/** Auto-activate pending subscribers in a city for N hours. Returns count activated. */
export async function autoActivateByCity(city: string, hours = 6): Promise<number> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT id FROM vip_subscribers
      WHERE status = 'pending'
        AND city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?))`,
    [city],
  );
  const rows = rowsToObjects<{ id: string }>(r);
  if (rows.length === 0) return 0;

  const now = new Date();
  const expires = new Date(now.getTime() + hours * 60 * 60 * 1000);

  for (const row of rows) {
    await db.execute(
      `UPDATE vip_subscribers SET status = 'active', expires_at = ? WHERE id = ?`,
      [expires.toISOString(), row.id],
    );
  }
  return rows.length;
}

/** Stop all active VIP subscribers in a city (set status to 'expired'). */
export async function stopVipByCity(city: string): Promise<number> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT id FROM vip_subscribers
      WHERE status = 'active'
        AND city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?))`,
    [city],
  );
  const rows = rowsToObjects<{ id: string }>(r);
  for (const row of rows) {
    await db.execute(`UPDATE vip_subscribers SET status = 'expired', expires_at = NULL WHERE id = ?`, [row.id]);
  }
  return rows.length;
}

/** Start VIP for all pending/expired/active subscribers in a city for N hours.
 *  Includes active subscribers so re-activating counts them. */
export async function startVipByCity(city: string, hours: number): Promise<number> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT id FROM vip_subscribers
      WHERE status IN ('pending', 'expired', 'active')
        AND city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?))`,
    [city],
  );
  const rows = rowsToObjects<{ id: string }>(r);
  if (rows.length === 0) return 0;
  const now = new Date();
  const expires = new Date(now.getTime() + hours * 60 * 60 * 1000);
  for (const row of rows) {
    await db.execute(
      `UPDATE vip_subscribers SET status = 'active', expires_at = ? WHERE id = ?`,
      [expires.toISOString(), row.id],
    );
  }
  return rows.length;
}

/** Extend active VIP subscribers in a city by N hours from now. */
export async function extendVipByCity(city: string, hours: number): Promise<number> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT id FROM vip_subscribers
      WHERE status = 'active'
        AND city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?))`,
    [city],
  );
  const rows = rowsToObjects<{ id: string }>(r);
  if (rows.length === 0) return 0;
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000);
  for (const row of rows) {
    await db.execute(
      `UPDATE vip_subscribers SET expires_at = ? WHERE id = ?`,
      [expires.toISOString(), row.id],
    );
  }
  return rows.length;
}

export async function updateVipReceipt(id: string, receiptPath: string): Promise<void> {
  await db.execute(`UPDATE vip_subscribers SET receipt_key = ? WHERE id = ?`, [receiptPath, id]);
}

export async function updateVipStatus(id: string, status: "active" | "rejected"): Promise<VipSubscriberRow | null> {
  await ensureCityColumn();
  await db.execute(`UPDATE vip_subscribers SET status = ? WHERE id = ?`, [status, id]);
  const r = await db.execute(`SELECT * FROM vip_subscribers WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects(r)[0];
  return row ? decode(row) : null;
}
