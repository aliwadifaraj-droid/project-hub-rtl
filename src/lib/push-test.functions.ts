import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/auth-middleware.server";
import { sendPushToAllClients } from "@/lib/push-send.server";
import { listAllSubscriptions } from "@/lib/push.repo";

// Admin-only diagnostic endpoint to test web push delivery.
// Returns the count of subscriptions and whether the push was attempted.
export const testPush = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const subs = await listAllSubscriptions();
    const count = subs.length;

    if (count === 0) {
      return { ok: false, error: "لا يوجد عملاء مشتركون بالإشعارات حالياً", count: 0 };
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      return { ok: false, error: "مفاتيح VAPID غير مضبوطة في متغيرات البيئة على الخادم", count };
    }

    await sendPushToAllClients({
      title: "إشعار تجريبي",
      body: "هذا إشعار تجريبي للتحقق من عمل الإشعارات",
      url: "/client-portal",
    });

    return { ok: true, count, message: `تم إرسال إشعار تجريبي إلى ${count} مشترك` };
  });
