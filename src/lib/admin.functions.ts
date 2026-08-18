import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import * as projectsRepo from "./projects.repo";
import { getRolesForUser, findUserById } from "./users.repo";
import { resolveStoredFileUrl } from "./storage-url";
import { getSessionClaims } from "./auth.server";
import { cached, cacheKeys, TTL_PROJECTS, invalidateProjectsAll } from "./cache";

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
