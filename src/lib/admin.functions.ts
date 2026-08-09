import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import { hashPassword } from "./auth.server";
import { getRolesForUser, findUserById, findUserByEmail, createUser, grantRole, listUsersWithRoles, getRoleNameById, deleteUser as deleteUserRow } from "./users.repo";
import * projectsRepo from "./projects.repo";
import * requestsRepo from "./project-requests.repo";
import * submissionsRepo from "./project-submissions.repo";
import * contactRepo from "./contact-messages.repo";
import { resolveStoredFileUrl } from "./storage-url";
import { cached, cacheKeys, TTL_PROJECTS, invalidateProjectsAll, invalidateQuotes } from "./cache";

async function resolveStoragePath(path: string | null): Promise<string> {
  return resolveStoredFileUrl(path, 60 * 60 * 24 * 7).catch(() => "");
}

// ---------- Public: list projects (cached: projects_all, 5 min) ----------
export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await cached(cacheKeys.projectsAll(), TTL_PROJECTS, async () => {
      const rows = await projectsRepo.listAllProjects();
      return Promise.all(rows.map(async (p) => ({
        id: p.id, name: p.name, description: p.description, location: p.location,
        duration: p.duration, cover_image: p.cover_image, images: p.images,
        pdf_file: p.pdf_file, created_by: p.created_by, status: p.status,
        admin_approval: p.admin_approval,
        cover_url: await resolveStoragePath(p.cover_image).catch(() => ""),
        pdf_url: p.pdf_file ? await resolveStoragePath(p.pdf_file).catch(() => "") : "",
      })))
    });
  } catch (e) {
    console.error("[listProjects] unexpected error:", e);
    return [];
  }
});


export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const p = await projectsRepo.getById(data.id);
      if (!p) return null;
      const cover_url = await resolveStoragePath(p.cover_image).catch(() => "");
      const image_urls = await Promise.all((p.images ?? []).map((path) => resolveStoragePath(path).catch(() => "")));
      const pdf_url = p.pdf_file ? await resolveStoragePath(p.pdf_file).catch(() => "") : "";
      return {
        id: p.id, name: p.name, description: p.description, location: p.location,
        duration: p.duration, cover_image: p.cover_image, images: p.images,
        pdf_file: p.pdf_file, status: p.status,
        offers_enabled: p.offers_enabled,
        cover_url, image_urls, pdf_url,
      };
    } catch (e) {
      console.error("[getProject] unexpected error:", e);
      return null;
    }
  });

// ---------- Public: search requests ----------
export const searchRequests = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) =>
    z.object({ q: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const rows = await requestsRepo.searchRequestsByCompany(data.q);
    const withProj = await Promise.all(rows.map(async (r) => {
      const proj = r.project_id ? await projectsRepo.getById(r.project_id).catch(() => null) : null;
      return { ...r, projects: proj ? { name: proj.name } : null };
    }));
    return withProj;
  });

// ---------- Admin: signed URL for bid PDF ----------
export const getBidPdfUrl = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { path: string }) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");
    if (!isAdmin) {
      const req = await requestsRepo.getRequestByPdfPath(data.path);
      const proj = req?.project_id ? await projectsRepo.getById(req.project_id) : null;
      if (!proj || proj.created_by !== context.userId) throw new Error("غير مصرح بفتح هذا الملف");
    }
    const { signGetUrl } = await import("./r2");
    return signGetUrl(data.path, 60 * 10);
  });

