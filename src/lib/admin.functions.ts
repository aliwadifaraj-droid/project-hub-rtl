import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import * as projectsRepo from "./projects.repo";
import * as offersRepo from "./offers.repo";
import * as blockedRepo from "./blocked.repo";
import * as notificationsRepo from "./notifications.repo";
import * as vipTokensRepo from "./vip-tokens.repo";
import * as projectRequestsRepo from "./project-requests.repo";
import * as contactMessagesRepo from "./contact-messages.repo";
import { getRolesForUser, findUserById, createUser, deleteUser, listUsersWithRoles, grantRole, getRoleNameById } from "./users.repo";
import { hashPassword } from "./auth.server";
import { resolveStoredFileUrl } from "./storage-url";
import { getSessionClaims } from "./auth.server";
import { cached, cacheKeys, TTL_PROJECTS, invalidateProjectsAll } from "./cache";
import { signGetUrl } from "./r2";
import { BLOCKED_MESSAGE } from "./blocked.functions";
import { sendResendEmail } from "./resend-send.server";
import { insertEmailLog } from "./email.repo";
import { notifyVipSubscribersOfNewProject, detectCity } from "./vip-notify.server";
import { autoActivateByCity, listActiveByCity } from "./vip.repo";

async function resolveImage(path: string | null): Promise<string> {
  return resolveStoredFileUrl(path, 60 * 60 * 24 * 7).catch(() => "");
}

export const listProjects = createServerFn({ method: "GET" })
  .handler(async () =>
    cached(cacheKeys.projectsAll(), TTL_PROJECTS, async () => {
      const rows = await projectsRepo.listAllProjects();
      return Promise.all(rows.map(async (p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        location: p.location,
        duration: p.duration,
        cover_image: p.cover_image,
        images: p.images,
        pdf_file: p.pdf_file,
        created_by: p.created_by,
        status: p.status,
        admin_approval: p.admin_approval,
        ad_id: p.ad_id,
        domain: p.domain,
        created_at: p.created_at,
        cover_url: await resolveImage(p.cover_image),
      })));
    }));

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullish(),
  location: z.string().max(200).nullish(),
  duration: z.string().max(200).nullish(),
  cover_image: z.string().nullish(),
  images: z.array(z.string()).optional(),
  pdf_file: z.string().nullish(),
  status: z.string().max(50).optional(),
  admin_approval: z.string().max(50).optional(),
});

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles?.includes("admin") ?? false;
    if (data.id) {
      const existing = await projectsRepo.getById(data.id);
      if (!existing) throw new Error("المشروع غير موجود");
      const isOwner = existing.created_by === context.userId;
      if (!isAdmin && !isOwner) throw new Error("غير مصرح");
      await projectsRepo.updateProject(data.id, {
        name: data.name,
        description: data.description ?? null,
        location: data.location ?? null,
        duration: data.duration ?? null,
        cover_image: data.cover_image ?? null,
        images: data.images ?? [],
        pdf_file: data.pdf_file ?? null,
        status: isAdmin ? (data.status ?? existing.status) : existing.status,
        admin_approval: isAdmin ? (data.admin_approval ?? existing.admin_approval) : existing.admin_approval,
      });
      await invalidateProjectsAll();
      return { id: data.id, admin_approval: existing.admin_approval };
    }
    const approval = isAdmin ? "approved" : "pending";
    const id = await projectsRepo.insertProject({
      name: data.name,
      description: data.description ?? null,
      location: data.location ?? null,
      duration: data.duration ?? null,
      cover_image: data.cover_image ?? null,
      images: data.images ?? [],
      pdf_file: data.pdf_file ?? null,
      created_by: context.userId,
      status: data.status ?? "active",
      admin_approval: approval,
    });
    await invalidateProjectsAll();

    // When admin creates an approved project, auto-start VIP exclusivity + notify subscribers.
    if (isAdmin && approval === "approved" && data.location) {
      try {
        const city = detectCity(data.location);
        const hasVip = city ? (await listActiveByCity(city)).length > 0 : false;
        if (hasVip) {
          const now = new Date();
          const vipEndAt = new Date(now.getTime() + 6 * 3600_000);
          await projectsRepo.setProjectExclusive(id, now.toISOString(), vipEndAt.toISOString());
          await projectsRepo.updateProject(id, {
            is_exclusive: true,
            exclusive_until: vipEndAt.toISOString(),
            exclusive_hours: 6,
          });
        }
        await autoActivateByCity(data.location, 6);
      } catch (e) {
        console.error("auto vip activation error (upsert)", e);
      }

      notifyVipSubscribersOfNewProject({
        id,
        name: data.name,
        description: data.description ?? null,
        location: data.location ?? null,
        duration: data.duration ?? null,
      }).catch((e) => console.error("[vip-notify] upsert", e));
    }

    return { id, admin_approval: approval };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const row = await projectsRepo.getById(data.id);
    if (!row) throw new Error("المشروع غير موجود");
    const isAdmin = context.roles?.includes("admin") ?? false;
    if (!isAdmin && row.created_by !== context.userId) throw new Error("غير مصرح");
    await projectsRepo.deleteProject(data.id);
    await invalidateProjectsAll();
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
    const row = await projectsRepo.getById(data.id);
    if (!row) throw new Error("المشروع غير موجود");
    await projectsRepo.updateProject(data.id, { status: data.status });
    await invalidateProjectsAll();
    return { id: data.id, status: data.status };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    return context.roles ?? [];
  });

