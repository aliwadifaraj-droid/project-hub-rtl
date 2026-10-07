// Turso repository for client approvals (اعتماد العملاء).
// Server-only. Tables: approval_tokens, approval_receipts.
// Bank info is stored in site_settings under key "vip_bank_info".
import { db, rowsToObjects } from "./db";

export type ApprovalTokenRow = {
  id: string;
  token_code: string;
  client_id: string;
  client_name: string;
  project_id: string;
  project_name: string;
  total_commission: string;
  allowed_amount: string;
  paid_amount: string;
  status: string; // active | completed | cancelled
  created_at: string;
  updated_at: string;
};

export type ApprovalReceiptRow = {
  id: string;
  token_id: string;
  token_code: string;
  client_id: string;
  client_name: string;
  amount: string;
  ocr_result: string | null; // match | mismatch | null
  ocr_amount: string | null;
  receipt_image_key: string | null;
  receipt_image_url: string | null;
  status: string; // pending | approved | rejected
  created_at: string;
  approved_at: string | null;
};

export async function getVipBankInfo(): Promise<string> {
  const r = await db.execute(
    "SELECT value FROM site_settings WHERE key = ? LIMIT 1",
    ["vip_bank_info"],
  );
  const row = rowsToObjects<{ value: string | null }>(r)[0];
  return row?.value ?? "";
}

function decodeToken(r: any): ApprovalTokenRow {
  return {
    id: String(r.id),
    token_code: String(r.token_code ?? ""),
    client_id: String(r.client_id ?? ""),
    client_name: String(r.client_name ?? ""),
    project_id: String(r.project_id ?? ""),
    project_name: String(r.project_name ?? ""),
    total_commission: String(r.total_commission ?? "0"),
    allowed_amount: String(r.allowed_amount ?? "0"),
    paid_amount: String(r.paid_amount ?? "0"),
    status: String(r.status ?? "active"),
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  };
}

function decodeReceipt(r: any): ApprovalReceiptRow {
  return {
    id: String(r.id),
    token_id: String(r.token_id ?? ""),
    token_code: String(r.token_code ?? ""),
    client_id: String(r.client_id ?? ""),
    client_name: String(r.client_name ?? ""),
    amount: String(r.amount ?? "0"),
    ocr_result: r.ocr_result ?? null,
    ocr_amount: r.ocr_amount ?? null,
    receipt_image_key: r.receipt_image_key ?? null,
    receipt_image_url: r.receipt_image_url ?? null,
    status: String(r.status ?? "pending"),
    created_at: String(r.created_at ?? ""),
    approved_at: r.approved_at ?? null,
  };
}

function genTokenCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "AOM-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createApprovalToken(data: {
  client_id: string;
  client_name: string;
  project_id: string;
  project_name: string;
  total_commission: string;
  allowed_amount: string;
}): Promise<ApprovalTokenRow> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  let token_code = genTokenCode();
  // Ensure uniqueness
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.execute(
      "SELECT id FROM approval_tokens WHERE token_code = ? LIMIT 1",
      [token_code],
    );
    if (rowsToObjects(existing).length === 0) break;
    token_code = genTokenCode();
  }
  await db.execute(
    `INSERT INTO approval_tokens (id, token_code, client_id, client_name, project_id, project_name, total_commission, allowed_amount, paid_amount, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '0', 'active', ?, ?)`,
    [id, token_code, data.client_id, data.client_name, data.project_id, data.project_name, data.total_commission, data.allowed_amount, now, now],
  );
  return (await findTokenById(id))!;
}

export async function findTokenById(id: string): Promise<ApprovalTokenRow | null> {
  const r = await db.execute("SELECT * FROM approval_tokens WHERE id = ? LIMIT 1", [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decodeToken(rows[0]) : null;
}

export async function findTokenByCode(code: string): Promise<ApprovalTokenRow | null> {
  const r = await db.execute("SELECT * FROM approval_tokens WHERE token_code = ? LIMIT 1", [code]);
  const rows = rowsToObjects(r);
  return rows[0] ? decodeToken(rows[0]) : null;
}

export async function listAllApprovalTokens(): Promise<ApprovalTokenRow[]> {
  const r = await db.execute("SELECT * FROM approval_tokens ORDER BY created_at DESC");
  return rowsToObjects(r).map(decodeToken);
}

export async function listActiveApprovalTokens(): Promise<ApprovalTokenRow[]> {
  const r = await db.execute("SELECT * FROM approval_tokens WHERE status = 'active' ORDER BY created_at DESC");
  return rowsToObjects(r).map(decodeToken);
}

export async function updateTokenPaidAmount(tokenId: string, paidAmount: string, status: string): Promise<void> {
 const now = new Date().toISOString();
  await db.execute(
    "UPDATE approval_tokens SET paid_amount = ?, status = ?, updated_at = ? WHERE id = ?",
    [paidAmount, status, now, tokenId],
  );
}

export async function createApprovalReceipt(data: {
  token_id: string;
  token_code: string;
  client_id: string;
  client_name: string;
  amount: string;
  ocr_result?: string | null;
  ocr_amount?: string | null;
  receipt_image_key?: string | null;
  receipt_image_url?: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO approval_receipts (id, token_id, token_code, client_id, client_name, amount, ocr_result, ocr_amount, receipt_image_key, receipt_image_url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [id, data.token_id, data.token_code, data.client_id, data.client_name, data.amount, data.ocr_result ?? null, data.ocr_amount ?? null, data.receipt_image_key ?? null, data.receipt_image_url ?? null, now],
  );
  return id;
}

export async function listAllApprovalReceipts(): Promise<ApprovalReceiptRow[]> {
  const r = await db.execute("SELECT * FROM approval_receipts ORDER BY created_at DESC");
  return rowsToObjects(r).map(decodeReceipt);
}

export async function findReceiptById(id: string): Promise<ApprovalReceiptRow | null> {
  const r = await db.execute("SELECT * FROM approval_receipts WHERE id = ? LIMIT 1", [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decodeReceipt(rows[0]) : null;
}

export async function updateReceiptStatus(receiptId: string, status: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE approval_receipts SET status = ?, approved_at = ? WHERE id = ?",
    [status, now, receiptId],
  );
}

export async function getReceiptWithToken(receiptId: string): Promise<{ receipt: ApprovalReceiptRow; token: ApprovalTokenRow } | null> {
  const receipt = await findReceiptById(receiptId);
  if (!receipt) return null;
  const token = await findTokenById(receipt.token_id);
  if (!token) return null;
  return { receipt, token };
}
