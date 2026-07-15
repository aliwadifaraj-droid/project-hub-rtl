import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import * as adsRepo from "./ads.repo";
import * as projectsRepo from "./projects.repo";
import { findUserById } from "./users.repo";
import { resolveStoredFileUrl } from "./storage-url";

function assertStaff(roles: string[]) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("غير مصرح");
}

async function resolveImage(path: string | null): Promise<string> {
  return resolveStoredFileUrl(path, 60 * 60 * 24 * 7).catch(() => "");
}

const adSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().default(""),
  image_url: z.string().trim().max(1000).optional().default(""),
});

export const createAd = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => adSchema.parse(d))
  .handler(async ({ data, context }) => {
    assertStaff(context.roles);
    const id = await adsRepo.insertAd({
      title: data.title,
      description: data.description || null,
      image_url: data.image_url || null,
      status: "pending",
      created_by: context.userId,
    });
    const link_url = `/ads/${id}`;
    await adsRepo.updateAd(id, { link_url });
    return { id, link_url };
  });

export const listPendingAds = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertStaff(context.roles);
    const ads = await adsRepo.listAdsByStatus("pending");
    const rows = await Promise.all(ads.map(async (a) => {
      let submitter_label = a.contact_email ?? "زائر";
      if (a.created_by) {
        const u = await findUserById(a.created_by).catch(() => null);
        submitter_label = u?.email ?? "موظف";
      }
      return { ...a, image_signed_url: await resolveImage(a.image_url), submitter_label };
    }));
    return { rows, isAdmin: context.roles.includes("admin") };
  });

export const countPendingAds = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertStaff(context.roles);
    return adsRepo.countAdsByStatus("pending");
  });

export const approveAd = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const ad = await adsRepo.getAdById(data.id);
    if (!ad) throw new Error("الإعلان غير موجود");
    await adsRepo.updateAd(data.id, { status: "approved", rejection_reason: null });
    const existing = await projectsRepo.findByAdId(ad.id);
    if (!existing) {
      await projectsRepo.insertProject({
        name: ad.title,
        description: ad.description ?? "",
        location: "",
        duration: "",
        cover_image: ad.image_url ?? "",
        images: [],
        created_by: ad.created_by,
        ad_id: ad.id,
        admin_approval: "approved",
      });
    }
    return { ok: true };
  });

export const rejectAd = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), reason: z.string().trim().min(1).max(500) }).parse(d))
  .handler(async ({ data }) => {
    await adsRepo.updateAd(data.id, { status: "rejected", rejection_reason: data.reason });
    return { ok: true };
  });

export const updateAd = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).optional().default(""),
      image_url: z.string().trim().max(1000).optional().default(""),
    }).parse(d))
  .handler(async ({ data }) => {
    await adsRepo.updateAd(data.id, {
      title: data.title,
      description: data.description || null,
      image_url: data.image_url || null,
    });
    return { ok: true };
  });

export const deleteAd = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await adsRepo.deleteAd(data.id);
    return { ok: true };
  });

export const deleteMyAd = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ad = await adsRepo.getAdById(data.id);
    if (!ad || ad.created_by !== context.userId) throw new Error("غير مصرح");
    await adsRepo.deleteAd(data.id);
    return { ok: true };
  });

export const listApprovedAds = createServerFn({ method: "GET" }).handler(async () => {
  const ads = await adsRepo.listAdsByStatus("approved");
  return Promise.all(ads.map(async (a) => ({ ...a, image_signed_url: await resolveImage(a.image_url) })));
});

export const getApprovedAd = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const ad = await adsRepo.getAdById(data.id);
    if (!ad || ad.status !== "approved") return null;
    return { ...ad, image_signed_url: await resolveImage(ad.image_url) };
  });

export const submitVisitorAd = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).optional().default(""),
      image_path: z.string().trim().max(500).optional().default(""),
      contact_email: z.string().trim().max(255).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "بريد إلكتروني غير صحيح").optional().default(""),
    }).parse(d))
  .handler(async ({ data }) => {
    const safePath = data.image_path && data.image_path.startsWith("submissions/") ? data.image_path : "";
    const id = await adsRepo.insertAd({
      title: data.title,
      description: data.description || null,
      image_url: safePath || null,
      contact_email: data.contact_email || null,
      status: "pending",
    });
    await adsRepo.updateAd(id, { link_url: `/ads/${id}` });
    return { id };
  });

// ---- Ad comments ----
export const listAdComments = createServerFn({ method: "GET" })
  .inputValidator((d: { adId: string }) => z.object({ adId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => adsRepo.listAdComments(data.adId));

export const submitAdComment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      adId: z.string().uuid(),
      author_name: z.string().trim().min(1).max(80),
      contact: z.string().trim().max(120).optional().default(""),
      body: z.string().trim().min(1).max(1000),
    }).parse(d))
  .handler(async ({ data }) => {
    const ad = await adsRepo.getAdById(data.adId);
    if (!ad || ad.status !== "approved") throw new Error("الإعلان غير متاح");
    await adsRepo.insertAdComment({
      ad_id: data.adId,
      author_name: data.author_name,
      contact: data.contact || null,
      body: data.body,
    });
    return { ok: true };
  });
