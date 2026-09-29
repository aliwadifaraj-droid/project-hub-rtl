import { createFileRoute } from "@tanstack/react-router";
import { testPush } from "@/lib/push-test.functions";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export const Route = createFileRoute("/api/admin/test-push")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async () => {
        try {
          const result = await testPush();
          return json(result);
        } catch (e: any) {
          const isAuth = e?.message?.includes("Unauthorized") || e?.message?.includes("Forbidden");
          return json({ ok: false, error: e?.message ?? "Unknown error" }, isAuth ? 401 : 500);
        }
      },
    },
  },
});
