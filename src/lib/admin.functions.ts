import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import { hashPassword } from "./auth.server";
import { getRolesForUser, findUserById, findUserByEmail, createUser, grantRole, listUsersWithRoles, getRoleNameById, deleteUser as deleteUserRow } from "./users.repo";
import * as projectsRepo from "./projects.repo";
import * as requestsRepo from "./project-requests.repo";
import * as notificationsRepo from "./notifications.repo";
import * as submissionsRepo from "./project-submissions.repo";
import * as contactRepo from "./contact-messages.repo";
import * as blockedRepo from "./blocked.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";
import { resolveStoredFileUrl } from "./storage-url";
import { cached, cacheKeys, TTL_PROJECTS, invalidateProjectsAll, invalidateQuotes } from "./cache";
import { notifyVipSubscribersOfNewProject, detectCity } from "./vip-notify.server";
import { listActiveByCity, listVipSubscribers } from "./vip.repo";

async function resolveStoragePath(path: string | null): Promise<string> {
  return resolveStoredFileUrl(path, 60 * 60 * 24 * 7).catch(() => "");
}

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
      const exclusive = await projectsRepo.getProjectExclusive(data.id);
      const vip_end_at = exclusive?.vip_end_at ?? null;
      const is_exclusive = vip_end_at ? Date.now() < new Date(vip_end_at).getTime() : false;
      return {
        id: p.id, name: p.name, description: p.description, location: p.location,
        duration: p.duration, cover_image: p.cover_image, images: p.images,
        pdf_file: p.pdf_file, status: p.status,
        offers_enabled: p.offers_enabled,
        is_exclusive,
        exclusive_until: p.exclusive_until,
        vip_end_at,
        cover_url, image_urls, pdf_url,
      };
    } catch (e) {
      console.error("[getProject] unexpected error:", e);
      return null;
    }
  });

export const searchRequests = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => z.object({ q: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const rows = await requestsRepo.searchRequestsByCompany(data.q);
    const withProj = await Promise.all(rows.map(async (r) => {
      const proj = r.project_id ? await projectsRepo.getById(r.project_id).catch(() => null) : null;
      return { ...r, projects: proj ? { name: proj.name } : null };
    }));
    return withProj;
  });

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

export const adminListRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const isAdmin = context.roles.includes("admin");
    const rows = await requestsRepo.listAllRequests();
    return Promise.all(rows.map(async (r) => {
      const proj = r.project_id ? await projectsRepo.getById(r.project_id).catch(() => null) : null;
      const canManage = !!proj && proj.created_by === context.userId;
      return { ...r, email: isAdmin || canManage ? r.email : null, note: isAdmin || canManage ? r.note : null, projects: proj ? { name: proj.name } : null, can_manage: canManage };
    }));
  });

export const getPlatformRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const isAdmin = context.roles.includes("admin");
    const requests = await requestsRepo.listAllRequests();
    const offerNotifs = await notificationsRepo.listOfferNotificationsBySource("platform");
    const fromRequests = await Promise.all(requests.map(async (r) => {
      const proj = r.project_id ? await projectsRepo.getById(r.project_id).catch(() => null) : null;
      const canManage = !!proj && proj.created_by === context.userId;
      return {
        id: r.id,
        project_id: r.project_id,
        company_name: r.company_name,
        facility_location: r.facility_location,
        email: isAdmin || canManage ? r.email : null,
        pdf_url: r.pdf_url,
        status: r.status,
        submitter_type: r.submitter_type ?? "visitor",
        project_type: r.project_type ?? "platform",
        note: r.note,
        created_at: r.created_at,
        projects: proj ? { name: proj.name } : null,
        can_manage: canManage,
      };
    }));
    const fromNotifications = offerNotifs.map((n) => ({
      id: n.id,
      project_id: n.project_id,
      company_name: n.company_name ?? "",
      facility_location: n.facility_location,
      email: isAdmin ? n.email : null,
      pdf_url: n.pdf_key,
      status: n.offer_status ?? "new",
      submitter_type: n.submitter_type ?? "visitor",
      project_type: "platform",
      note: null,
      created_at: n.created_at,
      projects: n.project_name ? { name: n.project_name } : null,
      can_manage: false,
    }));
    const seen = new Set(fromRequests.map((r) => r.id));
    return [...fromRequests, ...fromNotifications.filter((n) => !seen.has(n.id))]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

