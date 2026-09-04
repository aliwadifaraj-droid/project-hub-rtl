import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./auth-middleware.server";
import { getSessionClaims } from "./auth.server";
import * as vipRepo from "./vip.repo";
import { listUsersWithRoles } from "./users.repo";

export const listVipSubscribers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const data = await vipRepo.listVipWithProjectNames();
    const rows = await Promise.all(
      data.map(async (r) => {
        let receipt_url: string | null = null;
        if (r.receipt_path) {
          const { signGetUrl } = await import("./r2");
          receipt_url = await signGetUrl(r.receipt_path, 3600).catch(() => null);
        }
        return { ...r, receipt_url };
      }),
    );
    return rows;
  });

export const approveVipByProject = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { project_id: string }) => {
    if (!d?.project_id) throw new Error("project_id مطلوب");
    return d;
  })
  .handler(async ({ data }) => {
    const row = await vipRepo.approveByProject(data.project_id);
    if (!row) throw new Error("لا يوجد مشترك مرتبط بهذا المشروع");
    if (row.email) {
      try {
        const { sendResendEmail } = await import("./resend-send.server");
        await sendResendEmail({
          to: row.email,
          subject: "تم تفعيل الحصرية VIP ✅",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name ?? ""},</h2><p>تم <strong>تفعيل</strong> الحصرية لمشروعك لمدة 30 يوماً.</p></div>`,
        });
      } catch (e) {
        console.error("vip project approval email error", e);
      }
    }
    return { ok: true };
  });

export const cancelVipByProject = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { project_id: string }) => {
    if (!d?.project_id) throw new Error("project_id مطلوب");
    return d;
  })
  .handler(async ({ data }) => {
    await vipRepo.cancelByProject(data.project_id);
    return { ok: true };
  });

export const listAllProjectVipStatus = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return vipRepo.listAllApprovedWithProject();
  });

export const adminStopVip = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { city: string }) => {
    if (!d?.city) throw new Error("city مطلوبة");
    return d;
  })
  .handler(async ({ data }) => {
    return vipRepo.stopVipByCity(data.city);
  });

export const adminStartVip = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { city: string; hours: number }) => {
    if (!d?.city) throw new Error("city مطلوبة");
    if (!Number.isFinite(d.hours) || d.hours <= 0) throw new Error("hours يجب أن يكون رقماً موجباً");
    return d;
  })
  .handler(async ({ data }) => {
    return vipRepo.startVipByCity(data.city, data.hours);
  });

export const adminExtendVip = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { city: string; hours: number }) => {
    if (!d?.city) throw new Error("city مطلوبة");
    if (!Number.isFinite(d.hours) || d.hours <= 0) throw new Error("hours يجب أن يكون رقماً موجباً");
    return d;
  })
  .handler(async ({ data }) => {
    return vipRepo.extendVipByCity(data.city, data.hours);
  });

export const getMyVipStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { project_id: string }) => {
    if (!d?.project_id) throw new Error("project_id مطلوب");
    return d;
  })
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    const email = claims?.email ?? null;
    if (!email) return { isVip: false, city: null } as const;
    const row = await vipRepo.getActiveVipByEmail(email);
    if (!row) return { isVip: false, city: null } as const;
    const expired = row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
    return { isVip: !expired, city: row.city ?? null } as const;
  });

export const listVipByProject = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d: { project_id: string }) => {
    if (!d?.project_id) throw new Error("project_id مطلوب");
    return d;
  })
  .handler(async ({ data }) => {
    const rows = await vipRepo.listApprovedByProject(data.project_id);
    return rows;
  });

export const submitVipSubscription = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string; receipt_path: string; plan: string; city: string }) => {
    if (!data?.name?.trim() || !data?.email?.trim()) throw new Error("الاسم والبريد مطلوبان");
    if (!data?.receipt_path?.trim()) throw new Error("إيصال التحويل مطلوب");
    if (!data?.plan?.trim()) throw new Error("اختر الباقة");
    if (!data?.city?.trim()) throw new Error("اختر المدينة");
    return { name: data.name.trim(), email: data.email.trim(), receipt_path: data.receipt_path.trim(), plan: data.plan.trim(), city: data.city.trim() };
  })
  .handler(async ({ data }) => {
    const id = await vipRepo.insertVipSubscriber(data);
    const admins = (await listUsersWithRoles(500)).filter((u) => u.roles.includes("admin"));
    if (admins.length > 0) {
      const { insertMany } = await import("./notifications.repo");
      await insertMany(
        admins.map((a) => ({
          user_id: a.id,
          title: "طلب اشتراك VIP جديد",
          body: "تم رفع إيصال جديد بانتظار الموافقة",
          link: "/admin/vip",
        })),
      );
    }
    return { id };
  });

export const attachVipReceipt = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; receipt_path: string }) => {
    if (!data?.id || !data.receipt_path) throw new Error("بيانات ناقصة");
    return data;
  })
  .handler(async ({ data }) => {
    await vipRepo.updateVipReceipt(data.id, data.receipt_path);
    const admins = (await listUsersWithRoles(500)).filter((u) => u.roles.includes("admin"));
    if (admins.length > 0) {
      const { insertMany } = await import("./notifications.repo");
      await insertMany(
        admins.map((a) => ({
          user_id: a.id,
          title: "طلب اشتراك VIP جديد",
          body: "تم رفع إيصال جديد بانتظار الموافقة",
          link: "/admin/vip",
        })),
      );
    }
    return { ok: true };
  });

export const approveVipSubscriber = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const row = await vipRepo.updateVipStatus(data.id, "active");

    if (row?.email) {
      try {
        const { sendResendEmail } = await import("./resend-send.server");
        const planText = row.plan ? ` (${row.plan})` : "";
        await sendResendEmail({
          to: row.email,
          subject: "تم تفعيل اشتراك VIP ✅",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name ?? ""},</h2><p>تم <strong>تفعيل</strong> اشتراكك في باقة VIP${planText} بنجاح.</p><p>يمكنك الآن الاستفادة من جميع مزايا الاشتراك.</p><p>شكراً لثقتك بنا.</p></div>`,
        });
      } catch (e) {
        console.error("vip approval email error", e);
      }
    }
    return { ok: true };
  });

