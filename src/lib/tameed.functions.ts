import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSessionClaims } from "./auth.server";
import { db, rowsToObjects } from "./db";
import { requireAdmin } from "./auth-middleware.server";
import { signGetUrl } from "./r2";

type TameedBankInfo = {
  bank_name: string;
  holder_name: string;
  iban: string;
};

async function getBankInfo(): Promise<TameedBankInfo> {
  const result = await db.execute(
    "SELECT value FROM site_settings WHERE key = ? LIMIT 1",
    ["vip_bank_info"],
  );
  const row = rowsToObjects<{ value: string | null }>(result)[0];
  if (!row?.value) throw new Error("بيانات البنك غير متاحة");

  const parsed = JSON.parse(row.value) as Partial<TameedBankInfo>;
  if (!parsed.holder_name || !parsed.iban) throw new Error("بيانات البنك غير مكتملة");

  return {
    bank_name: parsed.bank_name ?? "",
    holder_name: parsed.holder_name,
    iban: parsed.iban,
  };
}

const tokenSchema = z.object({ token: z.string().trim().min(1).max(200) });

export const validateApprovalToken = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    if (!claims) throw new Error("يجب تسجيل الدخول");

    const result = await db.execute(
      `SELECT id, amount, allowed_payment_now, status
       FROM approval_tokens
       WHERE token = ? AND user_id = ?
       LIMIT 1`,
      [data.token, claims.sub],
    );
    const row = rowsToObjects<{
      id: string;
      amount: number;
      allowed_payment_now: number;
      status: string;
    }>(result)[0];

    if (!row) return { valid: false as const, reason: "رمز التعميد غير صحيح أو لا يخص حسابك" };
    if (row.status === "used" || row.status === "complete") {
      return { valid: false as const, reason: "تم استخدام هذا الرمز مسبقاً" };
    }

    const bankInfo = await getBankInfo();
    return {
      valid: true as const,
      approved: row.status === "approved",
      token_id: row.id,
      amount: Number(row.amount ?? 0),
      allowed_payment_now: Number(row.allowed_payment_now ?? 0),
      bank_name: bankInfo.bank_name,
      holder_name: bankInfo.holder_name,
      iban: bankInfo.iban,
    };
  });

const receiptSchema = z.object({
  token_id: z.string().min(1).max(200),
  receipt_path: z.string().min(1).max(500),
  amount: z.number().finite().positive(),
});

export const submitApprovalReceipt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => receiptSchema.parse(data))
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    if (!claims) throw new Error("يجب تسجيل الدخول");

    const tokenResult = await db.execute(
      `SELECT id, token, code, client_id, client_name, total_commission, allowed_payment_now, status
       FROM approval_tokens
       WHERE id = ? AND client_id = ?
       LIMIT 1`,
      [data.token_id, claims.sub],
    );
    const token = rowsToObjects<{
      id: string;
      token: string | null;
      code: string | null;
      client_id: string;
      client_name: string | null;
      total_commission: string | number;
      allowed_payment_now: string | number | null;
      status: string;
    }>(tokenResult)[0];

    if (!token) throw new Error("التوكن غير صالح");
    if (token.status === "approved") return { ok: true as const, alreadyApproved: true as const };
    if (token.status === "used" || token.status === "completed" || token.status === "complete") {
      throw new Error("تم استخدام هذا الرمز مسبقاً");
    }
    const requiredAmount = Number(token.allowed_payment_now ?? token.total_commission);
    if (!Number.isFinite(requiredAmount) || Math.abs(requiredAmount - data.amount) > 2) {
      throw new Error("المبلغ غير مطابق");
    }

    const receiptImageUrl = await signGetUrl(data.receipt_path, 60 * 60 * 24 * 7);
    await db.execute(
      `INSERT INTO approval_receipts
       (id, token_id, token_code, user_id, client_name, amount, ocr_result, ocr_amount,
        receipt_image_key, receipt_image_url, status, created_at, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), NULL)`,
      [
        crypto.randomUUID(),
        token.id,
        token.token ?? token.code ?? "",
        token.client_id,
        token.client_name ?? "",
        String(data.amount),
        "Tesseract.js",
        String(data.amount),
        data.receipt_path,
        receiptImageUrl,
        "pending",
      ],
    );

    return { ok: true as const, alreadyApproved: false as const };
  });

