// Vercel cron job: expires approved VIP subscribers whose subscription
// has lapsed and emails them a cancellation notice.
// Scheduled via vercel.json — protected by CRON_SECRET bearer token.
import { createFileRoute } from "@tanstack/react-router";
import { db, rowsToObjects } from "@/lib/db";
import { sendResendEmail } from "@/lib/resend-send.server";

type ExpiredVip = { id: string; email: string; name: string };

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export const Route = createFileRoute("/api/cron/check-vip-expiry")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
        if (!expected || authHeader !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
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
                    <p style="margin:0 0 16px">مرحباً ${esc(displayName)}</p>
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

          return new Response(
            JSON.stringify({ ok: true, processed: rows.length, expired, emailed, errors }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "unknown error";
          return new Response(
            JSON.stringify({ ok: false, error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
