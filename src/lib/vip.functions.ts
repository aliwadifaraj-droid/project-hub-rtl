import { createServerFn } from "@tanstack/react-start";
import { listVipSubscribers as listVipRepo, updateVipStatus as updateVipStatusRepo } from "./vip.repo";

import { requireAdmin } from "./auth-middleware.server";

export type VipSubscriber = Awaited<ReturnType<typeof listVipRepo>>[number];

export const listVipSubscribers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return await listVipRepo();
  });

export const approveVipSubscriber = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await updateVipStatusRepo(data.id, "active");
    return { ok: true };
  });

export const rejectVipSubscriber = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await updateVipStatusRepo(data.id, "rejected");
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
