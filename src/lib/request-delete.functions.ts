import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import * as requestsRepo from "./project-requests.repo";
import * as notificationsRepo from "./notifications.repo";
import { deleteFromR2 } from "./r2";

export const deleteRequest = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const req = await requestsRepo.getRequestById(data.id);
    const notif = req ? null : await notificationsRepo.getOfferNotificationById(data.id);
    if (!req && !notif) throw new Error("الطلب غير موجود");

    const pdfKey = req ? req.pdf_url : (notif?.pdf_key ?? null);
    if (pdfKey) {
      await requestsRepo.deleteRequestsByPdfPath(pdfKey);
      await notificationsRepo.deleteAllOfferNotificationsByPdfKey(pdfKey);
    } else if (req) {
      await requestsRepo.deleteRequestById(req.id);
    } else if (notif) {
      await notificationsRepo.deleteOfferNotification(notif.id);
    }

    let storageDeleted = true;
    if (pdfKey) {
      try {
        await deleteFromR2(pdfKey);
      } catch (e) {
        console.error("[deleteRequest] R2 delete failed", e);
        storageDeleted = false;
      }
    }
    return { ok: true, storageDeleted };
  });