// ============ Admin functions ============

const createTokenSchema = z.object({
  user_id: z.string().min(1),
  project_id: z.string().min(1),
  total_commission: z.number().positive(),
  allowed_payment_now: z.number().positive(),
});

export const adminCreateApprovalToken = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => createTokenSchema.parse(data))
  .handler(async ({ data }) => {
    const token = generateAomToken();
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO approval_tokens (id, user_id, token, amount, allowed_payment_now, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))`,
      [id, data.user_id, token, data.total_commission, data.allowed_payment_now],
    );
    return { id, token, amount: data.total_commission, allowed_payment_now: data.allowed_payment_now };
  });

export const adminListApprovalTokens = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const result = await db.execute(
      `SELECT t.*, cp.company_name, cp.email as client_email
       FROM approval_tokens t
       LEFT JOIN client_profiles cp ON t.user_id = cp.user_id
       ORDER BY t.created_at DESC`,
    );
    return rowsToObjects(result).map((row: any) => ({
      id: String(row.id),
      user_id: String(row.user_id),
      token: String(row.token),
      amount: Number(row.amount ?? 0),
      allowed_payment_now: Number(row.allowed_payment_now ?? 0),
      status: String(row.status ?? "active"),
      paid_amount: Number(row.paid_amount ?? 0),
      created_at: String(row.created_at ?? ""),
      company_name: (row.company_name as string | null) ?? null,
      client_email: (row.client_email as string | null) ?? null,
    }));
  });

export const adminListApprovalReceipts = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const result = await db.execute(
      `SELECT r.*, t.token, t.amount as total_commission, t.paid_amount,
              cp.company_name, cp.email as client_email
       FROM approval_receipts r
       LEFT JOIN approval_tokens t ON r.token_id = t.id
       LEFT JOIN client_profiles cp ON r.user_id = cp.user_id
       ORDER BY r.created_at DESC`,
    );
    return rowsToObjects(result).map((row: any) => ({
      id: String(row.id),
      token_id: String(row.token_id),
      user_id: String(row.user_id),
      receipt_path: (row.receipt_path as string | null) ?? null,
      ocr_status: (row.ocr_status as string | null) ?? null,
      amount: Number(row.amount ?? 0),
      created_at: String(row.created_at ?? ""),
      token: (row.token as string | null) ?? null,
      total_commission: row.total_commission != null ? Number(row.total_commission) : null,
      paid_amount: row.paid_amount != null ? Number(row.paid_amount) : null,
      company_name: (row.company_name as string | null) ?? null,
      client_email: (row.client_email as string | null) ?? null,
    }));
  });

const approveSchema = z.object({ receipt_id: z.string().min(1) });

export const adminApproveReceipt = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: unknown) => approveSchema.parse(data))
  .handler(async ({ data }) => {
    const receiptResult = await db.execute(
      `SELECT token_id, amount FROM approval_receipts WHERE id = ? AND ocr_status = 'مطابق' LIMIT 1`,
      [data.receipt_id],
    );
    const receipt = rowsToObjects(receiptResult)[0] as any;
    if (!receipt) throw new Error("الإيصال غير موجود أو غير مطابق");

    const tokenResult = await db.execute(
      `SELECT amount, paid_amount, status FROM approval_tokens WHERE id = ? LIMIT 1`,
      [String(receipt.token_id)],
    );
    const token = rowsToObjects(tokenResult)[0] as any;
    if (!token) throw new Error("التوكن غير موجود");

    const newPaid = Number(token.paid_amount ?? 0) + Number(receipt.amount);
    await db.execute(
      `UPDATE approval_tokens SET paid_amount = ? WHERE id = ?`,
      [newPaid, String(receipt.token_id)],
    );

    if (newPaid >= Number(token.amount)) {
      await db.execute(
        `UPDATE approval_tokens SET status = 'completed' WHERE id = ?`,
        [String(receipt.token_id)],
      );
      return { ok: true, completed: true, newPaid };
    }

    return { ok: true, completed: false, newPaid };
  });

function generateAomToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `AOM-${code}`;
}
