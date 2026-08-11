// Cron endpoint: expires approved VIP subscribers whose membership has lapsed.
// Does NOT send emails yet — only marks rows as expired + notified.
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

          for (const row of rows) {
            await db.execute(
              `UPDATE vip_subscribers SET status = 'expired', notified = 1 WHERE id = ?`,
              [row.id],
            );
          }

          return new Response(
            JSON.stringify({ processed: rows.length }),
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
