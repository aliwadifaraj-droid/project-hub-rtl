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
  ocr_bank: string | null;
  ocr_amount: string | null;
  ocr_date: string | null;
  ocr_time: string | null;
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
    ocr_bank: row.ocr_bank ?? null,
    ocr_amount: row.ocr_amount ?? null,
    ocr_date: row.ocr_date ?? null,
    ocr_time: row.ocr_time ?? null,
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
    db.execute(`ALTER TABLE vip_subscribers ADD COLUMN ocr_bank TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE vip_subscribers ADD COLUMN ocr_amount TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE vip_subscribers ADD COLUMN ocr_date TEXT`).catch(() => undefined),
    db.execute(`ALTER TABLE vip_subscribers ADD COLUMN ocr_time TEXT`).catch(() => undefined),
    db.execute(`UPDATE vip_subscribers SET status = 'expired' WHERE status = 'rejected' AND expires_at IS NOT NULL AND datetime(expires_at) <= datetime('now')`).catch(() => undefined),
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
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600_000).toISOString();
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

export async function stopVipByCity(city: string): Promise<{ count: number }> {
  await ensureCityColumn();
  const r = await db.execute(
    `UPDATE vip_subscribers SET status = 'rejected' WHERE city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?))`,
    [city],
  );
  return { count: r.rowsAffected ?? 0 };
}

export async function startVipByCity(city: string, hours: number): Promise<{ count: number }> {
  await ensureCityColumn();
  const expiresAt = new Date(Date.now() + hours * 3600_000).toISOString();
  const r = await db.execute(
    `UPDATE vip_subscribers SET status = 'active', expires_at = ? WHERE city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?))`,
    [expiresAt, city],
  );
  return { count: r.rowsAffected ?? 0 };
}

export async function extendVipByCity(city: string, hours: number): Promise<{ count: number }> {
  await ensureCityColumn();
  const r = await db.execute(
    `UPDATE vip_subscribers SET expires_at = datetime(expires_at, '+' || ? || ' hours') WHERE city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?)) AND status = 'active' AND expires_at IS NOT NULL`,
    [String(hours), city],
  );
  return { count: r.rowsAffected ?? 0 };
}

export async function listApprovedByProject(projectId: string): Promise<VipSubscriberRow[]> {
  await ensureColumns();
  const r = await db.execute(
    `SELECT * FROM vip_subscribers WHERE project_id = ? AND status = 'approved' AND expires_at IS NOT NULL ORDER BY created_at DESC`,
    [projectId],
  );
  return rowsToObjects(r).map(decode);
}

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

export async function getActiveVipByEmail(email: string): Promise<VipSubscriberRow | null> {
  await ensureCityColumn();
  const r = await db.execute(
    `SELECT * FROM vip_subscribers
      WHERE email IS NOT NULL AND TRIM(LOWER(email)) = TRIM(LOWER(?))
        AND status = 'active'
      ORDER BY created_at DESC LIMIT 1`,
    [email],
  );
  const row = rowsToObjects(r)[0];
  return row ? decode(row) : null;
}

export async function createTrialVip(email: string, durationMinutes: number): Promise<VipSubscriberRow> {
  await ensureCityColumn();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + durationMinutes * 60_000).toISOString();
  await db.execute(
    `INSERT INTO vip_subscribers (id, name, email, plan, city, status, expires_at, receipt_key, created_at)
     VALUES (?, ?, ?, 'trial', NULL, 'active', ?, NULL, ?)`,
    [id, email, email, expiresAt, new Date().toISOString()],
  );
  const r = await db.execute(`SELECT * FROM vip_subscribers WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects(r)[0];
  return decode(row);
}

export async function findExpiringSoon(hoursWithin: number): Promise<VipSubscriberRow[]> {
  await ensureCityColumn();
  const threshold = new Date(Date.now() + hoursWithin * 3600_000).toISOString();
  const r = await db.execute(
    `SELECT * FROM vip_subscribers
      WHERE status = 'active'
        AND expires_at IS NOT NULL
        AND datetime(expires_at) > datetime('now')
        AND datetime(expires_at) <= datetime(?)
      ORDER BY expires_at ASC`,
    [threshold],
  );
  return rowsToObjects(r).map(decode);
}

export async function markExpired(): Promise<{ expired: number; rows: VipSubscriberRow[] }> {
  await ensureCityColumn();
  const sel = await db.execute(
    `SELECT * FROM vip_subscribers
      WHERE status = 'active' AND expires_at IS NOT NULL AND datetime(expires_at) <= datetime('now')`,
  );
  const rows = rowsToObjects(sel).map(decode);
  if (rows.length > 0) {
    await db.execute(
      `UPDATE vip_subscribers SET status = 'expired'
        WHERE status = 'active' AND expires_at IS NOT NULL AND datetime(expires_at) <= datetime('now')`,
    );
  }
  return { expired: rows.length, rows };
}

export async function autoActivateByCity(city: string, hours: number): Promise<{ count: number }> {
  const projectCity = city.split("-")[0].trim();
  await ensureCityColumn();
  const expiresAt = new Date(Date.now() + hours * 3600_000).toISOString();
  const r = await db.execute(
    `UPDATE vip_subscribers SET status = 'active', expires_at = ?
      WHERE city IS NOT NULL AND TRIM(LOWER(city)) = TRIM(LOWER(?))
        AND status IN ('pending', 'approved', 'expired')`,
    [expiresAt, projectCity],
  );
  return { count: r.rowsAffected ?? 0 };
}

export async function updateVipReceipt(id: string, receiptPath: string): Promise<void> {
  await db.execute(`UPDATE vip_subscribers SET receipt_key = ? WHERE id = ?`, [receiptPath, id]);
}

const PLAN_DURATION_DAYS: Record<string, number> = {
  "شهر": 30,
  "شهرين": 60,
  "3 شهور": 90,
};

export function planDurationDays(plan: string | null): number {
  if (!plan) return 30;
  const normalized = plan.trim();
  if (PLAN_DURATION_DAYS[normalized]) return PLAN_DURATION_DAYS[normalized];
  if (normalized.includes("90")) return 90;
  if (normalized.includes("60")) return 60;
  if (normalized.includes("30")) return 30;
  return 30;
}

export async function updateVipStatus(id: string, status: "active" | "rejected"): Promise<VipSubscriberRow | null> {
  await ensureCityColumn();
  if (status === "active") {
    const existing = await db.execute(`SELECT plan FROM vip_subscribers WHERE id = ? LIMIT 1`, [id]);
    const existingRow = rowsToObjects<any>(existing)[0];
    const days = planDurationDays(existingRow?.plan ?? null);
    const expiresAt = new Date(Date.now() + days * 24 * 3600_000).toISOString();
    await db.execute(`UPDATE vip_subscribers SET status = 'active', expires_at = ? WHERE id = ?`, [expiresAt, id]);
  } else {
    await db.execute(`UPDATE vip_subscribers SET status = ?, expires_at = NULL WHERE id = ?`, [status, id]);
  }
  const r = await db.execute(`SELECT * FROM vip_subscribers WHERE id = ? LIMIT 1`);
  const row = rowsToObjects(r)[0];
  return row ? decode(row) : null;
}
