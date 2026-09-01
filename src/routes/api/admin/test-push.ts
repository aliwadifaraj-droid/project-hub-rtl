import { createAPIFileRoute } from "@tanstack/react-start/api";
import { testPush } from "@/lib/push-test.functions";

export const APIRoute = createAPIFileRoute("/api/admin/test-push")({
  POST: async () => {
    try {
      const result = await testPush();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      const isAuth = e?.message?.includes("Unauthorized") || e?.message?.includes("Forbidden");
      return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown error" }), {
        status: isAuth ? 401 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
