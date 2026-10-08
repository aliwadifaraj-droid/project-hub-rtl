import { createFileRoute } from "@tanstack/react-router";
import { findTokenByCode, findLatestReceiptByTokenId, getVipBankInfo } from "@/lib/approvals.repo";
import { getSessionClaims } from "@/lib/auth.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function getBankAccountInfo(): Promise<{
  bank_name: string;
  holder_name: string;
  iban: string;
  account_number: string;
}> {
  try {
    const raw = await getVipBankInfo();
    if (!raw) return { bank_name: "", holder_name: "", iban: "", account_number: "" };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      bank_name: String(parsed.bank_name ?? ""),
      holder_name: String(parsed.holder_name ?? parsed.account_name ?? ""),
      iban: String(parsed.iban ?? ""),
      account_number: String(parsed.account_number ?? parsed.iban ?? ""),
    };
  } catch {
    return { bank_name: "", holder_name: "", iban: "", account_number: "" };
  }
}

export const Route = createFileRoute("/api/approvals/verify")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        let code = "";
        try {
          const body = await request.json();
          code = String(body?.code ?? body?.token ?? "").trim();
        } catch {
          return jsonResponse({ valid: false, error: "رمز التعميد غير صحيح" }, 400);
        }

        if (!code) {
          return jsonResponse({ valid: false, error: "رمز التعميد غير صحيح" }, 400);
        }

        try {
          const claims = await getSessionClaims();
          if (!claims) {
            return jsonResponse({ valid: false, error: "رمز التعميد غير صحيح" });
          }

          const row = await findTokenByCode(code);
          if (!row || row.client_id !== claims.sub) {
            return jsonResponse({ valid: false, error: "رمز التعميد غير صحيح" });
          }

          if (row.status === "used") {
            return jsonResponse({ valid: false, error: "تم استخدام هذا الرمز مسبقاً" });
          }

          let receipt_id = "";
          let approved_at: string | null = null;
          let receipt_paid_amount: number | null = null;

          if (row.status === "approved" || row.status === "completed") {
            const latestReceipt = await findLatestReceiptByTokenId(row.id);
            if (latestReceipt) {
              receipt_id = latestReceipt.id;
              approved_at = latestReceipt.approved_at;
              receipt_paid_amount = Number(latestReceipt.paid_amount ?? row.paid_amount);
            }
          }

          return jsonResponse({
            valid: true,
            token_id: row.id,
            token: row.token_code,
            client_name: row.client_name,
            project_name: row.project_name,
            amount: Number(row.total_commission),
            allowed_payment_now: Number(row.allowed_amount),
            paid_amount: Number(row.paid_amount),
            status: row.status,
            approved_at: row.approved_at,
            receipt_id,
            receipt_paid_amount,
            bankAccount: await getBankAccountInfo(),
          });
        } catch {
          return jsonResponse({ valid: false, error: "تعذر التحقق من رمز التعميد" }, 500);
        }
      },
    },
  },
});
