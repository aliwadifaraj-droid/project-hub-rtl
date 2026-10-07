import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSessionClaims } from "./auth.server";
import { db, rowsToObjects } from "./db";

export type TameedBankInfo = {
  bank_name: string;
  holder_name: string;
  iban: string;
};

const DEFAULT_BANK: TameedBankInfo = {
  bank_name: "البنك العربي",
  holder_name: "AHMED SALMI",
  iban: "SA8530100991109655808477",
};

export const getTameedBankInfo = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const result = await db.execute(
      "SELECT value FROM site_settings WHERE key = ? LIMIT 1",
      ["vip_bank_info"],
    );
    const row = rowsToObjects<{ value: string | null }>(result)[0];
    if (row?.value) {
      const parsed = JSON.parse(row.value) as Partial<TameedBankInfo>;
      return {
        bank_name: parsed.bank_name || DEFAULT_BANK.bank_name,
        holder_name: parsed.holder_name || DEFAULT_BANK.holder_name,
        iban: parsed.iban || DEFAULT_BANK.iban,
      };
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_BANK;
});

const tokenSchema = z.object({ token: z.string().trim().min(1).max(200) });

export const validateApprovalToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    if (!claims) throw new Error("يجب تسجيل الدخول");

    const result = await db.execute(
      `SELECT * FROM approval_tokens WHERE token = ? AND user_id = ? LIMIT 1`,
      [data.token.trim(), claims.sub],
    );
    const row = rowsToObjects(result)[0] as Record<string, unknown> | undefined;
    if (!row) {
      return { valid: false as const, reason: "رمز التعميد غير صحيح أو لا يخص حسابك" };
    }

    const status = String(row.status ?? "unused");
    if (status === "used" || status === "complete") {
      return { valid: false as const, reason: "تم استخدام هذا الرمز مسبقاً" };
    }

    const bankInfo = await getTameedBankInfo();
    const allowedPaymentNow = Number(row.allowed_payment_now ?? 0);

    return {
      valid: true as const,
      token_id: String(row.id),
      amount: Number(row.amount ?? 0),
      allowed_payment_now: allowedPaymentNow,
      bank_name: bankInfo.bank_name,
      holder_name: bankInfo.holder_name,
      iban: bankInfo.iban,
    };
  });