// ---------- Admin/Staff: list requests ----------
export const adminListRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const isAdmin = context.roles.includes("admin");
    const rows = await requestsRepo.listAllRequests();
    return Promise.all(rows.map(async (r) => {
      const proj = r.project_id ? await projectsRepo.getById(r.project_id).catch(() => null) : null;
      const canManage = !!proj && proj.created_by === context.userId;
      return {
        ...r,
        email: isAdmin || canManage ? r.email : null,
        note: isAdmin || canManage ? r.note : null,
        projects: proj ? { name: proj.name } : null,
        can_manage: canManage,
      };

    }));
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string; status: string; note?: string }) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "reviewing", "accepted", "rejected"]),
      note: z.string().trim().max(2000).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");
    const req = await requestsRepo.getRequestById(data.id);
    if (!req) throw new Error("الطلب غير موجود");
    if (!isAdmin) {
      const proj = req.project_id ? await projectsRepo.getById(req.project_id) : null;
      if (!proj || proj.created_by !== context.userId) throw new Error("غير مصرح بتغيير حالة هذا الطلب");
    }
    const note = (data.note ?? "").trim();
    if (!isAdmin && !note) throw new Error("الملاحظة إجبارية للموظف عند تغيير الحالة");
    await requestsRepo.updateRequestStatus(data.id, data.status, note ? note : undefined);

    if (req.email) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const proj = req.project_id ? await projectsRepo.getById(req.project_id).catch(() => null) : null;
        const projectName = proj?.name || req.company_name || "طلبك";
        const statusLabels: Record<string, string> = { new: "جديد", reviewing: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض" };
        const statusColors: Record<string, string> = { new: "#2563eb", reviewing: "#d97706", accepted: "#16a34a", rejected: "#dc2626" };
        const label = statusLabels[data.status] ?? data.status;
        const color = statusColors[data.status] ?? "#111";
        const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px">تحديث حالة طلبك</h2><p>مرحباً،</p><p>نودّ إعلامك بأن حالة طلبك المتعلق بمشروع <strong>"${projectName}"</strong> قد تم تحديثها إلى:</p><p style="font-size:18px;font-weight:bold;color:${color};padding:12px;background:#f3f4f6;border-radius:6px;text-align:center">${label}</p><p>شكراً لاستخدامك <strong>منصة العمران</strong>.</p></div></div>`;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ from: "Alamran <send@ali-alhaddad.com>", to: [req.email], subject: "تحديث حالة طلبك في منصة العمران", html }),
          });
        } catch (e) { console.error("Resend send exception", e); }
      }
    }
    return { ok: true };
  });

