import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getSessionClaims } from "@/lib/auth.server";
import { getContactMessageById, setContactReply } from "@/lib/contact-messages.repo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

const bodySchema = z.object({
  id: z.string().min(1),
  reply: z.string().trim().min(1).max(5000),
});

export const Route = createFileRoute("/app/api/reply-contact")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        const claims = await getSessionClaims();
        if (!claims) return jsonResponse({ error: "Unauthorized" }, 401);
        if (!claims.roles.includes("admin")) return jsonResponse({ error: "Forbidden" }, 403);

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return jsonResponse({ error: "Invalid JSON body" }, 400);
        }

        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          return jsonResponse({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
        }

        const { id, reply } = parsed.data;
        const msg = await getContactMessageById(id);
        if (!msg) return jsonResponse({ error: "الرسالة غير موجودة" }, 404);
        if (!msg.email) return jsonResponse({ error: "لا يوجد بريد للرد عليه" }, 400);

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) return jsonResponse({ error: "RESEND_API_KEY غير مضبوط" }, 500);

        const safeReply = reply
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/\n/g, "<br/>");

        const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb">
<h2 style="margin:0 0 12px;color:#1e293b">رد من فريق منصة العمران</h2>
<p style="color:#475569">مرحباً ${msg.name || ""}،</p>
<p style="color:#1e293b;line-height:1.9">${safeReply}</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
<p style="color:#94a3b8;font-size:12px">هذا رد على رسالتك في صفحة "تواصل بنا" بمنصة العمران.</p>
</div></div>`;

        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              from: "Alamran <send@ali-alhaddad.com>",
              to: [msg.email],
              subject: "رد على رسالتك في منصة العمران",
              html,
            }),
          });
          if (!res.ok) {
            const errText = await res.text();
            return jsonResponse({ error: `فشل الإرسال (${res.status}): ${errText.slice(0, 300)}` }, 502);
          }
        } catch (err: any) {
          return jsonResponse({ error: err?.message ?? "Network error sending email" }, 502);
        }

        await setContactReply(id, reply);
        return jsonResponse({ ok: true });
      },
    },
  },
});
