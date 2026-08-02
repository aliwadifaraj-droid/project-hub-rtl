// Price-offer server functions (submitted by visitors from the support bot).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import * as offersRepo from "./offers.repo";
import * as notificationsRepo from "./notifications.repo";
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

export const OFFER_PROJECT_NOT_FOUND = "المشروع غير موجود";

export const submitOffer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const project = await offersRepo.findProjectForOffer(data.projectName);
    if (!project) {
      return { ok: false as const, message: OFFER_PROJECT_NOT_FOUND };
    }
    const id = await offersRepo.insertOffer({
      project_id: project.id,
      project_name: project.name,
      company_name: data.companyName,
      email: data.email,
      amount: data.amount,
      duration: project.duration ?? null,
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
            body: `${data.companyName} — ${project.name} — ${data.amount}`,
            link: "/admin/offers",
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

    return { ok: true, id, message: OFFER_SUCCESS_MESSAGE };
  });

function assertStaff(roles: string[]) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("Forbidden");
}

export const adminListOffers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    assertStaff(context.roles);
    return offersRepo.listOffers();
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
    await offersRepo.updateOfferStatus(data.id, data.status);
    return { ok: true };
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
