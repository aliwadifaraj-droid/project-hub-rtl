// Client-side hook for managing web push subscriptions.
// Handles iOS Safari detection, PWA install requirement, and graceful fallbacks.
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getVapidPublicKey,
} from "@/lib/push.functions";

type PushStatus =
  | "unsupported"
  | "unsupported-ios-safari"
  | "denied"
  | "granted"
  | "default"
  | "subscribed"
  | "subscribing"
  | "unsubscribing"
  | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  return isIOS && isSafari;
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("default");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const subscribeFn = useServerFn(subscribeToPush);
  const unsubscribeFn = useServerFn(unsubscribeFromPush);
  const getVapidKeyFn = useServerFn(getVapidPublicKey);

  useEffect(() => {
    async function checkInitial() {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (isIOSSafari() && !isInStandaloneMode()) {
        setStatus("unsupported-ios-safari");
        return;
      }
      const perm = Notification.permission;
      if (perm === "denied") {
        setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing && perm === "granted") {
          setStatus("subscribed");
        } else {
          setStatus(perm as PushStatus);
        }
      } catch {
        setStatus(perm as PushStatus);
      }
    }
    checkInitial();
  }, [getVapidKeyFn]);

  const subscribe = useCallback(async () => {
    if (status === "unsupported" || status === "unsupported-ios-safari" || status === "denied") {
      return;
    }
    setStatus("subscribing");
    setErrorMsg(null);
    try {
      const permResult = await Notification.requestPermission();
      if (permResult !== "granted") {
        setStatus("denied");
        setErrorMsg("تم رفض إذن الإشعارات. يمكنك تفعيله من إعدادات المتصفح.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw-push.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      const vapidRes = await getVapidKeyFn();
      if (!vapidRes?.publicKey) {
        setStatus("error");
        setErrorMsg("مفاتيح الإشعارات غير مُهيأة على الخادم.");
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidRes.publicKey),
      });

      const subJson = sub.toJSON();
      await subscribeFn({
        data: {
          endpoint: subJson.endpoint!,
          keys: {
            p256dh: subJson.keys!.p256dh,
            auth: subJson.keys!.auth,
          },
        },
      });

      setStatus("subscribed");
    } catch (err: any) {
      console.error("Push subscription failed", err);
      setStatus("error");
      if (err?.name === "AbortError" || err?.name === "NotAllowedError") {
        setErrorMsg("تم رفض إذن الإشعارات.");
        setStatus("denied");
      } else {
        setErrorMsg("تعذر تفعيل الإشعارات. حاول مرة أخرى.");
      }
    }
  }, [status, subscribeFn, getVapidKeyFn]);

  const unsubscribe = useCallback(async () => {
    setStatus("unsubscribing");
    setErrorMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await unsubscribeFn({ data: { endpoint: existing.endpoint } });
        await existing.unsubscribe();
      }
      setStatus("default");
    } catch (err) {
      console.error("Push unsubscribe failed", err);
      setErrorMsg("تعذر إلغاء الإشعارات.");
      setStatus("subscribed");
    }
  }, [unsubscribeFn]);

  return { status, errorMsg, subscribe, unsubscribe };
}