export const getAddProjectRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const isAdmin = context.roles.includes("admin");
    const offers = await notificationsRepo.listOfferNotificationsBySource("add_project");
    return offers.map((o) => ({
      id: o.id,
      project_id: o.project_id,
      company_name: o.company_name ?? "",
      facility_location: o.facility_location,
      email: isAdmin ? o.email : null,
      pdf_url: o.pdf_key,
      status: o.offer_status ?? "new",
      submitter_type: o.submitter_type ?? "visitor",
      project_type: "add_project",
      note: null,
      created_at: o.created_at,
      projects: o.project_name ? { name: o.project_name } : null,
      can_manage: false,
    }));
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
 .middleware([requireAuth])
 .inputValidator((d: { id: string; status: string; note?: string }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "new", "reviewing", "accepted", "rejected"]), note: z.string().trim().max(2000).optional() }).parse(d))
 .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");

    let req = await requestsRepo.getRequestById(data.id);
    let isOfferNotif = false;

    if (!req) {
      const notif = await notificationsRepo.getOfferNotificationById(data.id);
      if (notif) {
        isOfferNotif = true;
        req = {
          id: notif.id,
          project_id: notif.project_id,
          company_name: notif.company_name,
          facility_location: notif.facility_location,
          email: notif.email,
          pdf_url: notif.pdf_key,
          status: notif.offer_status ?? "new",
          submitter_type: notif.submitter_type,
          project_type: notif.source,
          note: null,
          created_at: notif.created_at,
        } as requestsRepo.ProjectRequestRow;
      }
    }
    if (!req) throw new Error("الطلب غير موجود");

    if (!isAdmin) {
      const proj = req.project_id? await projectsRepo.getById(req.project_id) : null;
      if (!proj || proj.created_by!== context.userId) throw new Error("غير مصرح بتغيير حالة هذا الطلب");
    }

    const note = (data.note?? "").trim();
    if (!isAdmin &&!note) throw new Error("الملاحظة إجبارية للموظف عند تغيير الحالة");

    if (isOfferNotif) {
      if (data.status === "accepted") {
        const notif = await notificationsRepo.getOfferNotificationById(data.id);
        if (notif) {
          const requestId = await requestsRepo.insertRequest({
            project_id: notif.project_id ?? "",
            company_name: notif.company_name ?? "",
            facility_location: notif.facility_location ?? notif.project_name ?? "",
            email: notif.email ?? "",
            pdf_url: notif.pdf_key ?? "",
            submitter_type: notif.submitter_type ?? "offer",
            project_type: notif.source ?? "platform",
          });
          await requestsRepo.updateRequestStatus(requestId, "new");
          await notificationsRepo.deleteOfferNotification(notif.id);
        }
      } else {
        await notificationsRepo.updateOfferNotificationStatus(data.id, data.status);
      }
    } else {
      await requestsRepo.updateRequestStatus(data.id, data.status, note? note : undefined);
    }

    if (req.email) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const proj = req.project_id? await projectsRepo.getById(req.project_id).catch(() => null) : null;
        const projectName = proj?.name || req.company_name || "طلبك";
        const statusLabels: Record<string, string> = { pending: "قيد الانتظار", new: "جديد", reviewing: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض" };
        const statusColors: Record<string, string> = { pending: "#6b7280", new: "#2563eb", reviewing: "#d97706", accepted: "#16a34a", rejected: "#dc2626" };
        const label = statusLabels[data.status]?? data.status;
        const color = statusColors[data.status]?? "#111";
        const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px">تحديث حالة طلبك</h2><p>مرحباً،</p><p>نودّ إعلامك بأن حالة طلبك المتعلق بمشروع <strong>"${projectName}"</strong> قد تم تحديثها إلى:</p><p style="font-size:18px;font-weight:bold;color:${color};padding:12px;background:#f3f4f6;border-radius:6px;text-align:center">${label}</p><p>شكراً لاستخدامك <strong>منصة العمران</strong>.</p></div></div>`;
        try { await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ from: "Alamran <send@ali-alhaddad.com>", to: [req.email], subject: "تحديث حالة طلبك في منصة العمران", html }) }); } catch (e) { console.error("Resend send exception", e); }
      }
    }
    return { ok: true };
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { to: string }) => z.object({ to: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ from: "Alamran <send@ali-alhaddad.com>", to: [data.to], subject: "بريد تجريبي من لوحة الإدارة", html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً 👋</h2><p>هذا بريد تجريبي للتأكد من عمل إرسال البريد عبر Resend من نطاق <strong>ali-alhaddad.com</strong>.</p><p>الوقت: ${new Date().toLocaleString("ar")}</p></div>` }) });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
    let id: string | undefined; try { id = JSON.parse(bodyText)?.id; } catch { }
    return { ok: true, id, to: data.to };
  });

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
      await projectsRepo.updateProject(data.id, { name: data.name, description: data.description, location: data.location, duration: data.duration, cover_image: data.cover_image, images: data.images, pdf_file: data.pdf_file ?? null });
      await invalidateProjectsAll();
      await invalidateQuotes(existing.created_by);
      return { id: data.id };
    }
    const id = await projectsRepo.insertProject({ name: data.name, description: data.description, location: data.location, duration: data.duration, cover_image: data.cover_image, images: data.images, pdf_file: data.pdf_file ?? null, created_by: context.userId, admin_approval: "approved" });
    const city = detectCity(data.location);
    const hasVip = city ? (await listActiveByCity(city)).length > 0 : false;
    if (hasVip) {
      const now = new Date();
      const vipEndAt = new Date(now.getTime() + 6 * 3600_000);
      await projectsRepo.setProjectExclusive(id, now.toISOString(), vipEndAt.toISOString());
    }
    notifyVipSubscribersOfNewProject({ id, name: data.name, description: data.description, location: data.location, duration: data.duration }).catch((e) => console.error("[vip-notify]", e));
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
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["active", "delivered", "cancelled"]) }).parse(d))
  .handler(async ({ data }) => {
    const existing = await projectsRepo.getById(data.id);
    await projectsRepo.updateProject(data.id, { status: data.status });
    await invalidateProjectsAll();
    await invalidateQuotes(existing?.created_by);
    return { ok: true };
  });

export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const users = await listUsersWithRoles(500);
    return users.flatMap((u) => (u.roles.length ? u.roles : ["user"]).map((role) => ({ user_id: u.id, email: u.email, role, created_at: u.created_at })));
  });

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async (): Promise<{ id: string; name: string; label: string }[]> => {
    const { db, rowsToObjects } = await import("./db");
    const r = await db.execute(`SELECT id,name,label FROM roles ORDER BY name`);
    return rowsToObjects(r).map((x: any) => ({ id: String(x.id), name: String(x.name), label: String(x.label) }));
  });

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { email: string; password: string; role_id: string }) => z.object({ email: z.string().email().max(255), password: z.string().min(6).max(72), role_id: z.string().min(1).max(80) }).parse(d))
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
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) throw new Error("لا يمكنك حذف نفسك");
    await deleteUserRow(data.user_id);
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const roles = (await getRolesForUser(context.userId)) as ("admin" | "employee")[];
    return roles.sort((a, b) => (a === "admin" ? -1 : b === "admin" ? 1 : a.localeCompare(b)));
  });

export const getMyUserId = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => ({ userId: context.userId }));

export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => contactRepo.listContactMessages());

export const countContactMessages = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ since: z.string().nullable() }).parse(d))
  .handler(async ({ data }) => ({ count: await contactRepo.countContactMessagesSince(data.since) }));

export const adminDeleteContactMessage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => { await contactRepo.deleteContactMessage(data.id); return { ok: true }; });

export const adminSendCustomEmail = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ to: z.string().trim().email().max(255), subject: z.string().trim().min(1).max(300), message: z.string().trim().min(1).max(10000) }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
    const safe = data.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px;color:#1e293b">${data.subject.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2><p style="color:#1e293b;line-height:1.9">${safe}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="color:#94a3b8;font-size:12px">رسالة من فريق منصة العمران.</p></div></div>`;
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ from: "Alamran <send@ali-alhaddad.com>", to: [data.to], subject: data.subject, html }) });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
    return { ok: true };
  });

