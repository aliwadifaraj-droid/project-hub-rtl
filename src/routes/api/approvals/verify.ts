import { createFileRoute } from "@tanstack/react-router";
import { findTokenByCode } from "@/lib/approvals.repo";

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
          const row = await findTokenByCode(code);
          if (!row) {
            return jsonResponse({ valid: false, error: "رمز التعميد غير صحيح" });
          }

          if (row.status === "used" || row.status === "completed" || row.status === "complete") {
            return jsonResponse({ valid: false, error: "تم استخدام هذا الرمز مسبقاً" });
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
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "server error";
          return jsonResponse({ valid: false, error: msg }, 500);
        }
      },
    },
  },
});
