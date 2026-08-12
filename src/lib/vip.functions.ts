import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./auth-middleware.server";
import * as vipRepo from "./vip.repo";
import { listUsersWithRoles } from "./users.repo";

export const getMyVipStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { project_id: string }) => {
    if (!d?.project_id) throw new Error("project_id مطلوب");
    return d;
  })
  .handler(async ({ data }) => {
    let email: string | null = null;
    try {
      const { getSessionClaims } = await import("./auth.server");
      const claims = await getSessionClaims();
      if (claims) email = claims.email;
    } catch { /* not logged in */ }
    if (!email) return { isVip: false, city: null };

    const sub = await vipRepo.findActiveByEmail(email);
    if (!sub) return { isVip: false, city: null };

    const isActive = sub.status === "active" && sub.expires_at
      ? new Date(sub.expires_at).getTime() > Date.now()
      : false;

    return { isVip: isActive, city: sub.city ?? null };
  });

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
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name ?? ""},</h2><p>تم <strong>تفعيل</strong> الحصرية لمشروعك لمدة 6 ساعات.</p></div>`,
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
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name ?? ""},</h2><p>تم <strong>تفعيل</strong> اشتراكك في باقة VIP${planText} بنجاح.</p><p>يمكنك الآن الاستفادة من جميع مزايا الاشتراك.</p><p>شكراً لثقتكم بنا.</p></div>`,
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
    if (!data?.email?.trim()) throw new Error("البريد مطلوب");
    if (!data?.duration_minutes || data.duration_minutes <= 0) throw new Error("المدة يجب أن تكون أكبر من صفر");
    return { email: data.email.trim(), duration_minutes: data.duration_minutes };
  })
  .handler(async ({ data }) => {
    const { db } = await import("./db");
    await db.execute(`ALTER TABLE vip_subscribers ADD COLUMN notified INTEGER NOT NULL DEFAULT 0`).catch(() => undefined);
    const id = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + data.duration_minutes * 60 * 1000);
    await db.execute(
      `INSERT INTO vip_subscribers (id, name, email, plan, status, starts_at, expires_at, notified, created_at)
       VALUES (?, ?, ?, ?, 'approved', ?, ?, 0, ?)`,
      [id, "اختبار", data.email, `تجربة ${data.duration_minutes} دقايق`, now.toISOString(), expiresAt.toISOString(), now.toISOString()],
    );
    return { id, email: data.email };
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