export const rejectVipSubscriber = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await vipRepo.updateVipStatus(data.id, "rejected");
    return { ok: true };
  });

export const createTrialVipSubscription = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { email: string; duration_minutes: number }) => {
    if (!data?.email?.trim()) throw new Error("البريد الإلكتروني مطلوب");
    if (!Number.isFinite(data.duration_minutes) || data.duration_minutes <= 0)
      throw new Error("مدة التجربة يجب أن تكون رقماً موجباً");
    return { email: data.email.trim(), duration_minutes: data.duration_minutes };
  })
  .handler(async ({ data }) => {
    const row = await vipRepo.createTrialVip(data.email, data.duration_minutes);
    return { id: row.id, email: row.email ?? data.email };
  });

export const createPackageTrialSubscription = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { email: string; receiptFile: string; packageAmount: number; durationMinutes: number }) => {
    if (!data?.email?.trim()) throw new Error("البريد الإلكتروني مطلوب");
    if (!data?.receiptFile?.trim()) throw new Error("رفع الإيصال البنكي إلزامي");
    if (!Number.isFinite(data.packageAmount) || data.packageAmount <= 0)
      throw new Error("قيمة الباقة يجب أن تكون رقماً موجباً");
    if (!Number.isFinite(data.durationMinutes) || data.durationMinutes <= 0)
      throw new Error("مدة الاشتراك يجب أن تكون رقماً موجباً");
    return {
      email: data.email.trim(),
      receiptFile: data.receiptFile.trim(),
      packageAmount: data.packageAmount,
      durationMinutes: data.durationMinutes,
    };
  })
  .handler(async ({ data }) => {
    const { scanReceiptDataUrl, validateOcrResult } = await import("./receipt-ocr");

    let imageDataUrl = data.receiptFile;
    if (!imageDataUrl.startsWith("data:")) {
      const resp = await fetch(imageDataUrl);
      if (!resp.ok) throw new Error(`تعذر تحميل صورة الإيصال (${resp.status})`);
      const buf = await resp.arrayBuffer();
      const mime = resp.headers.get("content-type") ?? "image/jpeg";
      imageDataUrl = `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
    }

    const ocrResult = await scanReceiptDataUrl(imageDataUrl);
    const validation = validateOcrResult(ocrResult, data.packageAmount);
    if (!validation.ok) {
      return { ok: false as const, reason: validation.message };
    }

    const row = await vipRepo.createTrialVip(data.email, data.durationMinutes);
    return { ok: true as const, id: row.id, email: row.email ?? data.email };
  });

export async function runVipExpiryCheckRaw(): Promise<{
  processed: number;
  expired: number;
  expiredEmailed: number;
  emailed: number;
  expiredEmailFailed: number;
  reminderEmailFailed: number;
}> {
  const { expired, rows } = await vipRepo.markExpired();
  let expiredEmailed = 0;
  let expiredEmailFailed = 0;
  const { sendResendEmail } = await import("./resend-send.server");
  for (const row of rows) {
    if (!row.email) continue;
    const ok = await sendResendEmail({
      to: row.email,
      subject: "انتهى اشتراك VIP",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name ?? ""},</h2><p>نود إعلامك بأن <strong>اشتراكك في باقة VIP قد انتهى</strong>.</p><p>للتجديد أو الاستفسار، يرجى التواصل معنا.</p><p>شكراً لثقتك بمنصة العمران.</p></div>`,
    });
    if (ok) expiredEmailed++;
    else expiredEmailFailed++;
  }
  const soon = await vipRepo.findExpiringSoon(24);
  let emailed = 0;
  let reminderEmailFailed = 0;
  for (const row of soon) {
    if (!row.email) continue;
    const ok = await sendResendEmail({
      to: row.email,
      subject: "تذكير: اشتراك VIP ينتهي قريباً",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name ?? ""},</h2><p>ينتهي اشتراكك خلال 24 ساعة.</p></div>`,
    });
    if (ok) emailed++;
    else reminderEmailFailed++;
  }
  return { processed: soon.length, expired, emailed, expiredEmailed, expiredEmailFailed, reminderEmailFailed };
}

export const testVipExpiry = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => runVipExpiryCheckRaw());

export const cronVipExpiry = createServerFn({ method: "GET" }).handler(async () => {
  const result = await runVipExpiryCheckRaw();
  return { ok: true, ...result };
});
