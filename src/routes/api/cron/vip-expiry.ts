import { createFileRoute } from "@tanstack/react-router";
import { runVipExpiryCheckRaw } from "@/lib/vip.functions";

export const Route = createFileRoute("/api/cron/vip-expiry")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env.CRON_SECRET ?? "";
        if (expected) {
          const auth = request.headers.get("authorization") ?? "";
          if (auth !== `Bearer ${expected}`) {
            return new Response(JSON.stringify({ error: "unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
        try {
          const result = await runVipExpiryCheckRaw();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "cron failed";
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