export const adminReplyContactMessage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; reply: string }) => z.object({ id: z.string().uuid(), reply: z.string().trim().min(1).max(5000) }).parse(d))
  .handler(async ({ data }) => {
    const msg = await contactRepo.getContactMessageById(data.id);
    if (!msg) throw new Error("الرسالة غير موجودة");
    if (!msg.email) throw new Error("لا يوجد بريد إلكتروني للرد عليه");
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
    const safeReply = data.reply.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px;color:#1e293b">رد من فريق منصة العمران</h2><p style="color:#475569">مرحباً ${msg.name || ""}،</p><p style="color:#1e293b;line-height:1.9">${safeReply}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/><p style="color:#94a3b8;font-size:12px">هذا رد على رسالتك في صفحة "تواصل بنا" بمنصة العمران.</p></div></div>`;
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ from: "Alamran <send@ali-alhaddad.com>", to: [msg.email], subject: "رد على رسالتك في منصة العمران", html }) });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
    await contactRepo.setContactReply(data.id, data.reply.trim());
    return { ok: true };
  });

const FIRST_ADMIN_EMAIL = "aliwadifaraj@gmail.com";
export const signupFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => z.object({ email: z.string().email().max(255), password: z.string().min(6).max(72) }).parse(d))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (email !== FIRST_ADMIN_EMAIL) throw new Error("التسجيل مسموح فقط للحساب المخصص");
    if (await findUserByEmail(email)) throw new Error("هذا البريد مسجل بالفعل");
    const id = await createUser(email, await hashPassword(data.password));
    await grantRole(id, "admin");
    return { ok: true };
  });

