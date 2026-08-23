import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@libsql/client";

async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[check-subscriptions] RESEND_API_KEY missing — skipping email");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Alamran <send@ali-alhaddad.com>",
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[check-subscriptions] Resend send failed", res.status, errText);
      return false;
    }
    console.log("[check-subscriptions] Resend email sent to", opts.to);
    return true;
  } catch (e) {
    console.error("[check-subscriptions] Resend send exception", e);
    return false;
  }
}

async function runCheckSubscriptions(): Promise<{
  expiredCount: number;
  expiredEmailed: number;
  expiredEmailFailed: number;
  reminderCount: number;
  reminderEmailed: number;
  reminderEmailFailed: number;
}> {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is required");
  }

  const client = createClient({ url, authToken });

  // --- 1. Find and mark expired subscribers (status = 'active' AND expires_at <= now) ---
  const expiredRows = await client.execute({
    sql: `SELECT id, name, email, plan, city, expires_at
          FROM vip_subscribers
          WHERE status = 'active'
            AND expires_at IS NOT NULL
            AND datetime(expires_at) <= datetime('now')`,
  });

  const expired = expiredRows.rows.map((r) => ({
    id: String(r.id),
    name: r.name as string | null,
    email: r.email as string | null,
    plan: r.plan as string | null,
    city: r.city as string | null,
    expires_at: r.expires_at as string | null,
  }));

  let expiredEmailed = 0;
  let expiredEmailFailed = 0;

  if (expired.length > 0) {
    await client.execute({
      sql: `UPDATE vip_subscribers
            SET status = 'expired'
            WHERE status = 'active'
              AND expires_at IS NOT NULL
              AND datetime(expires_at) <= datetime('now')`,
    });

    for (const row of expired) {
      if (!row.email || !row.email.trim()) continue;
      const ok = await sendResendEmail({
        to: row.email.trim(),
        subject: "انتهى اشتراك VIP",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto">
          <h2 style="color:#b45309">مرحباً ${row.name ?? ""},</h2>
          <p>نود إعلامك بأن <strong>اشتراكك في باقة VIP قد انتهى</strong>.</p>
          <p>المدينة: ${row.city ?? "—"} | الباقة: ${row.plan ?? "—"}</p>
          <p>للتجديد أو الاستفسار، يرجى التواصل معنا.</p>
          <p>شكراً لثقتك بمنصة العمران.</p>
        </div>`,
      });
      if (ok) {
        expiredEmailed++;
        await client.execute({
          sql: `UPDATE vip_subscribers SET notified = 1 WHERE id = ?`,
          args: [row.id],
        });
      } else {
        expiredEmailFailed++;
      }
    }
  }

  // --- 2. Find subscribers expiring within 24 hours (reminder) ---
  const threshold = new Date(Date.now() + 24 * 3600_000).toISOString();
  const soonRows = await client.execute({
    sql: `SELECT id, name, email, plan, city, expires_at
          FROM vip_subscribers
          WHERE status = 'active'
            AND expires_at IS NOT NULL
            AND datetime(expires_at) > datetime('now')
            AND datetime(expires_at) <= datetime(?)
            AND notified = 0
          ORDER BY expires_at ASC`,
    args: [threshold],
  });

  const soon = soonRows.rows.map((r) => ({
    id: String(r.id),
    name: r.name as string | null,
    email: r.email as string | null,
    plan: r.plan as string | null,
    city: r.city as string | null,
    expires_at: r.expires_at as string | null,
  }));

  let reminderEmailed = 0;
  let reminderEmailFailed = 0;

  for (const row of soon) {
    if (!row.email || !row.email.trim()) continue;
    const ok = await sendResendEmail({
      to: row.email.trim(),
      subject: "تذكير: اشتراك VIP ينتهي قريباً",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto">
        <h2 style="color:#b45309">مرحباً ${row.name ?? ""},</h2>
        <p>ينتهي اشتراكك في باقة VIP خلال 24 ساعة.</p>
        <p>المدينة: ${row.city ?? "—"} | الباقة: ${row.plan ?? "—"}</p>
        <p>للتجديد أو الاستفسار، يرجى التواصل معنا في أقرب وقت.</p>
      </div>`,
    });
    if (ok) {
      reminderEmailed++;
      await client.execute({
        sql: `UPDATE vip_subscribers SET notified = 1 WHERE id = ?`,
        args: [row.id],
      });
    } else {
      reminderEmailFailed++;
    }
  }

  return {
    expiredCount: expired.length,
    expiredEmailed,
    expiredEmailFailed,
    reminderCount: soon.length,
    reminderEmailed,
    reminderEmailFailed,
  };
}

export const Route = createFileRoute("/api/cron/check-subscriptions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env.CRON_SECRET ?? "";
        if (expected) {
          const auth = request.headers.get("authorization") ?? "";
          if (auth !== `Bearer ${expected}`) {
            return new Response(JSON.stringify({ error: "unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
        try {
          const result = await runCheckSubscriptions();
          console.log("[check-subscriptions] result", result);
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "cron failed";
          console.error("[check-subscriptions] error", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
