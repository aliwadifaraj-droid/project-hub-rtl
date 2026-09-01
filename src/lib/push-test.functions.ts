import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/auth-middleware.server";
import { sendPushToAllClients } from "@/lib/push-send.server";
import { listAllSubscriptions } from "@/lib/push.repo";

// Admin-only diagnostic endpoint to test web push delivery.
// Returns full diagnostic info: subscription count, VAPID key status,
// and per-delivery sent/failed counts.
export const testPush = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const subs = await listAllSubscriptions();
    const count = subs.length;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidConfigured = !!(publicKey && privateKey);

    if (count === 0) {
      return {
        ok: false,
        error: "لا يوجد عملاء مشتركون بالإشعارات حالياً. يجب على العميل تفعيل الإشعارات من بوابة العملاء أولاً.",
        count: 0,
        vapidConfigured,
        sent: 0,
        failed: 0,
      };
    }

    if (!vapidConfigured) {
      return {
        ok: false,
        error: "مفاتيح VAPID غير مضبوطة في متغيرات البيئة على الخادم. تأكد من إضافة VAPID_PUBLIC_KEY و VAPID_PRIVATE_KEY في إعدادات Vercel.",
        count,
        vapidConfigured: false,
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
      sent: result.sent,
      failed: result.failed,
      configError: result.configError,
      message: result.failed === 0
        ? `تم إرسال إشعار تجريبي إلى ${result.sent} مشترك بنجاح`
        : `تم إرسال ${result.sent} بنجاح و فشل ${result.failed} من أصل ${count}`,
    };
  });