export const submitBidRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { project_id?: string; company_name: string; facility_location: string; email: string; file_name: string; file_base64: string; vip_token?: string | null; project_name?: string }) =>
    z.object({ project_id: z.string().uuid().optional().nullable(), company_name: z.string().trim().min(1).max(200), facility_location: z.string().trim().min(1).max(300), email: z.string().trim().email().max(255), file_name: z.string().trim().min(1).max(200), file_base64: z.string().min(8).max(15_000_000), vip_token: z.string().optional().nullable(), project_name: z.string().trim().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    const bytes = Buffer.from(data.file_base64, "base64");
    if (bytes.length === 0) throw new Error("الملف فارغ");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46 || bytes[4] !== 0x2d) throw new Error("الملف ليس PDF صالحاً");
    const isAddProject = data.vip_token === "add_project";
    let submitterType: "guest" | "user" = "guest";
    try { const { getSessionClaims } = await import("./auth.server"); const claims = await getSessionClaims(); if (claims) submitterType = "user"; } catch { }
    if (!isAddProject) {
      if (!data.project_id) throw new Error("معرف المشروع مطلوب");
      const proj = await projectsRepo.getById(data.project_id);
      if (!proj) throw new Error("المشروع غير موجود");
      if (!proj.offers_enabled) throw new Error("تقديم عروض الأسعار متوقف حالياً لهذا المشروع");
      const exclusive = await projectsRepo.getProjectExclusive(data.project_id);
      if (exclusive && Date.now() < new Date(exclusive.vip_end_at).getTime()) {
        if (!data.vip_token) throw new Error(`هذا المشروع حصري لـ VIP ${proj.location}`);
        const { validateVipToken, consumeVipToken } = await import("./vip-tokens.repo");
        const tokenResult = await validateVipToken(data.vip_token, data.project_id);
        if (!tokenResult.valid) throw new Error("رمز الحصرية غير صالح أو منتهي");
        await consumeVipToken(data.vip_token);
      }
    }
    if (await blockedRepo.isBlocked(data.company_name, data.email)) throw new Error(BLOCKED_MESSAGE);
    const safeName = data.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
    const projectIdForPath = data.project_id ?? "add-project";
    const path = `${projectIdForPath}/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
    const { uploadToR2 } = await import("./r2");
    await uploadToR2({ key: path, body: bytes, contentType: "application/pdf" });
    const staff = await (async () => {
      const { db, rowsToObjects } = await import("./db");
      const r = await db.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
      return rowsToObjects<{ user_id: string }>(r).map((x) => String(x.user_id));
    })();
    if (isAddProject) {
      await notificationsRepo.insertOfferNotificationMany(
        staff.map((uid) => ({
          user_id: uid,
          title: "طلب إضافة مشروع جديد",
          body: `${data.company_name} — ${data.facility_location}`,
          link: "/admin/requests",
          project_id: data.project_id ?? null,
          project_name: data.project_name || data.company_name,
          company_name: data.company_name,
          email: data.email,
          facility_location: data.facility_location,
          pdf_key: path,
          pdf_filename: data.file_name,
          source: "form",
          submitter_type: submitterType,
          offer_status: "pending",
        })),
      );
    } else {
      const proj = data.project_id ? await projectsRepo.getById(data.project_id) : null;
      await notificationsRepo.insertOfferNotificationMany(
        staff.map((uid) => ({
          user_id: uid,
          title: "عرض سعر جديد",
          body: `${data.company_name} — ${proj?.name ?? data.project_name ?? data.company_name}`,
          link: "/admin/requests",
          project_id: data.project_id!,
          project_name: proj?.name ?? data.project_name ?? data.company_name,
          company_name: data.company_name,
          email: data.email,
          pdf_key: path,
          pdf_filename: data.file_name,
          source: "form",
          submitter_type: submitterType,
          offer_status: "pending",
        })),
      );
    }
    return { ok: true };
  });

export const submitAddProjectBidRequest = createServerFn({ method: "POST" })
  .inputValidator((d: { company_name: string; facility_location: string; email: string; submitter_type: "client" | "visitor"; file_name: string; file_base64: string }) =>
    z.object({ company_name: z.string().trim().min(1).max(200), facility_location: z.string().trim().min(1).max(300), email: z.string().trim().email().max(255), submitter_type: z.enum(["client", "visitor"]), file_name: z.string().trim().min(1).max(200), file_base64: z.string().min(8).max(15_000_000) }).parse(d))
  .handler(async ({ data }) => {
    const bytes = Buffer.from(data.file_base64, "base64");
    if (bytes.length === 0) throw new Error("الملف فارغ");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46 || bytes[4] !== 0x2d) throw new Error("الملف ليس PDF صالحاً");
    if (await blockedRepo.isBlocked(data.company_name, data.email)) throw new Error(BLOCKED_MESSAGE);
    const safeName = data.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
    const path = `add-project/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
    const { uploadToR2 } = await import("./r2");
    await uploadToR2({ key: path, body: bytes, contentType: "application/pdf" });
    const staff = await (async () => {
      const { db, rowsToObjects } = await import("./db");
      const r = await db.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
      return rowsToObjects<{ user_id: string }>(r).map((x) => String(x.user_id));
    })();
    await notificationsRepo.insertOfferNotificationMany(
      staff.map((uid) => ({
        user_id: uid,
        title: "طلب إضافة مشروع جديد",
        body: `${data.company_name} — ${data.facility_location}`,
        link: "/admin/requests",
        project_name: data.company_name,
        company_name: data.company_name,
        email: data.email,
        facility_location: data.facility_location,
        pdf_key: path,
        pdf_filename: data.file_name,
        source: "form",
        submitter_type: data.submitter_type,
        offer_status: "pending",
      })),
    );
    return { ok: true };
  });

