// POST /api/notifications/subscribe — saves a Web Push subscription to Turso.
// DELETE /api/notifications/subscribe — removes a subscription by endpoint.
import { createFileRoute } from "@tanstack/react-router";
import { getSessionClaims } from "@/lib/auth.server";
import * as pushRepo from "@/lib/push.repo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export const Route = createFileRoute("/api/notifications/subscribe")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        try {
          let userId: string | null = null;
          try {
            const claims = await getSessionClaims();
            if (claims) userId = claims.sub;
          } catch {
            /* anonymous subscription allowed */
          }

          const body = await request.json();
          const endpoint = String(body?.endpoint ?? "").trim();
          const p256dh = String(body?.keys?.p256dh ?? "").trim();
          const auth = String(body?.keys?.auth ?? "").trim();

          if (!endpoint || !p256dh || !auth) {
            return json({ error: "endpoint, p256dh, and auth are required" }, 400);
          }

          await pushRepo.insertSubscription({ userId, endpoint, p256dh, auth });
          return json({ ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "subscribe failed";
          return json({ error: msg }, 500);
        }
      },

      DELETE: async ({ request }) => {
        try {
          const body = await request.json();
          const endpoint = String(body?.endpoint ?? "").trim();
          if (!endpoint) return json({ error: "endpoint is required" }, 400);
          await pushRepo.deleteSubscription(endpoint);
          return json({ ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "unsubscribe failed";
          return json({ error: msg }, 500);
        }
      },
    },
  },
});
