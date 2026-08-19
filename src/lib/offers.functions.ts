// Price-offer server functions (submitted by visitors from the support bot).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import * as offersRepo from "./offers.repo";
import * as notificationsRepo from "./notifications.repo";
import * as blockedRepo from "./blocked.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";
import { signGetUrl } from "./r2";

export const OFFER_SUCCESS_MESSAGE = "تم استلام عرضك بنجاح. سيتم اشعاركم بأي تحديث ✅";

const submitSchema = z.object({
  projectName: z.string().trim().min(2).max(200),
  companyName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  amount: z.string().trim().min(1).max(60),
  pdfKey: z.string().trim().min(1).max(500),
  pdfFilename: z.string().trim().min(1).max(200),
  visitorToken: z.string().uuid().optional().nullable(),
});

export const OFFER_DUPLICATE_MESSAGE = "لم نتمكن من معالجة طلبكم يرجى التواصل مع الدعم الفني";

export const submitOffer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const blocked = await blockedRepo.isBlocked(data.companyName, data.email);
    if (blocked) {
      return { ok: false as const, message: BLOCKED_MESSAGE };
    }
    const duplicate = await offersRepo.existsDuplicateOffer(data.projectName, data.email, data.companyName);
    if (duplicate) {
      return { ok: false as const, message: OFFER_DUPLICATE_MESSAGE };
    }
    const id = await offersRepo.insertOffer({
      project_id: null,
      project_name: data.projectName,
      company_name: data.companyName,
      email: data.email,
      amount: data.amount,
      duration: null,
      pdf_key: data.pdfKey,
      pdf_filename: data.pdfFilename,
      visitor_token: data.visitorToken ?? null,
    });


    try {
      const staff = await offersRepo.listAdminUserIds();
      if (staff.length) {
        await notificationsRepo.insertMany(
          staff.map((uid) => ({
            user_id: uid,
            title: "عرض سعر جديد",
            body: `${data.companyName} — ${data.projectName} — ${data.amount}`,
            link: "/admin/requests",
          })),
        );
      }
    } catch (e) {
      console.error("offer notification failed", e);
    }

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

// ---------- Add-project form: save to offers table only (no project_id, no project_name) ----------
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

    const duplicate = await offersRepo.existsDuplicateAddProjectOffer(data.email, data.company_name);
    if (duplicate) {
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

    const id = await offersRepo.insertOffer({
      project_id: null,
      project_name: null,
      company_name: data.company_name,
      email: data.email,
      amount: "",
      duration: null,
      facility_location: data.facility_location,
      pdf_key: path,
      pdf_filename: data.file_name,
      visitor_token: null,
      source: "add_project",
      submitter_type: submitterType,
    });

    try {
      const staff = await offersRepo.listAdminUserIds();
      if (staff.length) {
        await notificationsRepo.insertMany(
          staff.map((uid) => ({
            user_id: uid,
            title: "طلب إضافة مشروع جديد",
            body: `${data.company_name} — ${data.facility_location}`,
            link: "/admin/requests",
          })),
        );
      }
    } catch (e) {
      console.error("add-project offer notification failed", e);
    }

    return { ok: true as const, id, message: ADD_PROJECT_SUCCESS_MESSAGE };
  });

function assertStaff(roles: string[]) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("Forbidden");
}

export const adminListOffers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertStaff(context.roles);
    return offersRepo.listAllOffers();
  });

export const adminCountNewOffers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertStaff(context.roles);
    return { count: await offersRepo.countNewOffers() };
  });

export const adminUpdateOfferStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "reviewing", "accepted", "rejected"]) }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaff(context.roles);
    if (data.status === "accepted") {
      const offer = await offersRepo.getOfferById(data.id);
      if (!offer) return { ok: false as const, message: "العرض غير موجود" };
      const requests = await import("./project-requests.repo");
      const requestId = await requests.insertRequest({
        project_id: offer.project_id ?? null,
        company_name: offer.company_name,
        facility_location: offer.facility_location ?? offer.project_name ?? "",
        email: offer.email,
        pdf_url: offer.pdf_key ?? "",
        submitter_type: offer.submitter_type ?? "offer",
      });
      await requests.updateRequestStatus(requestId, "new");
      await offersRepo.deleteOffer(offer.id);
      return { ok: true as const, moved: true, requestId };
    }
    await offersRepo.updateOfferStatus(data.id, data.status);
    return { ok: true as const };
  });



export const adminDeleteOffer = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!context.roles.includes("admin")) throw new Error("Forbidden");
    await offersRepo.deleteOffer(data.id);
    return { ok: true };
  });

export const adminGetOfferPdfUrl = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ key: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaff(context.roles);
    return { url: await signGetUrl(data.key, 60 * 60) };
  });
