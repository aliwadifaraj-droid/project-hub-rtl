// POST /api/notifications/send — sends a Web Push notification to all stored subscriptions.
// Body: { title: string, body: string, url?: string }
import { createFileRoute } from "@tanstack/react-router";
import webpush from "web-push";
import * as pushRepo from "@/lib/push.repo";

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

let vapidConfigured = false;
function configureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in .env");
  }
  webpush.setVapidDetails("mailto:admin@alamran.sa", publicKey, privateKey);
  vapidConfigured = true;
}

export const Route = createFileRoute("/api/notifications/send")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        try {
          configureVapid();

          const body = await request.json();
          const title = String(body?.title ?? "منصة العمران").trim();
          const notifBody = String(body?.body ?? "").trim();
          const url = String(body?.url ?? "/").trim();

          if (!title) {
            return json({ error: "title is required" }, 400);
          }

          const subs = await pushRepo.listAllSubscriptions();
          if (subs.length === 0) {
            return json({ ok: true, sent: 0, message: "no subscriptions" });
          }

          const payload = JSON.stringify({ title, body: notifBody, url });

          const results = await Promise.allSettled(
            subs.map((s) =>
              webpush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                payload,
              ),
            ),
          );

          const succeeded = results.filter((r) => r.status === "fulfilled").length;
          const failed = results.length - succeeded;

          // Remove subscriptions that returned 410 (gone) or 404 (not found)
          const expiredEndpoints: string[] = [];
          results.forEach((r, i) => {
            if (r.status === "rejected") {
              const statusCode = (r.reason as any)?.statusCode;
              if (statusCode === 410 || statusCode === 404) {
                expiredEndpoints.push(subs[i].endpoint);
              }
            }
          });
          await Promise.all(expiredEndpoints.map((ep) => pushRepo.deleteSubscription(ep)));

          return json({ ok: true, sent: succeeded, failed, cleaned: expiredEndpoints.length });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "send failed";
          return json({ error: msg }, 500);
        }
      },
    },
  },
});
