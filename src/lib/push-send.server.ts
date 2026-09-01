// Server-only: send Web Push notifications to all subscribed clients.
// This is separate from VIP email notifications — it targets clients
// who toggled notifications ON in the client portal and have a push
// subscription stored in user_push_subscriptions.
import webpush from "web-push";
import { listAllSubscriptions } from "./push.repo";

let _configured = false;
let _configError: string | null = null;

export interface VapidConfigStatus {
  publicKey: string;
  privateKey: string;
  subject: string;
  publicKeyConfigured: boolean;
  privateKeyConfigured: boolean;
}

function readVapidConfig(): VapidConfigStatus {
  const publicKey = (process.env.VAPID_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY ?? "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY ?? "").trim();
  const subject = (process.env.VAPID_SUBJECT ?? "mailto:noreply@ali-alhaddad.com").trim();

  return {
    publicKey,
    privateKey,
    subject,
    publicKeyConfigured: publicKey.length > 0,
    privateKeyConfigured: privateKey.length > 0,
  };
}

export function getVapidConfigStatus(): Omit<VapidConfigStatus, "publicKey" | "privateKey"> {
  const { publicKey, privateKey, subject, publicKeyConfigured, privateKeyConfigured } = readVapidConfig();
  return { subject, publicKeyConfigured, privateKeyConfigured };
}

function configureVapid(): void {
  if (_configured) return;

  const { publicKey, privateKey, subject, publicKeyConfigured, privateKeyConfigured } = readVapidConfig();
  if (!publicKeyConfigured || !privateKeyConfigured) {
    _configError = `VAPID settings missing: public=${publicKeyConfigured}, private=${privateKeyConfigured}`;
    console.error("[push-send] " + _configError);
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
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
        const err = r.reason as { statusCode?: number; message?: string };
        console.error(`[push-send] delivery failed (status ${err?.statusCode ?? "unknown"}): ${err?.message ?? String(err)}`);
      }
    }

    console.log(`[push-send] done: ${sent} sent, ${failed} failed out of ${subs.length}`);
    return { sent, failed, total: subs.length, configError: null };
  } catch (e) {
    console.error("[push-send] unexpected error:", e);
    return { sent: 0, failed: 0, total: 0, configError: String(e) };
  }
}
