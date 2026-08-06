import { db, rowsToObjects } from "./db";

export type VipSubscriberRow = {
  id: string;
  name: string | null;
  email: string | null;
  plan: string | null;
  city: string | null;
  status: string;
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
    receipt_path: receipt,
    receipt_key: receipt,
    notes: row.notes ?? null,
    created_at: String(row.created_at ?? ""),
  };
}

/** Idempotent: makes sure the `city` column exists on older databases. */
let _cityColReady: Promise<void> | null = null;
export function ensureCityColumn(): Promise<void> {
  if (!_cityColReady) {
    _cityColReady = db
      .execute(`ALTER TABLE vip_subscribers ADD COLUMN city TEXT`)
      .then(() => undefined)
      .catch(() => undefined);
  }
  return _cityColReady;
}

export async function listVipSubscribers(): Promise<VipSubscriberRow[]> {
  await ensureCityColumn();
  const r = await db.execute(`SELECT * FROM vip_subscribers ORDER BY created_at DESC`);
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
