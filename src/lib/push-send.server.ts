// Server-only: send Web Push notifications to all subscribed clients.
// This is separate from VIP email notifications — it targets clients
// who toggled notifications ON in the client portal and have a push
// subscription stored in user_push_subscriptions.
import webpush from "web-push";
import { listAllSubscriptions } from "./push.repo";

let _configured = false;
let _configError: string | null = null;

function configureVapid(): void {
  if (_configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    _configError = "VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set in server env";
    console.error("[push-send] " + _configError);
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

export interface PushResult {
  sent: number;
  failed: number;
  total: number;
  configError: string | null;
}

/**
 * Sends a web push notification to every client that has an active
 * push subscription. Failures for individual endpoints are logged but
 * do not stop delivery to other subscribers.
 */
export async function sendPushToAllClients(payload: PushPayload): Promise<PushResult> {
  try {
    configureVapid();
    if (!_configured) {
      return { sent: 0, failed: 0, total: 0, configError: _configError };
    }

    const subs = await listAllSubscriptions();
    if (subs.length === 0) {
      console.log("[push-send] no subscriptions found — skipping push");
      return { sent: 0, failed: 0, total: 0, configError: null };
    }

    console.log(`[push-send] sending to ${subs.length} subscriber(s): "${payload.title}"`);

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

    let sent = 0;
    let failed = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        const err = r.reason as { statusCode?: number; message?: string; endpoint?: string };
        const statusCode = err?.statusCode ?? "unknown";
        const msg = err?.message ?? String(err);
        console.error(`[push-send] delivery failed (status ${statusCode}): ${msg}`);
      }
    }

    console.log(`[push-send] done: ${sent} sent, ${failed} failed out of ${subs.length}`);
    return { sent, failed, total: subs.length, configError: null };
  } catch (e) {
    console.error("[push-send] unexpected error:", e);
    return { sent: 0, failed: 0, total: 0, configError: String(e) };
  }
}
