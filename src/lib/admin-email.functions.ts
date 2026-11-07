import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";

const attachmentSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  content: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/).max(7_000_000),
});

const imageSignatures = {
  "image/jpeg": "/9j/",
  "image/png": "iVBORw0KGgo",
  "image/webp": "UklGR",
  "image/gif": "R0lGOD",
} as const;

export const adminSendEmailWithImage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({
    to: z.string().trim().email().max(255),
    subject: z.string().trim().min(1).max(300),
    message: z.string().trim().min(1).max(10000),
    attachment: attachmentSchema.optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");

    if (data.attachment) {
      const { content, contentType } = data.attachment;
      if (!content.startsWith(imageSignatures[contentType]) || Math.floor(content.length * 3 / 4) > 5 * 1024 * 1024) {
        throw new Error("الصورة المرفقة غير صالحة أو كبيرة جداً");
      }
    }

    const safeMessage = data.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    const safeSubject = data.subject.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px;color:#1e293b">${safeSubject}</h2><p style="color:#1e293b;line-height:1.9">${safeMessage}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="color:#94a3b8;font-size:12px">رسالة من فريق منصة العمران.</p></div></div>`;
    const payload = {
      from: "Alamran <send@ali-alhaddad.com>",
      to: [data.to],
      subject: data.subject,
      html,
      ...(data.attachment ? { attachments: [{ filename: data.attachment.filename.replace(/[\\/]/g, "_"), content: data.attachment.content }] } : {}),
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
    return { ok: true };
  });