export const getMyUserId = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    return { userId: context.userId };
  });

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const p = await projectsRepo.getById(data.id);
    if (!p) return null;
    const [cover_url, pdf_url] = await Promise.all([
      resolveImage(p.cover_image),
      p.pdf_file ? signGetUrl(p.pdf_file, 60 * 60 * 24 * 7).catch(() => "") : Promise.resolve(""),
    ]);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      location: p.location,
      duration: p.duration,
      cover_image: p.cover_image,
      cover_url,
      images: p.images,
      pdf_file: p.pdf_file,
      pdf_url,
      created_by: p.created_by,
      status: p.status,
      admin_approval: p.admin_approval,
      ad_id: p.ad_id,
      domain: p.domain,
      created_at: p.created_at,
      offers_enabled: p.offers_enabled,
      is_exclusive: p.is_exclusive,
      exclusive_until: p.exclusive_until,
    };
  });

export const getExclusiveStatus = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({
      projectId: z.string().uuid(),
      vip_token: z.string().optional().nullable(),
    }).parse(d))
  .handler(async ({ data }) => {
    const project = await projectsRepo.getById(data.projectId);
    if (!project) return { showForm: true };
    if (!project.is_exclusive) return { showForm: true };
    if (project.exclusive_until && new Date(project.exclusive_until).getTime() <= Date.now()) {
      return { showForm: true };
    }
    if (data.vip_token) {
      const result = await vipTokensRepo.validateVipToken(data.vip_token, data.projectId);
      if (result.valid) return { showForm: true };
    }
    return { showForm: false };
  });

