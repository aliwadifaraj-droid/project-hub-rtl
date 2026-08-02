import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import * as projectsRepo from "./projects.repo";
import { resolveStoredFileUrl } from "./storage-url";
import { cached, cacheKeys, TTL_PROJECTS, invalidateProjectsAll, invalidateQuotes } from "./cache";

async function resolveImage(path: string | null): Promise<string> {
  return resolveStoredFileUrl(path, 60 * 60 * 24 * 7).catch(() => "");
}

// cached: quotes_{clientId}, 5 min
export const listMyProjects = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) =>
    cached(cacheKeys.quotes(context.userId), TTL_PROJECTS, async () => {
      const rows = await projectsRepo.listByOwner(context.userId);
      return Promise.all(rows.map(async (p) => ({
        id: p.id, name: p.name, description: p.description, location: p.location,
        duration: p.duration, cover_image: p.cover_image, ad_id: p.ad_id,
        domain: p.domain, created_at: p.created_at,
        cover_url: await resolveImage(p.cover_image).catch(() => ""),
      })));
    }));

export const deleteMyProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const row = await projectsRepo.getById(data.id);
    if (!row || row.created_by !== context.userId) throw new Error("غير مصرح");
    await projectsRepo.deleteProject(data.id);
    await invalidateProjectsAll();
    await invalidateQuotes(context.userId);
    return { ok: true };
  });