// ---------- Admin: send test email ----------
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { to: string }) => z.object({ to: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "Alamran <send@ali-alhaddad.com>",
        to: [data.to],
        subject: "بريد تجريبي من لوحة الإدارة",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً 👋</h2><p>هذا بريد تجريبي للتأكد من عمل إرسال البريد عبر Resend من نطاق <strong>ali-alhaddad.com</strong>.</p><p>الوقت: ${new Date().toLocaleString("ar")}</p></div>`,
      }),
    });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
    let id: string | undefined;
    try { id = JSON.parse(bodyText)?.id; } catch { /* ignore */ }
    return { ok: true, id, to: data.to };
  });

// ---------- Admin: send custom email ----------
export const adminSendCustomEmail = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      to: z.string().trim().email().max(255),
      subject: z.string().trim().min(1).max(300),
      message: z.string().trim().min(1).max(10000),
    }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
    const safe = data.message
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb">
<h2 style="margin:0 0 12px;color:#1e293b">${data.subject.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>
<p style="color:#1e293b;line-height:1.9">${safe}</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
<p style="color:#94a3b8;font-size:12px">رسالة من فريق منصة العمران.</p>
</div></div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "Alamran <send@ali-alhaddad.com>",
        to: [data.to],
        subject: data.subject,
        html,
      }),
    });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
    return { ok: true };
  });

// ---------- Admin: project CRUD ----------
const projectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  location: z.string().trim().min(1).max(300),
  duration: z.string().trim().min(1).max(100),
  cover_image: z.string().trim().min(1).max(500),
  images: z.array(z.string().max(500)).max(20).default([]),
  pdf_file: z.string().trim().max(500).nullable().optional(),
});

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => projectSchema.parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");
    if (!isAdmin) {
      const dup = await projectsRepo.findByOwnerAndName(context.userId, data.name, data.id);
      if (dup) throw new Error("لديك مشروع بنفس الاسم بالفعل");
    }
    if (data.id) {
      const existing = await projectsRepo.getById(data.id);
      if (!existing) throw new Error("المشروع غير موجود");
      if (!isAdmin && existing.created_by !== context.userId) throw new Error("غير مصرح بالتعديل");
      await projectsRepo.updateProject(data.id, {
        name: data.name, description: data.description, location: data.location,
        duration: data.duration, cover_image: data.cover_image, images: data.images,
        pdf_file: data.pdf_file ?? null,
      });
      await invalidateProjectsAll();
      await invalidateQuotes(existing.created_by);
      return { id: data.id };
    }
    const id = await projectsRepo.insertProject({
      name: data.name, description: data.description, location: data.location,
      duration: data.duration, cover_image: data.cover_image, images: data.images,
      pdf_file: data.pdf_file ?? null,
      created_by: context.userId,
      admin_approval: "approved",
    });
    {
      const { notifyVipSubscribersOfNewProject } = await import("./vip-notify.server");
      await notifyVipSubscribersOfNewProject({
        id, name: data.name, description: data.description,
        location: data.location, duration: data.duration,
      });
    }
    await invalidateProjectsAll();
    await invalidateQuotes(context.userId);
    return { id, admin_approval: "approved" };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");
    const existing = await projectsRepo.getById(data.id);
    if (!existing) throw new Error("المشروع غير موجود");
    if (!isAdmin && existing.created_by !== context.userId) throw new Error("غير مصرح بالحذف");
    await projectsRepo.deleteProject(data.id);
    await invalidateProjectsAll();
    await invalidateQuotes(existing.created_by);
    return { ok: true };
  });

export const updateProjectStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["active", "delivered", "cancelled"]),
    }).parse(d))
  .handler(async ({ data }) => {
    const existing = await projectsRepo.getById(data.id);
    await projectsRepo.updateProject(data.id, { status: data.status });
    await invalidateProjectsAll();
    await invalidateQuotes(existing?.created_by);
    return { ok: true };
  });


// ---------- Admin: employees management ----------
export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const users = await listUsersWithRoles(500);
    return users.flatMap((u) => (u.roles.length ? u.roles : ["user"]).map((role) => ({
      user_id: u.id,
      email: u.email,
      role,
      created_at: u.created_at,
    })));
  });

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async (): Promise<{ id: string; name: string; label: string }[]> => {
    const { db, rowsToObjects } = await import("./db");
    const r = await db.execute(`SELECT id,name,label FROM roles ORDER BY name`);
    return rowsToObjects(r).map((x: any) => ({
      id: String(x.id), name: String(x.name), label: String(x.label),
    }));
  });

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { email: string; password: string; role_id: string }) =>
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(6).max(72),
      role_id: z.string().min(1).max(80),
    }).parse(d))
  .handler(async ({ data }) => {
    const roleName = await getRoleNameById(data.role_id);
    if (!roleName) throw new Error("الدور غير موجود");
    if (roleName !== "admin" && roleName !== "employee" && roleName !== "user") throw new Error("نوع الدور غير مدعوم");
    const email = data.email.trim().toLowerCase();
    if (await findUserByEmail(email)) throw new Error("هذا البريد مسجل بالفعل");
    const id = await createUser(email, await hashPassword(data.password));
    await grantRole(id, roleName);
    return { id };
  });

export const deleteEmployee = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await deleteUserRow(data.id);
    return { ok: true };
  });

// ---------- Admin: contact messages ----------
export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = await contactRepo.listMessages();
    return rows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      message: m.message,
      reply: m.reply,
      replied_at: m.replied_at,
      created_at: m.created_at,
    }));
  });

export const adminDeleteContactMessage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await contactRepo.deleteMessage(data.id);
    return { ok: true };
  });

export const adminReplyContactMessage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; reply: string }) =>
    z.object({
      id: z.string().uuid(),
      reply: z.string().trim().min(1).max(5000),
    }).parse(d))
  .handler(async ({ data }) => {
    const msg = await contactRepo.getMessageById(data.id);
    if (!msg) throw new Error("الرسالة غير موجودة");
    if (!msg.email) throw new Error("لا يوجد بريد للرد عليه");
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط");
    const safeReply = data.reply
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px;color:#1e293b">رد من فريق منصة العمران</h2><p style="color:#475569">مرحباً ${msg.name || ""}،</p><p style="color:#1e293b;line-height:1.9">${safeReply}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="color:#94a3b8;font-size:12px">هذا رد على رسالتك في صفحة "تواصل بنا" بمنصة العمران.</p></div></div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: "Alamran <send@ali-alhaddad.com>", to: [msg.email], subject: "رد على رسالتك في منصة العمران", html }),
    });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
    await contactRepo.setReply(data.id, data.reply);
    return { ok: true };
  });

// ---------- Admin: submissions ----------
export const adminListSubmissions = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = await submissionsRepo.listAllSubmissions();
    return Promise.all(rows.map(async (s) => ({
      ...s,
      cover_url: s.cover_image ? await resolveStoragePath(s.cover_image).catch(() => "") : "",
      image_urls: await Promise.all((s.images ?? []).map((p) => resolveStoragePath(p).catch(() => ""))),
      pdf_url: s.pdf_file ? await resolveStoragePath(s.pdf_file).catch(() => "") : "",
    })));
  });

export const adminApproveSubmission = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; action: string }) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["approve", "reject"]),
    }).parse(d))
  .handler(async ({ data }) => {
    const sub = await submissionsRepo.getSubmissionById(data.id);
    if (!sub) throw new Error("الطلب غير موجود");
    if (data.action === "approve") {
      const id = await projectsRepo.insertProject({
        name: sub.name, description: sub.description, location: sub.location,
        duration: sub.duration, cover_image: sub.cover_image, images: sub.images,
        pdf_file: sub.pdf_file, created_by: sub.submitted_by, admin_approval: "approved",
      });
      await invalidateProjectsAll();
      await invalidateQuotes(sub.submitted_by);
      {
        const { notifyVipSubscribersOfNewProject } = await import("./vip-notify.server");
        await notifyVipSubscribersOfNewProject({
          id, name: sub.name, description: sub.description,
          location: sub.location, duration: sub.duration,
        });
      }
    }
    await submissionsRepo.deleteSubmission(data.id);
    return { ok: true };
  });

// ---------- Admin: dashboard stats ----------
export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    return context.roles;
  });

export const countContactMessages = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { since?: string }) =>
    z.object({ since: z.string().datetime().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");
    if (!isAdmin) return { count: 0 };
    const count = await contactRepo.countUnread(data.since);
    return { count };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { db, rowsToObjects } = await import("./db");
    const [projects, requests, messages, users] = await Promise.all([
      db.execute(`SELECT COUNT(*) as cnt FROM projects`),
      db.execute(`SELECT COUNT(*) as cnt FROM project_requests`),
      db.execute(`SELECT COUNT(*) as cnt FROM contact_messages`),
      db.execute(`SELECT COUNT(*) as cnt FROM users`),
    ]);
    return {
      projects: Number(rowsToObjects(projects)[0]?.cnt ?? 0),
      requests: Number(rowsToObjects(requests)[0]?.cnt ?? 0),
      messages: Number(rowsToObjects(messages)[0]?.cnt ?? 0),
      users: Number(rowsToObjects(users)[0]?.cnt ?? 0),
    };
  });

export const adminUpdateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      site_name: z.string().trim().max(200).optional(),
      hero_title: z.string().trim().max(500).optional(),
      hero_subtitle: z.string().trim().max(1000).optional(),
      contact_email: z.string().trim().email().max(255).optional(),
      contact_phone: z.string().trim().max(50).optional(),
      maintenance_mode: z.boolean().optional(),
    }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("./db");
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return { ok: true };
    const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
    const values = entries.map(([, v]) => v);
    await db.execute({
      sql: `UPDATE site_settings SET ${setClauses}`,
      args: values,
    });
    return { ok: true };
  });