export const submitBidRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      project_id: z.string().uuid(),
      company_name: z.string().trim().min(1).max(200),
      facility_location: z.string().trim().min(1).max(300),
      email: z.string().trim().email().max(255),
      file_name: z.string().trim().min(1).max(200),
      file_base64: z.string().min(8).max(15_000_000),
      vip_token: z.string().optional().nullable(),
    }).parse(d))
  .handler(async ({ data }) => {
    const project = await projectsRepo.getById(data.project_id);
    if (!project) throw new Error("المشروع غير موجود");

    const blocked = await blockedRepo.isBlocked(data.company_name, data.email);
    if (blocked) {
      return { ok: false as const, message: BLOCKED_MESSAGE };
    }

    if (project.offers_enabled === false) {
      throw new Error("تقديم العروض متوقف لهذا المشروع حالياً");
    }

    if (
      project.is_exclusive &&
      project.exclusive_until &&
      new Date(project.exclusive_until).getTime() > Date.now()
    ) {
      if (!data.vip_token) throw new Error("هذا المشروع حصري لمشتركي VIP");
      const tokenResult = await vipTokensRepo.validateVipToken(data.vip_token, data.project_id);
      if (!tokenResult.valid) throw new Error("رمز VIP غير صالح أو منتهي");
    }

    const bytes = Buffer.from(data.file_base64, "base64");
    if (bytes.length === 0) throw new Error("الملف فارغ");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46 || bytes[4] !== 0x2d) {
      throw new Error("الملف ليس PDF صالحاً");
    }

    let submitterType: "guest" | "user" = "guest";
    try {
      const claims = await getSessionClaims();
      if (claims) submitterType = "user";
    } catch { /* ignore */ }

    const safeName = data.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
    const path = `offers/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
    const { uploadToR2 } = await import("./r2");
    await uploadToR2({ key: path, body: bytes, contentType: "application/pdf" });

    const id = await offersRepo.insertOffer({
      project_id: data.project_id,
      project_name: project.name,
      company_name: data.company_name,
      email: data.email,
      amount: "",
      duration: project.duration,
      facility_location: data.facility_location,
      pdf_key: path,
      pdf_filename: data.file_name,
      visitor_token: null,
      source: "platform",
      submitter_type: submitterType,
    });

    if (data.vip_token) {
      await vipTokensRepo.consumeVipToken(data.vip_token).catch(() => undefined);
    }

    try {
      const staff = await offersRepo.listAdminUserIds();
      if (staff.length) {
        await notificationsRepo.insertMany(
          staff.map((uid) => ({
            user_id: uid,
            title: "عرض سعر جديد",
            body: `${data.company_name} — ${project.name}`,
            link: "/admin/offers",
          })),
        );
      }
    } catch (e) {
      console.error("bid request notification failed", e);
    }

    return { ok: true as const, id };
  });

export const searchRequests = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ q: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const rows = await projectRequestsRepo.searchRequestsByCompany(data.q);
    const projectsById = new Map<string, { name: string }>();
    await Promise.all(
      rows
        .filter((r) => r.project_id && !projectsById.has(r.project_id))
        .map(async (r) => {
          if (!r.project_id) return;
          const p = await projectsRepo.getById(r.project_id);
          if (p) projectsById.set(r.project_id, { name: p.name });
        }),
    );
    return rows.map((r) => ({
      id: r.id,
      company_name: r.company_name ?? "",
      facility_location: r.facility_location ?? "",
      status: r.status,
      created_at: r.created_at,
      projects: r.project_id ? projectsById.get(r.project_id) ?? null : null,
    }));
  });

export const countContactMessages = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({ since: z.string().nullable().optional() }).parse(d))
  .handler(async ({ data }) => {
    const count = await contactMessagesRepo.countContactMessagesSince(data.since ?? null);
    return { count };
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ to: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const subject = "بريد تجريبي من المنصة";
    const html = "<p>هذا بريد تجريبي للتأكد من إعدادات الإرسال.</p>";
    let status = "sent";
    let error: string | null = null;
    try {
      await sendResendEmail({ to: data.to, subject, html });
    } catch (e: any) {
      status = "error";
      error = e?.message ?? String(e);
    }
    try {
      await insertEmailLog({ to_email: data.to, subject, template: "test", status, error });
    } catch { /* ignore */ }
    if (status === "error") throw new Error(error ?? "فشل الإرسال");
    return { to: data.to };
  });

export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const users = await listUsersWithRoles();
    return users.map((u) => ({
      user_id: u.id,
      email: u.email,
      role: u.roles[0] ?? "user",
      created_at: u.created_at,
    }));
  });

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const r = await import("./db").then(({ db, rowsToObjects }) =>
      db.execute("SELECT id, name, label FROM roles ORDER BY label ASC"),
    );
    return rowsToObjects<{ id: string; name: string; label: string }>(r).map((x) => ({
      id: String(x.id),
      name: String(x.name),
      label: String(x.label ?? x.name),
    }));
  });

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().trim().email().max(255),
      password: z.string().min(6).max(200),
      role_id: z.string().min(1),
    }).parse(d))
  .handler(async ({ data }) => {
    const roleName = await getRoleNameById(data.role_id);
    if (!roleName) throw new Error("الدور غير موجود");
    const existing = await import("./users.repo").then((m) => m.findUserByEmail(data.email));
    if (existing) throw new Error("البريد مستخدم بالفعل");
    const hash = await hashPassword(data.password);
    const userId = await createUser(data.email, hash);
    await grantRole(userId, roleName);
    return { user_id: userId };
  });

export const deleteEmployee = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await deleteUser(data.user_id);
    return { ok: true };
  });

/* ---------- exclusivity ---------- */

export const searchProjectByName = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ q: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const rows = await projectsRepo.searchByName(data.q);
    const results = await Promise.all(rows.map(async (p) => {
      let vipEnd: string | null = null;
      try {
        const excl = await projectsRepo.getProjectExclusive(p.id);
        vipEnd = excl?.vip_end_at ?? null;
      } catch { /* ignore */ }
      const endDate = vipEnd ? new Date(vipEnd) : null;
      const now = Date.now();
      const remainingMs = endDate ? endDate.getTime() - now : 0;
      const remainingHours = remainingMs > 0 ? Math.ceil(remainingMs / (1000 * 60 * 60)) : 0;
      const active = p.is_exclusive && endDate ? endDate.getTime() > now : false;
      return {
        id: p.id,
        name: p.name,
        location: p.location,
        exclusive_hours: p.exclusive_hours,
        is_exclusive: p.is_exclusive,
        exclusive_until: p.exclusive_until,
        has_exclusive: !!vipEnd,
        vip_end_at: vipEnd,
        remaining_hours: remainingHours,
        active,
      };
    }));
    return results;
  });

export const updateExclusivityHours = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      projectId: z.string().uuid(),
      hours: z.number().int().min(1).max(720),
    }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.updateProject(data.projectId, { exclusive_hours: data.hours });
    await invalidateProjectsAll();
    return { ok: true };
  });

export const toggleExclusivityOn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      projectId: z.string().uuid(),
      hours: z.number().int().min(1).max(720),
    }).parse(d))
  .handler(async ({ data }) => {
    const until = new Date(Date.now() + data.hours * 60 * 60 * 1000).toISOString();
    await projectsRepo.updateProject(data.projectId, {
      is_exclusive: true,
      exclusive_until: until,
      exclusive_hours: data.hours,
    });
    await invalidateProjectsAll();
    return { ok: true, exclusive_until: until };
  });

export const toggleExclusivityOff = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ projectId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.updateProject(data.projectId, {
      is_exclusive: false,
      exclusive_until: null,
    });
    await invalidateProjectsAll();
    return { ok: true };
  });

/* ---------- platform requests ---------- */

export const getPlatformRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const isAdmin = context.roles?.includes("admin") ?? false;
    const rows = isAdmin
      ? await projectRequestsRepo.listPlatformRequests()
      : await projectRequestsRepo.searchRequestsByEmail(context.userId ?? "");
    const projectsById = new Map<string, { name: string }>();
    await Promise.all(
      rows
        .filter((r) => r.project_id && !projectsById.has(r.project_id))
        .map(async (r) => {
          if (!r.project_id) return;
          const p = await projectsRepo.getById(r.project_id);
          if (p) projectsById.set(r.project_id, { name: p.name });
        }),
    );
    return rows.map((r) => ({
      id: r.id,
      company_name: r.company_name ?? "",
      email: r.email ?? "",
      facility_location: r.facility_location ?? "",
      pdf_url: r.pdf_url ?? "",
      status: r.status,
      submitter_type: r.submitter_type,
      project_type: r.project_type,
      note: r.note,
      created_at: r.created_at,
      project_id: r.project_id,
      projects: r.project_id ? { name: projectsById.get(r.project_id)?.name ?? "-" } : null,
      can_manage: isAdmin,
    }));
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "reviewing", "accepted", "rejected"]),
      note: z.string().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles?.includes("admin") ?? false;
    const req = await projectRequestsRepo.getRequestById(data.id);
    if (!req) throw new Error("الطلب غير موجود");
    if (!isAdmin) {
      const isOwner = req.email === context.userId;
      if (!isOwner) throw new Error("غير مصرح");
    }
    await projectRequestsRepo.updateRequestStatus(data.id, data.status, data.note);
    return { ok: true };
  });

export const getBidPdfUrl = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({ path: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles?.includes("admin") ?? false;
    if (!isAdmin) {
      const req = await projectRequestsRepo.getRequestByPdfPath(data.path);
      if (!req || req.email !== context.userId) throw new Error("غير مصرح");
    }
    const url = await signGetUrl(data.path, 60 * 60).catch(() => "");
    return url;
  });

export const sendRequestMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().email().max(255),
      company: z.string().max(200),
      message: z.string().min(1).max(2000),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles?.includes("admin") ?? false;
    if (!isAdmin) throw new Error("غير مصرح");
    try {
      await sendResendEmail({
        to: data.email,
        subject: `رسالة بخصوص طلب ${data.company}`,
        html: `<p>${data.message.replace(/</g, "&lt;")}</p>`,
      });
      await insertEmailLog({ to_email: data.email, subject: `رسالة بخصوص طلب ${data.company}`, template: "request-message", status: "sent" });
    } catch (e: any) {
      await insertEmailLog({ to_email: data.email, subject: `رسالة بخصوص طلب ${data.company}`, template: "request-message", status: "error", error: e?.message });
      throw new Error("تعذر إرسال الرسالة");
    }
    return { ok: true };
  });

/* ---------- offer toggles ---------- */

export const adminListProjectOfferToggles = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = await projectsRepo.listAllProjects();
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      offers_enabled: p.offers_enabled,
      bot_offers_enabled: p.bot_offers_enabled,
    }));
  });

export const adminSetProjectOffersEnabled = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      projectId: z.string().uuid(),
      enabled: z.boolean(),
    }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.setOffersEnabled(data.projectId, data.enabled);
    await invalidateProjectsAll();
    return { ok: true };
  });

export const adminSetAllProjectOffersEnabled = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.setAllOffersEnabled(data.enabled);
    await invalidateProjectsAll();
    return { ok: true };
  });

export const adminSetProjectBotOffersEnabled = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      projectId: z.string().uuid(),
      enabled: z.boolean(),
    }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.setBotOffersEnabled(data.projectId, data.enabled);
    await invalidateProjectsAll();
    return { ok: true };
  });

export const adminSetAllProjectBotOffersEnabled = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.setAllBotOffersEnabled(data.enabled);
    await invalidateProjectsAll();
    return { ok: true };
  });

/* ---------- contact messages ---------- */

export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return contactMessagesRepo.listContactMessages();
  });

export const adminDeleteContactMessage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await contactMessagesRepo.deleteContactMessage(data.id);
    return { ok: true };
  });

export const adminReplyContactMessage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().min(1),
      reply: z.string().min(1).max(5000),
    }).parse(d))
  .handler(async ({ data }) => {
    const msg = await contactMessagesRepo.getContactMessageById(data.id);
    if (!msg) throw new Error("الرسالة غير موجودة");
    await contactMessagesRepo.setContactReply(data.id, data.reply);
    try {
      await sendResendEmail({
        to: msg.email ?? "",
        subject: "رد على رسالتك",
        html: `<p>${data.reply.replace(/</g, "&lt;")}</p>`,
      });
      await insertEmailLog({ to_email: msg.email, subject: "رد على رسالة", template: "contact-reply", status: "sent" });
    } catch (e: any) {
      await insertEmailLog({ to_email: msg.email, subject: "رد على رسالة", template: "contact-reply", status: "error", error: e?.message });
    }
    return { ok: true };
  });

export const adminSendCustomEmail = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      to: z.string().email().max(255),
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(10000),
    }).parse(d))
  .handler(async ({ data }) => {
    try {
      await sendResendEmail({
        to: data.to,
        subject: data.subject,
        html: `<p>${data.message.replace(/</g, "&lt;")}</p>`,
      });
      await insertEmailLog({ to_email: data.to, subject: data.subject, template: "custom", status: "sent" });
    } catch (e: any) {
      await insertEmailLog({ to_email: data.to, subject: data.subject, template: "custom", status: "error", error: e?.message });
      throw new Error("تعذر إرسال الإيميل");
    }
    return { ok: true };
  });
