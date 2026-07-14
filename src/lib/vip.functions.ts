import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./auth-middleware.server";
import * as vipRepo from "./vip.repo";
import { listUsersWithRoles } from "./users.repo";

export const listVipSubscribers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const data = await vipRepo.listVipSubscribers();
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

export const submitVipSubscription = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string; receipt_path: string; plan: string }) => {
    if (!data?.name?.trim() || !data?.email?.trim()) throw new Error("الاسم والبريد مطلوبان");
    if (!data?.receipt_path?.trim()) throw new Error("إيصال التحويل مطلوب");
    if (!data?.plan?.trim()) throw new Error("اختر الباقة");
    return { name: data.name.trim(), email: data.email.trim(), receipt_path: data.receipt_path.trim(), plan: data.plan.trim() };
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
    if (!data?.id || !data?.receipt_path) throw new Error("بيانات ناقصة");
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
