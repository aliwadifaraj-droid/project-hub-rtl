import { createServerFn } from "@tanstack/react-start";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
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
        return {...r, receipt_url };
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
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name?? ""},</h2><p>تم <strong>تفعيل</strong> الحصرية لمشروعك لمدة 30 يوماً.</p></div>`,
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
 .middleware([requireAuth])
 .inputValidator((d: { project_id: string }) => {
    if (!d?.project_id) throw new Error("project_id مطلوب");
    return d;
  })
 .handler(async ({ data, context }) => {
    const email = context.email;
    if (!email) return { isVip: false, city: null } as const;
    const row = await vipRepo.getActiveVipByEmail(email);
    if (!row) return { isVip: false, city: null } as const;
    const expired = row.expires_at? new Date(row.expires_at).getTime() < Date.now() : false;
    return { isVip:!expired, city: row.city?? null } as const;
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
 .inputValidator((data: { name: string; email: string; receipt_path: string; receipt_image: string; plan: string; city: string }) => {
    if (!data?.name?.trim() ||!data?.email?.trim()) throw new Error("الاسم والبريد مطلوبان");
    if (!data?.receipt_path?.trim()) throw new Error("إيصال التحويل مطلوب");
    if (!data?.receipt_image?.trim()) throw new Error("صورة الإيصال مطلوبة للتحقق");
    if (!data?.plan?.trim()) throw new Error("اختر الباقة");
    if (!data?.city?.trim()) throw new Error("اختر المدينة");
    return {
      name: data.name.trim(),
      email: data.email.trim(),
      receipt_path: data.receipt_path.trim(),
      receipt_image: data.receipt_image.trim(),
      plan: data.plan.trim(),
      city: data.city.trim(),
    };
  })
 .handler(async ({ data }) => {
    const id = await vipRepo.insertVipSubscriber({ name: data.name, email: data.email, plan: data.plan, city: data.city, receipt_path: data.receipt_path });
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
    if (!data?.id ||!data?.receipt_path) throw new Error("بيانات ناقصة");
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
        const planText = row.plan? ` (${row.plan})` : "";
        await sendResendEmail({
          to: row.email,
          subject: "تم تفعيل اشتراك VIP ✅",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name?? ""},</h2><p>تم <strong>تفعيل</strong> اشتراكك في باقة VIP${planText} بنجاح.</p><p>يمكنك الآن الاستفادة من جميع مزايا الاشتراك.</p><p>شكراً لثقتك بنا.</p></div>`,
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

async function processVipExpiry(): Promise<{ expired: number; expiredEmailed: number }> {
  const { expired, rows } = await vipRepo.markExpired();
  let expiredEmailed = 0;
  for (const row of rows) {
    if (!row.email) continue;
    try {
      const { sendResendEmail } = await import("./resend-send.server");
      await sendResendEmail({
        to: row.email,
        subject: "تم انتهاء اشتراك VIP",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name?? ""},</h2><p>نود إعلامك بأن <strong>انتهى اشتراكك في باقة VIP</strong>.</p><p>توقفت العروض الحصرية المرتبطة باشتراكك.</p><p>للتجديد أو الاستفسار، يرجى التواصل معنا.</p><p>شكراً لثقتك بمنصة العمران.</p></div>`,
      });
      console.log(`[vip-expiry] تم ارسال اشعار انتهاء لـ ${row.email}`);
      expiredEmailed++;
    } catch (e) {
      console.error(`[vip-expiry] فشل ارسال اشعار انتهاء لـ ${row.email}`, e);
    }
  }
  return { expired, expiredEmailed };
}

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
    const delayMs = data.duration_minutes * 60_000;
    const trialEmail = row.email?? data.email;

    setTimeout(() => {
      processVipExpiry().catch((e) => console.error("[vip-expiry] خطأ في معالجة انتهاء التجربة", e));
    }, delayMs);

    return { id: row.id, email: trialEmail };
  });

export const createPackageTrialSubscription = createServerFn({ method: "POST" })
 .middleware([requireAdmin])
 .inputValidator((data: { email: string; receipt_image: string; package_amount: number }) => {
    if (!data?.email?.trim()) throw new Error("البريد الإلكتروني مطلوب");
    if (!data?.receipt_image?.trim()) throw new Error("رفع الإيصال البنكي إلزامي");
    if (!Number.isFinite(data.package_amount) || data.package_amount <= 0)
      throw new Error("قيمة الباقة يجب أن تكون رقماً موجباً");
    return { email: data.email.trim(), receipt_image: data.receipt_image.trim(), package_amount: data.package_amount };
  })
 .handler(async ({ data }) => {
    // شلنا فحص groq
    const durationMinutes = 7 * 24 * 60;
    const row = await vipRepo.createTrialVip(data.email, durationMinutes);
    return { approved: true, reason: "تم القبول بدون فحص", id: row.id, email: row.email?? data.email };
  });

export const testVipExpiry = createServerFn({ method: "POST" })
 .middleware([requireAdmin])
 .handler(async () => {
    const { expired, expiredEmailed } = await processVipExpiry();
    const soon = await vipRepo.findExpiringSoon(24);
    let emailed = 0;
    for (const row of soon) {
      if (!row.email) continue;
      try {
        const { sendResendEmail } = await import("./resend-send.server");
        await sendResendEmail({
          to: row.email,
          subject: "تذكير: اشتراك VIP ينتهي قريباً",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name?? ""},</h2><p>ينتهي اشتراكك خلال 24 ساعة.</p></div>`,
        });
        emailed++;
      } catch (e) {
        console.error("vip expiry email error", e);
      }
    }
    return { processed: soon.length, expired, emailed, expiredEmailed };
  });
