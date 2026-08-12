import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import { hashPassword } from "./auth.server";
import { getRolesForUser, findUserById, findUserByEmail, createUser, grantRole, listUsersWithRoles, getRoleNameById, deleteUser as deleteUserRow } from "./users.repo";
import * as projectsRepo from "./projects.repo";
import * as requestsRepo from "./project-requests.repo";
import * as submissionsRepo from "./project-submissions.repo";
import * as contactRepo from "./contact-messages.repo";
import * as blockedRepo from "./blocked.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";
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
        pdf_url: p.pdf_file ? await resolveStoragePath(p.pdf_file).catch(() => "" : "",
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
        is_exclusive: p.is_exclusive,
        exclusive_until: p.exclusive_until,
        cover_url, image_urls, pdf_url,
      };
    } catch (e) {
      console.error("[getProject] unexpected error:", e);
      return null;
    }
  });