const imageItemSchema = z.object({ file_name: z.string().trim().min(1).max(200), file_base64: z.string().min(8).max(8_000_000), content_type: z.string().regex(/^image\/(png|jpe?g|webp|gif)$/) });

export const submitProjectSuggestion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ name: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(5000), location: z.string().trim().min(1).max(300), contact_phone: z.string().trim().min(4).max(40).regex(/^[0-9+\-\s()]+$/), images: z.array(imageItemSchema).max(8).default([]) }).parse(d))
  .handler(async ({ data }) => {
    if (await blockedRepo.isBlocked(data.name, null)) throw new Error(BLOCKED_MESSAGE);
    const uploadedPaths: string[] = [];
    for (const img of data.images) {
      const bytes = Buffer.from(img.file_base64, "base64");
      if (bytes.length === 0) continue;
      if (bytes.length > 5 * 1024 * 1024) throw new Error("حجم الصورة يجب أن يكون أقل من 5 ميغابايت");
      const safeName = img.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
      const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { uploadToR2 } = await import("./r2");
      await uploadToR2({ key: path, body: bytes, contentType: img.content_type });
      uploadedPaths.push(path);
    }
    await submissionsRepo.insertSubmission({ name: data.name, description: data.description, location: data.location, contact_phone: data.contact_phone, images: uploadedPaths });
    return { ok: true };
  });

