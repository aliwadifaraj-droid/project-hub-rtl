// Web Push server functions: subscribe, unsubscribe, send notifications.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import webpush from "web-push";
import { requireAuth } from "./auth-middleware.server";
import * as pushRepo from "./push-subscriptions.repo";

function getVapidKeys() {
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@alomran.sa";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function ensureVapidConfigured() {
  const keys = getVapidKeys();
  if (!keys) return false;
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  return true;
}

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const subscribeToPush = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => subscribeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await pushRepo.saveSubscription(
      context.userId,
      data.endpoint,
      data.keys.p256dh,
      data.keys.auth,
    );
    return { ok: true };
  });

export const unsubscribeFromPush = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({ endpoint: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ data }) => {
    await pushRepo.removeSubscription(data.endpoint);
    return { ok: true };
  });

export const getVapidPublicKey = createServerFn({ method: "GET" })
  .handler(async () => {
    const keys = getVapidKeys();
    return { publicKey: keys?.publicKey ?? null };
  });

export const sendPushNotification = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().optional(),
      title: z.string().min(1).max(200),
      body: z.string().min(1).max(500),
      link: z.string().optional().default("/admin"),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!ensureVapidConfigured()) {
      return { ok: false, message: "VAPID keys not configured" };
    }
    const targetUserId = data.userId ?? null;
    const subs = targetUserId
      ? await pushRepo.listSubscriptionsForUser(targetUserId)
      : await pushRepo.listAllSubscriptions();

    if (subs.length === 0) return { ok: false, message: "No subscriptions found" };

    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      link: data.link,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "alomran-notification",
      requireInteraction: false,
      data: { link: data.link },
    });

    let sent = 0;
    let failed = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await pushRepo.removeSubscription(sub.endpoint).catch(() => {});
        }
      }
    }
    return { ok: true, sent, failed };
  });
