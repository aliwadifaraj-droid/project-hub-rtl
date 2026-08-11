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

export const testVipExpiry = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { db, rowsToObjects } = await import("./db");
    const { sendResendEmail } = await import("./resend-send.server");

    type ExpiredVip = { id: string; email: string | null; name: string | null };

    const result = await db.execute(
      `SELECT id, email, name FROM vip_subscribers
       WHERE status = 'approved' AND expires_at <= datetime('now') AND notified = 0`,
    );
    const rows = rowsToObjects<ExpiredVip>(result);

    let expired = 0;
    let emailed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        await db.execute(
          `UPDATE vip_subscribers SET status = 'expired', notified = 1 WHERE id = ?`,
          [row.id],
        );
        expired++;

        if (row.email) {
          const displayName = row.name || "عزيزي المشترك";
          const html = `
            <div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;line-height:1.9;background:#fff">
              <h2 style="margin:0 0 12px">تم إلغاء اشتراكك المميز</h2>
              <p style="margin:0 0 16px">مرحباً ${displayName}</p>
              <p style="margin:0 0 16px">تم إلغاء اشتراكك المميز لانتهاء المدة.</p>
              <p style="margin:24px 0">
                <a href="https://ali-alhaddad.com" style="background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">
                  لتجديد الاشتراك
                </a>
              </p>
            </div>`;
          await sendResendEmail({
            to: row.email,
            subject: "تم إلغاء اشتراكك المميز",
            html,
          });
          emailed++;
        }
      } catch (e) {
        errors.push(`id=${row.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return { processed: rows.length, expired, emailed, errors };
  });