export const adminListSubmissions = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = await submissionsRepo.listAllSubmissions();
    return Promise.all(rows.map(async (s) => ({ ...s, image_urls: await Promise.all((s.images ?? []).map(resolveStoragePath)) })));
  });

export const approveSubmission = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sub = await submissionsRepo.getSubmissionById(data.id);
    if (!sub) throw new Error("الطلب غير موجود");
    if (sub.status === "approved" && sub.approved_project_id) return { id: sub.approved_project_id };
    const images = sub.images ?? [];
    const cover = images[0] ?? "placeholder.jpg";
    const newId = await projectsRepo.insertProject({ name: sub.name, description: sub.description, location: sub.location, duration: "غير محدد", cover_image: cover, images, admin_approval: "approved" });
    const city = detectCity(sub.location);
    const hasVip = city ? (await listActiveByCity(city)).length > 0 : false;
    if (hasVip) {
      const now = new Date();
      const vipEndAt = new Date(now.getTime() + 6 * 3600_000);
      await projectsRepo.setProjectExclusive(newId, now.toISOString(), vipEndAt.toISOString());
    }
    notifyVipSubscribersOfNewProject({ id: newId, name: sub.name, description: sub.description, location: sub.location }).catch((e) => console.error("[vip-notify]", e));
    await submissionsRepo.markSubmissionApproved(data.id, newId);
    return { id: newId };
  });

export const deleteSubmission = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => { await submissionsRepo.deleteSubmission(data.id); return { ok: true }; });

export const submitProjectWithPaths = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ name: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(5000), location: z.string().trim().min(1).max(300), contact_phone: z.string().trim().min(4).max(40).regex(/^[0-9+\-\s()]+$/), image_paths: z.array(z.string().trim().min(1).max(500)).max(8).default([]) }).parse(d))
  .handler(async ({ data }) => {
    if (await blockedRepo.isBlocked(data.name, null)) throw new Error(BLOCKED_MESSAGE);
    const safePaths = data.image_paths.filter((p) => p.startsWith("submissions/"));
    await submissionsRepo.insertSubmission({ name: data.name, description: data.description, location: data.location, contact_phone: data.contact_phone, images: safePaths });
    return { ok: true };
  });

export const sendRequestMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ to: z.string().trim().email().max(255), message: z.string().trim().min(1).max(3000) }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
    const safe = data.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ from: "Alamran <noreply@ali-alhaddad.com>", to: [data.to], subject: "رسالة من فريق العمران", html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;line-height:1.9">${safe}</div>` }) });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
    return { ok: true };
  });

function assertStaffRoles(roles: string[]) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("Forbidden");
}

export const adminListProjectOfferToggles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertStaffRoles(context.roles);
    const rows = await projectsRepo.listAllProjects();
    return rows.map((p) => ({ id: p.id, name: p.name, offers_enabled: p.offers_enabled, bot_offers_enabled: p.bot_offers_enabled }));
  });

