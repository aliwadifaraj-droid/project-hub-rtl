import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { insertContactMessage } from "./contact-messages.repo";
import * as blockedRepo from "./blocked.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";
import { sendResendEmail } from "./resend-send.server";

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
    let attachment: { filename: string; content: string; contentType: string } | undefined;
    if (data.pdf) {
      const clean = data.pdf.data.replace(/^data:[^;]+;base64,/, "");
      const bytes = atob(clean).length;
      if (bytes > 5 * 1024 * 1024) throw new Error("الحد الأقصى لحجم ملف PDF هو 5 ميغابايت");
      attachment = { filename: data.pdf.filename, content: clean, contentType: data.pdf.mime };
    }
    await insertContactMessage({ name: data.name, email: data.email, message: data.message });
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
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9"><h2>رسالة تواصل جديدة</h2><p><strong>الاسم:</strong> ${safe(data.name)}</p><p><strong>البريد:</strong> ${safe(data.email)}</p><p><strong>الرسالة:</strong></p><p>${safe(data.message).replace(/\n/g, "<br>")}</p></div>`,
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
