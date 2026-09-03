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
import * as clientRepo from "./client.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";
import { resolveStoredFileUrl } from "./storage-url";
import { cached, cacheKeys, TTL_PROJECTS, invalidateProjectsAll, invalidateQuotes } from "./cache";
import { notifyVipSubscribersOfNewProject, detectCity } from "./vip-notify.server";
import { listActiveByCity } from "./vip.repo";
import { sendPushToAllClients } from "./push-send.server";
import { validateVipToken, consumeVipToken } from "./vip-tokens.repo";

async function resolveStoragePath(path: string | null): Promise<string> {
  return resolveStoredFileUrl(path, 60 * 60 * 24 * 7).catch(() => "");
}

async function listAdminStaffIds(): Promise<string[]> {
  const { db, rowsToObjects } = await import("./db");
  const r = await db.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
  return rowsToObjects<{ user_id: string }>(r).map((x) => String(x.user_id));
}

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const rows = await cached(cacheKeys.projectsAll(), TTL_PROJECTS, async () => {
      return projectsRepo.listAllProjects();
    });
    return Promise.all(rows.map(async (p) => ({
      id: p.id, name: p.name, description: p.description, location: p.location,
      duration: p.duration, cover_image: p.cover_image, images: p.images,
      pdf_file: p.pdf_file, status: p.status,
      offers_enabled: p.offers_enabled,
      is_exclusive: hasActiveExclusiveWindow,
      exclusive_until: hasActiveExclusiveWindow ? exclusive.vip_end_at : null,
      vip_end_at: hasActiveExclusiveWindow ? exclusive.vip_end_at : null,
      cover_url, image_urls, pdf_url,
    }));
  } catch (e) {
    console.error("[listProjects] unexpected error:", e);
    return [];
  }
});

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => context.roles);

export const getMyUserId = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => ({ userId: context.userId }));

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { sendEmail } = await import("./email.server");
    await sendEmail({
      to: "test@example.com",
      subject: "Test from admin",
      html: "<p>This is a test email</p>",
    });
    return { ok: true };
  });

export const countContactMessages = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => ({ count: await contactRepo.countUnread() }));

export const listContactMessages = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => contactRepo.listAll());

export const markContactMessageRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await contactRepo.markRead(data.id);
    return { ok: true };
  });

export const deleteContactMessage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await contactRepo.deleteMessage(data.id);
    return { ok: true };
  });

const projectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  duration: z.string().trim().max(200).optional().nullable(),
  cover_image: z.string().trim().max(500).optional().nullable(),
  images: z.array(z.string()).default([]),
  pdf_file: z.string().trim().max(500).optional().nullable(),
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
    sendPushToAllClients({ title: "مشروع جديد", body: data.name, url: `/project/${id}` }).catch((e) => console.error("[push-notify]", e));
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
    return users.filter((u) => u.roles.includes("employee"));
  });

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(6).max(72),
    }).parse(d))
  .handler(async ({ data }) => {
    const existing = await findUserByEmail(data.email);
    if (existing) throw new Error("هذا البريد مسجل بالفعل");
    const hash = await hashPassword(data.password);
    const userId = await createUser(data.email, hash);
    await grantRole(userId, "employee");
    return { id: userId, email: data.email };
  });

export const deleteEmployee = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await deleteUserRow(data.id);
    return { ok: true };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => listUsersWithRoles(500));

export const createUserByAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(6).max(72),
      role: z.enum(["admin", "employee"]),
    }).parse(d))
  .handler(async ({ data }) => {
    const existing = await findUserByEmail(data.email);
    if (existing) throw new Error("هذا البريد مسجل بالفعل");
    const hash = await hashPassword(data.password);
    const userId = await createUser(data.email, hash);
    await grantRole(userId, data.role);
    return { id: userId, email: data.email };
  });

export const deleteUserByAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await deleteUserRow(data.id);
    return { ok: true };
  });