export const adminSetProjectBotOffersEnabled = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaffRoles(context.roles);
    await projectsRepo.setBotOffersEnabled(data.id, data.enabled);
    await invalidateProjectsAll();
    return { ok: true as const };
  });

export const adminSetAllProjectBotOffersEnabled = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaffRoles(context.roles);
    await projectsRepo.setAllBotOffersEnabled(data.enabled);
    await invalidateProjectsAll();
    return { ok: true as const };
  });

export const adminSetProjectOffersEnabled = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaffRoles(context.roles);
    await projectsRepo.setOffersEnabled(data.id, data.enabled);
    await invalidateProjectsAll();
    return { ok: true as const };
  });

export const adminSetAllProjectOffersEnabled = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaffRoles(context.roles);
    await projectsRepo.setAllOffersEnabled(data.enabled);
    await invalidateProjectsAll();
    return { ok: true as const };
  });

export const getExclusiveStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { projectId: string; vip_token?: string | null }) =>
    z.object({ projectId: z.string().min(1), vip_token: z.string().optional().nullable() }).parse(d))
  .handler(async ({ data }) => {
    const row = await projectsRepo.getProjectExclusive(data.projectId);
    if (!row) return { showForm: true as const, vipEndAt: null, vipStartAt: null };
    const now = Date.now();
    const endTime = new Date(row.vip_end_at).getTime();
    const showForm = now >= endTime;
    if (showForm) return { showForm, vipEndAt: row.vip_end_at, vipStartAt: row.vip_start_at };
    if (data.vip_token) {
      const { validateVipToken } = await import("./vip-tokens.repo");
      const result = await validateVipToken(data.vip_token, data.projectId);
      if (result.valid) return { showForm: true as const, vipEndAt: row.vip_end_at, vipStartAt: row.vip_start_at, vipBypass: true as const };
    }
    return { showForm: false as const, vipEndAt: row.vip_end_at, vipStartAt: row.vip_start_at };
  });

export const getExclusivityConfig = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d: { projectId: string }) => z.object({ projectId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const row = await projectsRepo.getProjectExclusive(data.projectId);
    if (!row) return null;
    return { vipStartAt: row.vip_start_at, vipEndAt: row.vip_end_at, durationHours: row.duration_hours };
  });

export const updateExclusivity = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { projectId: string; durationHours: number }) =>
    z.object({ projectId: z.string().uuid(), durationHours: z.number().int().min(0).max(720) }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.updateProjectExclusivity(data.projectId, data.durationHours);
    await invalidateProjectsAll();
    return { ok: true as const };
  });

export const searchProjectByName = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { q: string }) => z.object({ q: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const rows = await projectsRepo.searchByName(data.q);
    const results = await Promise.all(rows.map(async (p) => {
      const exclusive = await projectsRepo.getProjectExclusive(p.id).catch(() => null);
      const vipEndAt = exclusive?.vip_end_at ?? null;
      const remainingMs = vipEndAt ? new Date(vipEndAt).getTime() - Date.now() : 0;
      const remainingHours = remainingMs > 0 ? Math.ceil(remainingMs / 3600_000) : 0;
      const active = p.is_exclusive || (exclusive ? Date.now() < new Date(exclusive.vip_end_at).getTime() : false);
      return {
        id: p.id,
        name: p.name,
        location: p.location,
        exclusive_hours: p.exclusive_hours,
        is_exclusive: p.is_exclusive,
        exclusive_until: p.exclusive_until,
        has_exclusive: !!exclusive,
        vip_end_at: vipEndAt,
        remaining_hours: remainingHours,
        active,
      };
    }));
    return results;
  });

export const updateExclusivityHours = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { projectId: string; hours: number }) =>
    z.object({ projectId: z.string().uuid(), hours: z.number().int().min(1).max(720) }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.updateProject(data.projectId, { exclusive_hours: data.hours });
    await invalidateProjectsAll();
    return { ok: true as const };
  });

