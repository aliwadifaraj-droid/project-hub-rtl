import { db, rowsToObjects } from "./db";

async function ensureOfferReadTable(): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS haraj_offer_reads (
      teacher_id TEXT NOT NULL,
      offer_id TEXT NOT NULL,
      read_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (teacher_id, offer_id)
    )`,
  );
}

export async function listReadOfferIds(teacherId: string): Promise<Set<string>> {
  await ensureOfferReadTable();
  const r = await db.execute(`SELECT offer_id FROM haraj_offer_reads WHERE teacher_id = ?`, [teacherId]);
  return new Set(rowsToObjects<{ offer_id: unknown }>(r).map((row) => String(row.offer_id)));
}

export async function markOffersRead(teacherId: string, offerIds: string[]): Promise<void> {
  if (offerIds.length === 0) return;
  await ensureOfferReadTable();
  await db.batch(
    offerIds.map((offerId) => ({
      sql: `INSERT OR IGNORE INTO haraj_offer_reads (teacher_id, offer_id) VALUES (?, ?)`,
      args: [teacherId, offerId],
    })),
  );
}
