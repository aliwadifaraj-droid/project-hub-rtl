// Server-only: send Web Push notifications to all subscribed clients.
// This is separate from VIP email notifications — it targets clients
// who toggled notifications ON in the client portal and have a push
// subscription stored in user_push_subscriptions.
import webpush from "web-push";
import { listAllSubscriptions } from "./push.repo";

let _configured = false;

function configureVapid(): void {
  if (_configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.error("[push-send] VAPID keys not configured in env");
    return;
  }
  webpush.setVapidDetails("mailto:noreply@ali-alhaddad.com", publicKey, privateKey);
  _configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/**
 * Sends a web push notification to every client that has an active
 * push subscription. Failures for individual endpoints are logged but
 * do not stop delivery to other subscribers.
 */
export async function sendPushToAllClients(payload: PushPayload): Promise<void> {
  try {
    configureVapid();
    if (!_configured) return;

    const subs = await listAllSubscriptions();
    if (subs.length === 0) return;

    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? "/client-portal",
      icon: payload.icon ?? "/icon-192.png",
    });

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          message,
        ),
      ),
    );

    let failed = 0;
    for (const r of results) {
      if (r.status === "rejected") {
        failed++;
        const err = r.reason as { statusCode?: number; message?: string };
        // 404/410 = subscription no longer valid; log but don't crash
        if (err?.statusCode === 404 || err?.statusCode === 410) continue;
        console.error("[push-send] delivery failed:", err?.message ?? err);
      }
    }

    if (failed > 0) {
      console.error(`[push-send] ${failed}/${subs.length} deliveries failed`);
    }
  } catch (e) {
    console.error("[push-send] unexpected error:", e);
  }
}
