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
  const fallback = {
    bank_name: "الإنماء",
    holder_name: "AHMED SALMI - الإنماء",
    iban: "SA7805000068207858373000",
    account_number: "SA7805000068207858373000",
  };

  try {
    const raw = await getVipBankInfo();
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const bankName = String(parsed.bank_name ?? fallback.bank_name);
    const holderName = String(parsed.holder_name ?? parsed.account_name ?? fallback.holder_name);
    return {
      bank_name: bankName,
      holder_name: `${holderName} - ${bankName}`,
      iban: String(parsed.iban ?? fallback.iban),
      account_number: String(parsed.account_number ?? parsed.iban ?? fallback.account_number),
    };
  } catch {
    return fallback;
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

          const latestReceipt = await findLatestReceiptByTokenId(row.id);
          const nextInstallment = row.installments.find((installment) => installment.status !== "paid");
          const receipt_id = latestReceipt?.id ?? "";
          const receipt_status = latestReceipt?.status ?? null;
          const approved_at = latestReceipt?.approved_at ?? row.approved_at;
          const receipt_paid_amount = latestReceipt
            ? Number(latestReceipt.paid_amount ?? row.paid_amount)
            : null;
          const totalAmount = Number(row.total_commission);
          const paidAmount = Number(row.paid_amount);
          const remainingAmount = Math.max(0, totalAmount - paidAmount);
          const nextPaymentAmount = Number(nextInstallment?.amount ?? row.allowed_amount);

          return jsonResponse({
            valid: true,
            token_id: row.id,
            token: row.token_code,
            client_name: row.client_name,
            project_name: row.project_name,
            amount: remainingAmount,
            allowed_payment_now: Math.min(nextPaymentAmount, remainingAmount),
            next_installment_number: nextInstallment?.installment_number ?? null,
            installments: row.installments.map((installment) => ({
              number: installment.installment_number,
              amount: Number(installment.amount),
              paid_amount: Number(installment.paid_amount),
              status: installment.status,
            })),
            paid_amount: Number(row.paid_amount),
            status: row.status,
            approved_at: row.approved_at,
            receipt_id,
            receipt_paid_amount,
            receipt_status,
            bankAccount: await getBankAccountInfo(),
          });
        } catch {
          return jsonResponse({ valid: false, error: "تعذر التحقق من رمز التعميد" }, 500);
        }
      },
    },
  },
});
