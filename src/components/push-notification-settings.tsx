// Push notification settings panel for the admin settings page.
// Handles iOS Safari PWA install guidance.
import { useState } from "react";
import { Bell, BellOff, Loader2, AlertCircle, Smartphone, CheckCircle2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushNotificationSettings() {
  const { status, errorMsg, subscribe, unsubscribe } = usePushNotifications();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isIOSSafari =
    typeof navigator !== "undefined" &&
    (/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
    /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

  const isInStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true);

  if (status === "unsupported") {
    return (
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BellOff className="h-4 w-4" />
          متصفحك لا يدعم إشعارات Web Push.
        </div>
      </div>
    );
  }

  if (status === "unsupported-ios-safari" || (isIOSSafari && !isInStandalone)) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Smartphone className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              تفعيل الإشعارات على iPhone
            </h3>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              على متصفح Safari في iPhone، تتطلب الإشعارات تثبيت التطبيق كـ PWA أولاً.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowIosGuide((v) => !v)}
          className="text-xs font-medium text-amber-700 dark:text-amber-300 underline"
        >
          {showIosGuide ? "إخفاء الخطوات" : "عرض خطوات التثبيت"}
        </button>

        {showIosGuide && (
          <ol className="space-y-2 text-xs text-amber-800 dark:text-amber-200 list-decimal list-inside">
            <li>افتح هذا الموقع في متصفح Safari على iPhone.</li>
            <li>اضغط على زر المشاركة (المربع مع السهم لأعلى) في أسفل الشاشة.</li>
            <li>اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).</li>
            <li>اضغط "إضافة" لتثبيت التطبيق.</li>
            <li>افتح التطبيق من الشاشة الرئيسية، ثم عُد لهذه الصفحة وفعّل الإشعارات.</li>
          </ol>
        )}
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-destructive">الإشعارات مغلقة</h3>
            <p className="mt-1 text-xs text-destructive/80">
              تم رفض إذن الإشعارات في المتصفح. لإعادة التفعيل:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-destructive/80 list-disc list-inside">
              <li>افتح إعدادات الموقع (أيقونة القفل بجانب العنوان).</li>
              <li>فعّل "الإشعارات" من قائمة الأذونات.</li>
              <li>أعد تحميل الصفحة وحاول مرة أخرى.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-300">
              الإشعارات مفعّلة
            </h3>
            <p className="text-xs text-green-600 dark:text-green-400">
              ستصل إشعارات فورية على هذا الجهاز.
            </p>
          </div>
          <button
            onClick={unsubscribe}
            disabled={status === "unsubscribing"}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
          >
            {status === "unsubscribing" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BellOff className="h-3.5 w-3.5" />
            )}
            إيقاف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold">إشعارات Web Push</h3>
          <p className="text-xs text-muted-foreground">
            فعّل الإشعارات لتصلك تنبيهات فورية عن العروض والطلبات الجديدة.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        onClick={subscribe}
        disabled={status === "subscribing"}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {status === "subscribing" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جارٍ التفعيل…
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            تفعيل الإشعارات
          </>
        )}
      </button>
    </div>
  );
}
