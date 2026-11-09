import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "./auth-middleware.server";
import * as harajRepo from "./haraj.repo";
import * as harajOfferReadsRepo from "./haraj-offer-reads.repo";

async function requireTeacher(email: string) {
  const teacher = await harajRepo.findTeacherByEmail(email);
  if (!teacher) throw new Error("لم يتم العثور على بيانات التسجيل");
  return teacher;
}

export const getMyHarajUnreadOfferCount = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const teacher = await requireTeacher(context.email);
    const offers = await harajRepo.listActiveHarajOffers();
    const readIds = await harajOfferReadsRepo.listReadOfferIds(teacher.id);
    return { unread: offers.filter((o) => !readIds.has(o.id)).length };
  });

export const markMyHarajOffersRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const teacher = await requireTeacher(context.email);
    const offers = await harajRepo.listActiveHarajOffers();
    await harajOfferReadsRepo.markOffersRead(teacher.id, offers.map((o) => o.id));
    return { ok: true };
  });
