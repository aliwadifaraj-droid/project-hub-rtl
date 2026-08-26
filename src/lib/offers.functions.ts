// Price-offer server functions (submitted by visitors from the support bot).
// Offers are saved into the `notifications` table (as offer-notifications) and
// moved to `project_requests` when an admin accepts them.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import * as notificationsRepo from "./notifications.repo";
import * as blockedRepo from "./blocked.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";
import { signGetUrl } from "./r2";
import * as projectsRepo from "./projects.repo";
import { detectCity } from "./vip-notify.server";

export const OFFER_SUCCESS_MESSAGE = "تم استلام عرضك بنجاح. سيتم اشعاركم بأي تحديث ✅";
export function exclusiveMessage(city: string | null): string {
  return city
    ? `هذا المشروع حصري لمشتركي VIP في مدينة ${city}`
    : "هذا المشروع حصري لمشتركي VIP";
}
export const OFFER_PROJECT_NOT_FOUND_MESSAGE = "المشروع غير موجود";

const submitSchema = z.object({
  projectName: z.string().trim().min(2).max(200),
  companyName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  amount: z.string().trim().min(1).max(60),
  pdfKey: z.string().trim().min(1).max(500),
  pdfFilename: z.string().trim().min(1).max(200),
  visitorToken: z.string().uuid().optional().nullable(),
  vipToken: z.string().optional().nullable(),
});

export const OFFER_DUPLICATE_MESSAGE = "لم نتمكن من معالجة طلبكم يرجى التواصل مع الدعم الفني";

async function listAdminUserIds(): Promise<string[]> {
  const { db, rowsToObjects } = await import("./db");
  const r = await db.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
  return rowsToObjects<{ user_id: string }>(r).map((x) => String(x.user_id));
}

export const submitOffer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const project = await projectsRepo.getByNameExact(data.projectName);
    if (!project) return { ok: false as const, message: OFFER_PROJECT_NOT_FOUND_MESSAGE };

    if (await blockedRepo.isBlocked(data.companyName, data.email)) throw new Error(BLOCKED_MESSAGE);

    const exclusive = await projectsRepo.getProjectExclusive(project.id);
    if (exclusive && Date.now() < new Date(exclusive.vip_end_at).getTime()) {
      if (!data.vipToken) return { ok: false as const, message: exclusiveMessage(detectCity(project.location)) };
      const { validateVipToken, consumeVipToken } = await import("./vip-tokens.repo");
      const tokenResult = await validateVipToken(data.vipToken, project.id);
      if (!tokenResult.valid) return { ok: false as const, message: exclusiveMessage(detectCity(project.location)) };
      await consumeVipToken(data.vipToken);
    }

    const { uploadToR2 } = await import("./r2");
    const safeName = data.pdfFilename.replace(/[^\w.\-]/g, "_").slice(-100);
    const path = `${project.id}/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
    await uploadToR2({ key: path, body: Buffer.from(data.pdfKey, "base64"), contentType: "application/pdf" });

    const adminIds = await listAdminUserIds();
    await notificationsRepo.insertOfferNotificationMany(
      adminIds.map((uid) => ({
        user_id: uid,
        title: "عرض سعر جديد",
        body: `${data.companyName} — ${project.name}`,
        link: "/admin/requests",
        project_id: project.id,
        project_name: project.name,
        company_name: data.companyName,
        email: data.email,
        pdf_key: path,
        pdf_filename: data.pdfFilename,
        source: project.is_customer_request ? "add_project" : "platform",
        offer_status: "new",
      })),
    );
    return { ok: true as const, message: OFFER_SUCCESS_MESSAGE };
  });

export const adminUpdateOfferStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "new", "reviewing", "accepted", "rejected"]) }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaff(context.roles);
    if (data.status === "accepted") {
      const offer = await notificationsRepo.getOfferNotificationById(data.id);
      if (!offer) return { ok: false as const, message: "العرض غير موجود" };
      const requests = await import("./project-requests.repo");
      const project = offer.project_id ? await projectsRepo.getById(offer.project_id).catch(() => null) : null;
      const project_name = project?.name ?? offer.project_name ?? "";
      const requestId = await requests.insertRequest({
        project_id: offer.project_id ?? null,
        company_name: offer.company_name ?? "",
        project_name,
        facility_location: offer.facility_location ?? offer.project_name ?? "",
        email: offer.email ?? "",
        pdf_url: offer.pdf_key ?? "",
        submitter_type: offer.submitter_type ?? "offer",
      });
      await requests.updateRequestStatus(requestId, "new");
      await notificationsRepo.deleteOfferNotification(offer.id);
      return { ok: true as const, moved: true, requestId };
    }
    await notificationsRepo.updateOfferNotificationStatus(data.id, data.status);
    return { ok: true as const };
  });

export const adminDeleteOffer = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!context.roles.includes("admin")) throw new Error("Forbidden");
    await notificationsRepo.deleteOfferNotification(data.id);
    return { ok: true as const };
  });

export const adminListOffers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertStaff(context.roles);
    const offers = await notificationsRepo.listOfferNotifications();
    return Promise.all(
      offers.map(async (o) => ({
        id: o.id,
        project_id: o.project_id,
        project_name: o.project_name ?? "",
        company_name: o.company_name ?? "",
        email: o.email ?? "",
        pdf_key: o.pdf_key ?? "",
        pdf_filename: o.pdf_filename ?? "",
        status: o.offer_status ?? "new",
        source: o.source ?? "platform",
        submitter_type: o.submitter_type ?? "offer",
        created_at: o.created_at,
      })),
    );
  });

function assertStaff(roles: string[]) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("Forbidden");
}
