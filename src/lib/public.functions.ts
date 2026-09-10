import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { insertContactMessage } from "./contact-messages.repo";
import * as blockedRepo from "./blocked.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";
import { sendResendEmail } from "./resend-send.server";
import { uploadToR2, makeKey } from "./r2";

function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^;]+;base64,/, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(100),
        email: z.string().trim().email().max(200),
        message: z.string().trim().min(1).max(2000),
        wantsPdf: z.enum(["no", "yes"]).default("no"),
        pdf: z
          .object({
            filename: z.string().min(1).max(200),
            mime: z.literal("application/pdf"),
            data: z.string().min(1),
          })
          .optional(),
      })
      .superRefine((value, ctx) => {
        if (value.wantsPdf === "yes" && !value.pdf)
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pdf"], message: "ملف PDF مطلوب" });
        if (value.pdf && !value.pdf.filename.toLowerCase().endsWith(".pdf"))
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pdf"],
            message: "يسمح بملفات PDF فقط",
          });
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (await blockedRepo.isBlocked(data.name, data.email)) throw new Error(BLOCKED_MESSAGE);

    let pdfFileKey: string | null = null;
    let pdfFilename: string | null = null;
    let attachment: { filename: string; content: string } | undefined;

    if (data.pdf) {
      const clean = data.pdf.data.replace(/^data:[^;]+;base64,/, "");
      const bytes = b64ToBytes(data.pdf.data);
      if (bytes.length > 5 * 1024 * 1024) throw new Error("الحد الأقصى لحجم ملف PDF هو 5 ميغابايت");

      pdfFilename = data.pdf.filename;
      const key = makeKey("contact-pdfs", data.pdf.filename);
      await uploadToR2({ key, body: bytes, contentType: "application/pdf" });
      pdfFileKey = key;

      attachment = { filename: data.pdf.filename, content: clean };
    }

    await insertContactMessage({
      name: data.name,
      email: data.email,
      message: data.message,
      pdf_file_key: pdfFileKey,
      pdf_filename: pdfFilename,
    });

    try {
      const safe = (value: string) =>
        value.replace(
          /[&<>"']/g,
          (char) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
        );
      await sendResendEmail({
        to: "aliwadifaraj@gmail.com",
        subject: "رسالة تواصل جديدة من منصة العمران",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9"><h2>رسالة تواصل جديدة</h2><p><strong>الاسم:</strong> ${safe(data.name)}</p><p><strong>البريد:</strong> ${safe(data.email)}</p><p><strong>الرسالة:</strong></p><p>${safe(data.message).replace(/\n/g, "<br>")}</p>${pdfFilename ? `<p><strong>المرفق:</strong> ${safe(pdfFilename)}</p>` : ""}</div>`,
        ...(attachment ? { attachments: [attachment] } : {}),
      });
    } catch (e) {
      console.error("contact email failed", e);
    }
    try {
      const { listUsersWithRoles } = await import("./users.repo");
      const { insertMany } = await import("./notifications.repo");
      const staff = (await listUsersWithRoles(500)).filter(
        (u) => u.roles.includes("admin") || u.roles.includes("employee"),
      );
      if (staff.length > 0) {
        await insertMany(
          staff.map((s) => ({
            user_id: s.id,
            title: "رسالة تواصل جديدة",
            body: `${data.name} — ${data.email}`,
            link: "/admin/messages",
          })),
        );
      }
    } catch (e) {
      console.error("contact notification failed", e);
    }
    return { ok: true };
  });
