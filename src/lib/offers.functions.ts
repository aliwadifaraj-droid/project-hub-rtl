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
    const blocked = await blockedRepo.isBlocked(data.companyName, data.email);
    if (blocked) {
      return { ok: false as const, message: BLOCKED_MESSAGE };
    }
    const project = await projectsRepo.getByNameExact(data.projectName).catch(() => null);
    if (!project) {
      return { ok: false as const, message: OFFER_PROJECT_NOT_FOUND_MESSAGE };
    }

    const duplicate = await notificationsRepo.existsDuplicateOfferNotification(data.projectName, data.email, data.companyName);
    if (duplicate) {
      return { ok: false as const, message: OFFER_DUPLICATE_MESSAGE };
    }

    const requests = await import("./project-requests.repo");
    const dupRequest = await requests.existsDuplicateRequestForProject(project.id, data.email, data.companyName).catch(() => false);
    if (dupRequest) {
      return { ok: false as const, message: OFFER_DUPLICATE_MESSAGE };
    }

    const exclusive = await projectsRepo.getProjectExclusive(project.id).catch(() => null);
    if (exclusive && Date.now() < new Date(exclusive.vip_end_at).getTime()) {
      let hasVipAccess = false;
      if (data.vipToken) {
        const { validateVipToken, consumeVipToken } = await import("./vip-tokens.repo");
        const tokenResult = await validateVipToken(data.vipToken, project.id);
        if (tokenResult.valid) {
          hasVipAccess = true;
          await consumeVipToken(data.vipToken);
        }
      }
      if (!hasVipAccess) {
        let email: string | null = null;
        try {
          const { getSessionClaims } = await import("./auth.server");
          const claims = await getSessionClaims();
          email = claims?.email ?? null;
        } catch { /* not logged in */ }
        if (email) {
          const vip = await (await import("./vip.repo")).getActiveVipByEmail(email);
          const projectCity = detectCity(project.location ?? "");
          const vipCity = vip?.city?.trim().toLowerCase();
          hasVipAccess = !!vip
            && (!vip.expires_at || new Date(vip.expires_at).getTime() >= Date.now())
            && !!projectCity && !!vipCity
            && projectCity.trim().toLowerCase() === vipCity;
        }
      }
      if (!hasVipAccess) {
        const city = detectCity(project.location ?? "");
        return { ok: false as const, message: exclusiveMessage(city) };
      }
    }

    const staff = await listAdminUserIds();
    const title = "عرض سعر جديد";
    const body = `${data.companyName} — ${data.projectName} — ${data.amount}`;
    const ids = await notificationsRepo.insertOfferNotificationMany(
      staff.map((uid) => ({
        user_id: uid,
        title,
        body,
        link: "/admin/offers",
        project_name: data.projectName,
        company_name: data.companyName,
        email: data.email,
        amount: data.amount,
        pdf_key: data.pdfKey,
        pdf_filename: data.pdfFilename,
        source: "platform",
        offer_status: "new",
      })),
    );
    const id = ids[0] ?? "";

    if (data.visitorToken) {
      try {
        const support = await import("./support.repo");
        const chat = await support.getChatByVisitorToken(data.visitorToken);
        if (chat) await support.addSupportMessage(chat.id, "bot", OFFER_SUCCESS_MESSAGE);
      } catch (e) {
        console.error("offer chat message failed", e);
      }
    }

    return { ok: true as const, id, message: OFFER_SUCCESS_MESSAGE };
  });

// ---------- Add-project form: save to notifications table only ----------
const addProjectSchema = z.object({
  company_name: z.string().trim().min(1).max(200),
  facility_location: z.string().trim().min(1).max(300),
  email: z.string().trim().email().max(255),
  file_name: z.string().trim().min(1).max(200),
  file_base64: z.string().min(8).max(15_000_000),
});

export const ADD_PROJECT_SUCCESS_MESSAGE = "تم استلام طلبكم بنجاح. سيتم التواصل معكم لاحقاً ✅";

export const submitAddProjectOffer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => addProjectSchema.parse(d))
  .handler(async ({ data }) => {
    const blocked = await blockedRepo.isBlocked(data.company_name, data.email);
    if (blocked) {
      return { ok: false as const, message: BLOCKED_MESSAGE };
    }

    const duplicate = await notificationsRepo.existsDuplicateAddProjectNotification(data.email, data.company_name);
    if (duplicate) {
      return { ok: false as const, message: OFFER_DUPLICATE_MESSAGE };
    }

    const requestsRepo = await import("./project-requests.repo");
    const dupRequest = await requestsRepo.existsDuplicateRequestByCompanyOrEmail(data.email, data.company_name).catch(() => false);
    if (dupRequest) {
      return { ok: false as const, message: OFFER_DUPLICATE_MESSAGE };
    }

    const bytes = Buffer.from(data.file_base64, "base64");
    if (bytes.length === 0) throw new Error("الملف فارغ");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46 || bytes[4] !== 0x2d) {
      throw new Error("الملف ليس PDF صالحاً");
    }

    let submitterType: "guest" | "user" = "guest";
    try {
      const { getSessionClaims } = await import("./auth.server");
      const claims = await getSessionClaims();
      if (claims) submitterType = "user";
    } catch { /* ignore */ }

    const safeName = data.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
    const path = `add-project/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
    const { uploadToR2 } = await import("./r2");
    await uploadToR2({ key: path, body: bytes, contentType: "application/pdf" });

    const staff = await listAdminUserIds();
    const title = "طلب إضافة مشروع جديد";
    const body = `${data.company_name} — ${data.facility_location}`;
    const ids = await notificationsRepo.insertOfferNotificationMany(
      staff.map((uid) => ({
        user_id: uid,
        title,
        body,
        link: "/admin/offers",
        company_name: data.company_name,
        email: data.email,
        facility_location: data.facility_location,
        pdf_key: path,
        pdf_filename: data.file_name,
        source: "add_project",
        submitter_type: submitterType,
        offer_status: "new",
      })),
    );

    return { ok: true as const, id: ids[0] ?? "", message: ADD_PROJECT_SUCCESS_MESSAGE };
  });

function assertStaff(roles: string[]) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("Forbidden");
}

export const adminListOffers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertStaff(context.roles);
    const rows = await notificationsRepo.listAllOfferNotifications();
    return rows.map((r) => ({
      id: r.id,
      project_id: r.project_id,
      project_name: r.project_name,
      company_name: r.company_name ?? "",
      email: r.email ?? "",
      amount: r.amount ?? "",
      duration: null,
      facility_location: r.facility_location,
      pdf_key: r.pdf_key,
      pdf_filename: r.pdf_filename,
      status: r.offer_status ?? "new",
      visitor_token: null,
      source: r.source ?? "platform",
      submitter_type: r.submitter_type,
      created_at: r.created_at,
    }));
  });

export const adminCountNewOffers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertStaff(context.roles);
    return { count: await notificationsRepo.countNewOfferNotifications() };
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
      const requestId = await requests.insertRequest({
        project_id: offer.project_id ?? null,
        company_name: offer.company_name ?? "",
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
    return { ok: true };
  });

export const adminGetOfferPdfUrl = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ key: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaff(context.roles);
    return { url: await signGetUrl(data.key, 60 * 60) };
  });
