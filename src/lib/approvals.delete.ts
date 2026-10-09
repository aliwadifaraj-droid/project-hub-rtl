import { db, rowsToObjects } from "./db";
import { deleteFromR2 } from "./r2";

export async function deleteApprovalReceipt(receiptId: string): Promise<void> {
  const result = await db.execute("SELECT receipt_image_key FROM approval_receipts WHERE id = ? LIMIT 1", [receiptId]);
  const rows = rowsToObjects<{ receipt_image_key: string | null }>(result);
  if (!rows[0]) throw new Error("الإيصال غير موجود");
  if (rows[0].receipt_image_key) await deleteFromR2(rows[0].receipt_image_key);
  await db.execute("DELETE FROM approval_receipts WHERE id = ?", [receiptId]);
}

export async function deleteApprovalToken(tokenId: string): Promise<void> {
  const token = await db.execute("SELECT id FROM approval_tokens WHERE id = ? LIMIT 1", [tokenId]);
  if (rowsToObjects(token).length === 0) throw new Error("رمز التعميد غير موجود");

  const result = await db.execute("SELECT receipt_image_key FROM approval_receipts WHERE token_id = ?", [tokenId]);
  const receipts = rowsToObjects<{ receipt_image_key: string | null }>(result);
  for (const receipt of receipts) {
    if (receipt.receipt_image_key) await deleteFromR2(receipt.receipt_image_key);
  }

  await db.batch([
    { sql: "DELETE FROM approval_receipts WHERE token_id = ?", args: [tokenId] },
    { sql: "DELETE FROM approval_installments WHERE token_id = ?", args: [tokenId] },
    { sql: "DELETE FROM approval_tokens WHERE id = ?", args: [tokenId] },
  ]);
}