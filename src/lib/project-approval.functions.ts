import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import * as projectsRepo from "./projects.repo";
import { getUserById } from "./users.repo";

export const listPendingProjects = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = await projectsRepo.listPending();
    return Promise.all(rows.map(async (p) => {
      const u = p.created_by ? await getUserById(p.created_by).catch(() => null) : null;
      return { ...p, creator_email: u?.email ?? "" };
    }));
  });

export const countPendingProjects = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    if (!context.roles.includes("admin")) return 0;
    return projectsRepo.countPending();
  });

export const approveProject = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const row = await projectsRepo.getById(data.id);
    if (!row) throw new Error("المشروع غير موجود");
    await projectsRepo.updateProject(data.id, { admin_approval: "approved" });

    if (row.created_by) {
      const { insertOne } = await import("./notifications.repo");
      await insertOne({
        user_id: row.created_by,
        title: "تمت الموافقة على مشروعك",
        body: `تمت الموافقة على المشروع: ${row.name}`,
        link: `/projects/${row.id}`,
      });
      try {
        const u = await getUserById(row.created_by);
        if (u?.email) {
          const { sendResendEmail } = await import("./resend-send.server");
          await sendResendEmail({
            to: u.email,
            subject: "تمت الموافقة على مشروعك ✅",
            html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً،</h2><p>يسعدنا إبلاغك بأنه تمت <strong>الموافقة</strong> على مشروعك "${row.name}".</p><p>أصبح مشروعك الآن منشوراً ومتاحاً للعموم.</p></div>`,
          });
        }
      } catch (e) { console.error("project approval email error", e); }
    }
    return { ok: true };
  });

export const rejectProject = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data }) => {
    const row = await projectsRepo.getById(data.id);
    if (!row) throw new Error("المشروع غير موجود");
    await projectsRepo.updateProject(data.id, { admin_approval: "rejected" });
    if (row.created_by) {
      const { insertOne } = await import("./notifications.repo");
      await insertOne({
        user_id: row.created_by,
        title: "تم رفض مشروعك",
        body: data.reason ? `${row.name}: ${data.reason}` : `تم رفض المشروع: ${row.name}`,
      });
    }
    return { ok: true };
  });
