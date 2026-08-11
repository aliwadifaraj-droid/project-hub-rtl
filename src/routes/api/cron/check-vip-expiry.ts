// Cron endpoint: expires approved VIP subscribers whose membership has lapsed.
// Marks rows as expired + notified and sends a cancellation email via Resend.
import { createFileRoute } from "@tanstack/react-router";
import { db, rowsToObjects } from "@/lib/db";

export const Route = createFileRoute("/api/cron/check-vip-expiry")({
  server: {
    handlers: {
      POST: async () => {
        try {
          // Make sure the `notified` column exists on older databases.
          try {
            await db.execute(
              `ALTER TABLE vip_subscribers ADD COLUMN notified INTEGER NOT NULL DEFAULT 0`,
            );
          } catch {
            /* column already exists */
          }

          // Select approved subscribers whose expiry has passed and not yet notified.
          const result = await db.execute(
            `SELECT id, email, name FROM vip_subscribers
             WHERE status = 'approved'
               AND expires_at IS NOT NULL
               AND expires_at <= datetime('now')
               AND notified = 0`,
          );
          const rows = rowsToObjects<{
            id: string;
            email: string | null;
            name: string | null;
          }>(result);

          const resendApiKey = process.env.RESEND_API_KEY;
          let emailed = 0;

          for (const row of rows) {
            await db.execute(
              `UPDATE vip_subscribers SET status = 'expired', notified = 1 WHERE id = ?`,
              [row.id],
            );

            if (resendApiKey && row.email) {
              try {
                const displayName = row.name || "عميلنا العزيز";
                const res = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendApiKey}`,
                  },
                  body: JSON.stringify({
                    from: "Alamran <send@ali-alhaddad.com>",
                    to: [row.email],
                    subject: "تم الغاء اشتراكك المميز",
                    html: `<p>مرحبا ${displayName}</p><p>تم الغاء اشتراكك المميز لانتهاء المدة.</p><p>لتجديد الاشتراك: <a href="https://ali-alhaddad.com">https://ali-alhaddad.com</a></p>`,
                  }),
                });
                if (res.ok) emailed++;
              } catch {
                /* email failure is non-fatal — row already marked */
              }
            }
          }

          return new Response(
            JSON.stringify({ processed: rows.length, emailed }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "unknown error";
          return new Response(
            JSON.stringify({ error: msg }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
