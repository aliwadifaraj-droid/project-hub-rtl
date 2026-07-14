import { db, rowsToObjects } from "./db";

export type VipSubscriberRow = {
  id: string;
  name: string | null;
  email: string | null;
  plan: string | null;
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
    status: String(row.status ?? "pending"),
    receipt_path: receipt,
    receipt_key: receipt,
    notes: row.notes ?? null,
    created_at: String(row.created_at ?? ""),
  };
}

export async function listVipSubscribers(): Promise<VipSubscriberRow[]> {
  const r = await db.execute(`SELECT * FROM vip_subscribers ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}

export async function insertVipSubscriber(input: { name: string; email: string; plan: string; receipt_path: string }) {
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO vip_subscribers (id, name, email, plan, status, receipt_key, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [id, input.name, input.email, input.plan, input.receipt_path, new Date().toISOString()],
  );
  return id;
}

export async function updateVipReceipt(id: string, receiptPath: string): Promise<void> {
  await db.execute(`UPDATE vip_subscribers SET receipt_key = ? WHERE id = ?`, [receiptPath, id]);
}

export async function updateVipStatus(id: string, status: "active" | "rejected"): Promise<VipSubscriberRow | null> {
  await db.execute(`UPDATE vip_subscribers SET status = ? WHERE id = ?`, [status, id]);
  const r = await db.execute(`SELECT * FROM vip_subscribers WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects(r)[0];
  return row ? decode(row) : null;
}