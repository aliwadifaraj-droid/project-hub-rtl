import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import * as projectsRepo from "./projects.repo";
import * as offersRepo from "./offers.repo";
import * as blockedRepo from "./blocked.repo";
import * as notificationsRepo from "./notifications.repo";
import * as vipTokensRepo from "./vip-tokens.repo";
import * as projectRequestsRepo from "./project-requests.repo";
import { getRolesForUser, findUserById } from "./users.repo";
import { resolveStoredFileUrl } from "./storage-url";
import { getSessionClaims } from "./auth.server";
import { cached, cacheKeys, TTL_PROJECTS, invalidateProjectsAll } from "./cache";
import { signGetUrl } from "./r2";
import { BLOCKED_MESSAGE } from "./blocked.functions";

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
