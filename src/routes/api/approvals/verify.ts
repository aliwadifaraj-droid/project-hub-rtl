import { createFileRoute } from "@tanstack/react-router";
import { db, rowsToObjects } from "@/lib/db";

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
          const result = await db.execute(
            `SELECT * FROM approval_tokens WHERE token = ? OR code = ? LIMIT 1`,
            [code, code],
          );
          const rows = rowsToObjects(result);
          const row = rows[0];

          if (!row) {
            return jsonResponse({ valid: false, error: "رمز التعميد غير صحيح" }, 200);
          }

          const token = String(row.token ?? row.code ?? row.token_code ?? "");
          const tokenId = String(row.id ?? "");
          const status = String(row.status ?? "active");

          if (status === "used" || status === "completed" || status === "complete") {
            return jsonResponse({ valid: false, error: "تم استخدام هذا الرمز مسبقاً" }, 200);
          }

          return jsonResponse({
            valid: true,
            token_id: tokenId,
            token,
            client_name: String(row.client_name ?? ""),
            project_name: String(row.project_name ?? ""),
            amount: Number(row.total_commission ?? row.amount ?? 0),
            allowed_payment_now: Number(row.allowed_payment_now ?? row.allowed_amount ?? 0),
            paid_amount: Number(row.paid_amount ?? 0),
            status,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "server error";
          return jsonResponse({ valid: false, error: msg }, 500);
        }
      },
    },
  },
});
