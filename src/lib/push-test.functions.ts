import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/auth-middleware.server";
import { sendPushToAllClients, getVapidConfigStatus } from "@/lib/push-send.server";
import { listAllSubscriptions } from "@/lib/push.repo";

export const testPush = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const subs = await listAllSubscriptions();
    const count = subs.length;
    const vapid = getVapidConfigStatus();
    const vapidConfigured = vapid.publicKeyConfigured && vapid.privateKeyConfigured;

    if (count === 0) {
      return {
        ok: false,
        error: "لا يوجد عملاء مشتركون بالإشعارات حالياً. يجب على العميل تفعيل الإشعارات من بوابة العملاء أولاً.",
        count: 0,
        vapidConfigured,
        publicKeyConfigured: vapid.publicKeyConfigured,
        privateKeyConfigured: vapid.privateKeyConfigured,
        sent: 0,
        failed: 0,
      };
    }

    if (!vapidConfigured) {
      const missing = [
        !vapid.publicKeyConfigured ? "VAPID_PUBLIC_KEY أو VITE_VAPID_PUBLIC_KEY" : null,
        !vapid.privateKeyConfigured ? "VAPID_PRIVATE_KEY" : null,
      ].filter(Boolean).join(" و ");
      return {
        ok: false,
        error: `الخادم لا يرى المتغير التالي: ${missing}. أعد النشر بعد حفظ المتغيرات في Vercel.`,
        count,
        vapidConfigured: false,
        publicKeyConfigured: vapid.publicKeyConfigured,
        privateKeyConfigured: vapid.privateKeyConfigured,
        sent: 0,
        failed: 0,
      };
    }

    const result = await sendPushToAllClients({
      title: "إشعار تجريبي",
      body: "هذا إشعار تجريبي للتحقق من عمل الإشعارات",
      url: "/client-portal",
    });

    return {
      ok: result.sent > 0,
      count,
      vapidConfigured: true,
      publicKeyConfigured: true,
      privateKeyConfigured: true,
      sent: result.sent,
      failed: result.failed,
      configError: result.configError,
      message: result.failed === 0
        ? `تم إرسال إشعار تجريبي إلى ${result.sent} مشترك بنجاح`
        : `تم إرسال ${result.sent} بنجاح و فشل ${result.failed} من أصل ${count}`,
    };
  });
