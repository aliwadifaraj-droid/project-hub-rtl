import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSessionClaims } from "./auth.server";
import { db, rowsToObjects } from "./db";

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
      `SELECT user_id, status, allowed_payment_now
       FROM approval_tokens
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [data.token_id, claims.sub],
    );
    const token = rowsToObjects<{
      user_id: string;
      status: string;
      allowed_payment_now: number;
    }>(tokenResult)[0];

    if (!token) throw new Error("التوكن غير صالح");
    if (token.status === "approved") return { ok: true as const, alreadyApproved: true as const };
    if (token.status === "used" || token.status === "complete") throw new Error("تم استخدام هذا الرمز مسبقاً");
    if (Math.abs(Number(token.allowed_payment_now) - data.amount) > 0.01) throw new Error("المبلغ غير مطابق");

    await db.execute(
      `INSERT INTO approval_receipts
       (id, token_id, user_id, receipt_path, ocr_status, amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [crypto.randomUUID(), data.token_id, claims.sub, data.receipt_path, "مطابق", data.amount],
    );

    return { ok: true as const, alreadyApproved: false as const };
  });