export const adminListClients = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const profiles = await clientRepo.listAllClientProfiles();
    const { db, rowsToObjects } = await import("./db");

    const offerR = await db.execute(
      `SELECT LOWER(TRIM(email)) AS email, COUNT(DISTINCT id) AS offers_count, MAX(created_at) AS last_offer_at
       FROM notifications
       WHERE email IS NOT NULL AND TRIM(email) <> '' AND offer_status IS NOT NULL
       GROUP BY LOWER(TRIM(email))`,
    );
    const offerMap = new Map<string, any>();
    for (const row of rowsToObjects<any>(offerR)) {
      if (row.email) offerMap.set(String(row.email).trim().toLowerCase(), row);
    }

    const reqR = await db.execute(
      `SELECT LOWER(TRIM(email)) AS email, COUNT(*) AS requests_count, MAX(created_at) AS last_request_at
       FROM project_requests
       WHERE email IS NOT NULL AND TRIM(email) <> ''
       GROUP BY LOWER(TRIM(email))`,
    );
    const reqMap = new Map<string, any>();
    for (const row of rowsToObjects<any>(reqR)) {
      if (row.email) reqMap.set(String(row.email).trim().toLowerCase(), row);
    }

    const vipR = await db.execute(
      `SELECT email, MAX(created_at) AS vip_created_at, MAX(expires_at) AS vip_expires_at, MAX(status) AS vip_status, MAX(city) AS vip_city, MAX(plan) AS vip_plan
       FROM vip_subscribers
       WHERE email IS NOT NULL AND TRIM(email) <> ''
       GROUP BY LOWER(TRIM(email))`,
    );
    const vipMap = new Map<string, any>();
    for (const row of rowsToObjects<any>(vipR)) {
      if (row.email) vipMap.set(String(row.email).trim().toLowerCase(), row);
    }

    return profiles.map((p) => {
      const key = p.email.trim().toLowerCase();
      const offer = offerMap.get(key);
      const req = reqMap.get(key);
      const vip = vipMap.get(key);
      return {
        user_id: p.user_id,
        email: p.email,
        display_name: p.company_name || p.email,
        company_name: p.company_name,
        phone: p.phone,
        city: p.city,
        cr_number: p.cr_number,
        bio: p.bio,
        created_at: p.created_at,
        offers_count: Number(offer?.offers_count ?? 0),
        last_offer_at: offer?.last_offer_at ?? null,
        requests_count: Number(req?.requests_count ?? 0),
        last_request_at: req?.last_request_at ?? null,
        vip_status: vip?.vip_status ?? null,
        vip_city: vip?.vip_city ?? null,
        vip_plan: vip?.vip_plan ?? null,
        vip_expires_at: vip?.vip_expires_at ?? null,
        vip_created_at: vip?.vip_created_at ?? null,
      };
    });
  });

export const adminToggleClientStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { email: string; status: string }) =>
    z.object({ email: z.string().trim().email(), status: z.enum(["active", "blocked"]) }).parse(d))
  .handler(async ({ data }) => {
    await clientRepo.updateClientStatusByEmail(data.email, data.status);
    return { ok: true as const, status: data.status };
  });

export const adminGetClientDetail = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .inputValidator((d: { email: string }) => z.object({ email: z.string().trim().email() }).parse(d))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const { db, rowsToObjects } = await import("./db");

    const profile = await clientRepo.getClientProfileByEmail(email);

    const offersR = await db.execute(
      `SELECT id, project_id, project_name, company_name, amount, facility_location,
              pdf_key, pdf_filename, offer_status, source, submitter_type, created_at
       FROM notifications
       WHERE LOWER(TRIM(email)) = ? AND offer_status IS NOT NULL
       ORDER BY created_at DESC`,
      [email],
    );
    const offers = rowsToObjects<any>(offersR).map((row: any) => ({
      id: String(row.id),
      project_id: row.project_id ?? null,
      project_name: row.project_name ?? null,
      company_name: row.company_name ?? "",
      amount: row.amount ?? "",
      facility_location: row.facility_location ?? null,
      pdf_key: row.pdf_key ?? null,
      pdf_filename: row.pdf_filename ?? null,
      status: String(row.offer_status ?? "new"),
      source: String(row.source ?? "platform"),
      submitter_type: row.submitter_type ?? null,
      created_at: String(row.created_at ?? ""),
    }));

    const requestsR = await db.execute(
      `SELECT id, project_id, company_name, facility_location, email, pdf_url, status, submitter_type, project_type, note, created_at
       FROM project_requests
       WHERE LOWER(TRIM(email)) = ?
       ORDER BY created_at DESC`,
      [email],
    );
    const requests = rowsToObjects<any>(requestsR).map((row: any) => ({
      id: String(row.id),
      project_id: row.project_id ?? null,
      company_name: row.company_name ?? "",
      facility_location: row.facility_location ?? "",
      pdf_url: row.pdf_url ?? "",
      status: String(row.status ?? "new"),
      submitter_type: row.submitter_type ?? null,
      project_type: row.project_type ?? "platform",
      note: row.note ?? null,
      created_at: String(row.created_at ?? ""),
    }));

    const vipR = await db.execute(
      `SELECT id, name, email, plan, city, status, project_id, expires_at, created_at
       FROM vip_subscribers
       WHERE LOWER(TRIM(email)) = ?
       ORDER BY created_at DESC`,
      [email],
    );
    const vipSubs = rowsToObjects<any>(vipR).map((row: any) => ({
      id: String(row.id),
      name: row.name ?? null,
      plan: row.plan ?? null,
      city: row.city ?? null,
      status: String(row.status ?? "pending"),
      project_id: row.project_id ?? null,
      expires_at: row.expires_at ?? null,
      created_at: String(row.created_at ?? ""),
    }));

    return {
      user_id: profile?.user_id ?? null,
      email: data.email.trim(),
      profile: profile ? {
        company_name: profile.company_name,
        phone: profile.phone,
        city: profile.city,
        cr_number: profile.cr_number,
        bio: profile.bio,
        status: profile.status,
        created_at: profile.created_at,
      } : null,
      offers,
      requests,
      vipSubs,
    };
  });