export const toggleExclusivityOn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { projectId: string; hours: number }) =>
    z.object({ projectId: z.string().uuid(), hours: z.number().int().min(1).max(720) }).parse(d))
  .handler(async ({ data }) => {
    const now = new Date();
    const endAt = new Date(now.getTime() + data.hours * 3600_000);
    await projectsRepo.setProjectExclusive(data.projectId, now.toISOString(), endAt.toISOString());
    await projectsRepo.updateProject(data.projectId, { is_exclusive: true, exclusive_until: endAt.toISOString(), exclusive_hours: data.hours });
    await invalidateProjectsAll();
    return { ok: true as const };
  });

export const toggleExclusivityOff = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { projectId: string }) => z.object({ projectId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.updateProject(data.projectId, { is_exclusive: false, exclusive_until: null });
    await invalidateProjectsAll();
    return { ok: true as const };
  });

// ---------- Client management (client portal profiles) ----------
import * as clientRepo from "./client.repo";

export const adminListClients = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const profiles = await clientRepo.listAllClientProfiles();
    const allRequests = await requestsRepo.listAllRequests();
    const allOffers = await notificationsRepo.listAllOfferNotifications();
    const allVip = await listVipSubscribers();

    return profiles.map((p) => {
      const reqs = allRequests.filter((r) => (r.email ?? "").toLowerCase() === p.email.toLowerCase());
      const offers = allOffers.filter((o) => (o.email ?? "").toLowerCase() === p.email.toLowerCase());
      const vip = allVip.filter((v) => (v.email ?? "").toLowerCase() === p.email.toLowerCase());
      const lastOfferAt = offers.length
        ? offers.map((o) => o.created_at).sort().reverse()[0]
        : null;
      const vipStatus = vip.length
        ? vip.find((v) => v.status === "active" || v.status === "approved")?.status ?? vip[0].status
        : null;
      return {
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        display_name: p.company_name || null,
        offers_count: offers.length,
        requests_count: reqs.length,
        vip_status: vipStatus,
        last_offer_at: lastOfferAt,
        push_enabled: p.push_enabled,
        push_token: p.push_token ?? null,
      };
    });
  });

export const adminGetClientDetail = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d: { email: string }) => z.object({ email: z.string().trim().email() }).parse(d))
  .handler(async ({ data }) => {
    const profile = await clientRepo.getClientProfileByEmail(data.email);
    const offers = await notificationsRepo.searchOfferNotificationsByEmail(data.email);
    const requests = await requestsRepo.searchRequestsByEmail(data.email);
    const vipSubs = (await listVipSubscribers()).filter(
      (v) => (v.email ?? "").toLowerCase() === data.email.toLowerCase(),
    );
    return {
      user_id: profile?.user_id ?? null,
      email: data.email,
      profile,
      offers: offers.map((o) => ({
        id: o.id,
        project_name: o.project_name ?? null,
        company_name: o.company_name ?? null,
        facility_location: o.facility_location ?? null,
        amount: (o as any).amount ?? null,
        duration: (o as any).duration ?? null,
        status: o.offer_status ?? "new",
        pdf_key: o.pdf_key ?? null,
        created_at: o.created_at,
      })),
      requests: requests.map((r) => ({
        id: r.id,
        company_name: r.company_name,
        facility_location: r.facility_location ?? null,
        status: r.status,
        project_type: r.project_type ?? null,
        note: r.note ?? null,
        created_at: r.created_at,
      })),
      vipSubs: vipSubs.map((v) => ({
        id: v.id,
        plan: v.plan,
        city: v.city,
        status: v.status,
        expires_at: v.expires_at,
        created_at: v.created_at,
      })),
    };
  });

export const adminToggleClientStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { email: string; status: string }) =>
    z.object({ email: z.string().trim().email(), status: z.enum(["active", "blocked"]) }).parse(d))
  .handler(async ({ data }) => {
    await clientRepo.updateClientStatusByEmail(data.email, data.status as "active" | "blocked");
    return { ok: true as const };
  });
