// POST /api/push/send — sends Web Push notifications.
// Body: { title: string, body: string, url?: string, userId?: string }
// If userId is provided, sends to that single user's subscriptions only.
// Otherwise sends to ALL subscriptions (broadcast).
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
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@project-hub.com";
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export const Route = createFileRoute("/api/push/send")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        try {
          configureVapid();

          const body = await request.json();
          const title = String(body?.title ?? "منصة المشاريع").trim();
          const notifBody = String(body?.body ?? "").trim();
          const url = String(body?.url ?? "/").trim();
          const userId = body?.userId ? String(body.userId).trim() : null;

          if (!title) {
            return json({ error: "title is required" }, 400);
          }
          if (!notifBody) {
            return json({ error: "body is required" }, 400);
          }

          const subs = userId
            ? await pushRepo.listSubscriptionsByUserId(userId)
            : await pushRepo.listAllSubscriptions();

          if (subs.length === 0) {
            return json({ ok: true, sent: 0, failed: 0, message: userId ? "no subscriptions for this user" : "no subscriptions" });
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

          return json({
            ok: true,
            sent: succeeded,
            failed,
            total: subs.length,
            cleaned: expiredEndpoints.length,
            mode: userId ? "single" : "broadcast",
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "send failed";
          return json({ error: msg }, 500);
        }
      },
    },
  },
});
