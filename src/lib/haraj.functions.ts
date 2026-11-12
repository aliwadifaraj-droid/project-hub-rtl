import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import * as harajRepo from "./haraj.repo";
import { hashPassword, verifyPassword, setSessionCookie, signSessionToken } from "./auth.server";
import { SAUDI_CITIES } from "./saudi-cities";
import { insertOne as insertNotification } from "./notifications.repo";
import { resolveStoredFileUrl } from "./storage-url";
import { deleteFromR2 } from "./r2";
import { assertEmailAvailable } from "./email-dedup";

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم مطلوب").max(100),
  phone: z.string().trim().regex(/^05\d{8}$/, "يجب أن يبدأ الرقم بـ 05 ويتكون من 10 أرقام"),
  city: z.string().trim().min(1, "المدينة مطلوبة"),
  profession: z.string().trim().min(1, "المهنة مطلوبة"),
  profession_other: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة السر يجب أن تكون 6 أحرف على الأقل"),
});

export const registerTeacher = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registerSchema.parse(d))
  .handler(async ({ data }) => {
    const profession = data.profession === "أخرى" ? data.profession_other || "أخرى" : data.profession;
    await assertEmailAvailable(data.email, "حراج المعلمين");
    const passwordHash = await hashPassword(data.password);
    const id = await harajRepo.insertTeacher({ ...data, profession });
    await harajRepo.insertLogin(data.email, passwordHash);
    return { id, ok: true };
  });

export const signInTeacher = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email(), password: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const teacher = await harajRepo.findLoginByEmail(data.email);
    if (!teacher || !(await verifyPassword(data.password, teacher.password_hash))) {
      throw new Error("بيانات الدخول غير صحيحة");
    }
    const token = await signSessionToken({ sub: teacher.id, email: teacher.email, roles: ["teacher"] });
    setSessionCookie(token);
    const market = await harajRepo.findTeacherByEmail(data.email);
    return { ok: true, name: market?.full_name ?? "" };
  });

async function withRegistrationDate<T extends { email: string; created_at: string }>(teacher: T): Promise<T> {
  if (teacher.created_at) return teacher;
  const login = await harajRepo.findLoginByEmail(teacher.email);
  return { ...teacher, created_at: login?.created_at ?? "" };
}

export const getMyTeacherProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const teacher = await harajRepo.findTeacherByEmail(context.email);
    if (!teacher) throw new Error("لم يتم العثور على بيانات التسجيل");
    return withRegistrationDate(teacher);
  });

export const listTeachers = createServerFn({ method: "GET" }).handler(async () => []);

export const adminListTeachers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    if (!context.roles?.includes("admin") && !context.roles?.includes("employee")) throw new Error("غير مصرح");
    const rows = await Promise.all((await harajRepo.listAllTeachers()).map(withRegistrationDate));
    return { rows, isAdmin: context.roles?.includes("admin") ?? false };
  });

export const deleteTeacher = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const teacher = await harajRepo.getTeacherById(data.id);
    if (!teacher) throw new Error("المعلم غير موجود");
    await harajRepo.deleteTeacher(data.id);
    await harajRepo.deleteLoginByEmail(teacher.email);
    return { ok: true };
  });

export const toggleBanTeacher = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const teacher = await harajRepo.getTeacherById(data.id);
    if (!teacher) throw new Error("المعلم غير موجود");
    const status = teacher.status === "banned" ? "active" : "banned";
    await harajRepo.updateTeacherStatus(data.id, status);
    return { ok: true, status };
  });

// ─── Haraj Offers (إدارة) ──────────────────────────────────────────

const createOfferSchema = z.object({
  work_name: z.string().trim().min(2, "اسم العمل مطلوب").max(200),
  description: z.string().trim().min(1, "النص مطلوب").max(5000),
  city: z.string().trim().min(1, "المدينة مطلوبة"),
  owner_phone: z.string().trim().regex(/^05\d{8}$/, "يجب أن يبدأ الرقم بـ 05 ويتكون من 10 أرقام"),
  image_keys: z.string().max(5000).optional().default(""),
});

export const createHarajOffer = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => createOfferSchema.parse(d))
  .handler(async ({ data }) => {
    if (!SAUDI_CITIES.includes(data.city as never)) {
      throw new Error("المدينة غير صحيحة");
    }
    const id = await harajRepo.insertHarajOffer({
      work_name: data.work_name,
      description: data.description,
      city: data.city,
      owner_phone: data.owner_phone,
      image_keys: data.image_keys ?? "",
    });

    const teachers = await harajRepo.listAllTeachers();
    const cityTeachers = teachers.filter((t) => t.city === data.city && t.status === "active");
    for (const t of cityTeachers) {
      await insertNotification({
        user_id: t.id,
        title: "عرض جديد من الإدارة",
        body: data.work_name,
        link: "/haraj/dashboard",
      });
    }

    return { id, ok: true };
  });

export const listActiveHarajOffers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    if (!context.roles?.includes("admin") && !context.roles?.includes("employee")) throw new Error("غير مصرح");
    const offers = await harajRepo.listActiveHarajOffers();
    const result = await Promise.all(
      offers.map(async (o) => {
        const interests = await harajRepo.listInterestsForOffer(o.id);
        const images: string[] = o.image_keys
          ? await Promise.all(
              o.image_keys.split(",").filter(Boolean).map((k) => resolveStoredFileUrl(k)),
            )
          : [];
        return { ...o, images, interests_count: interests.length, interests };
      }),
    );
    return { rows: result };
  });

export const deleteHarajOffer = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const offer = await harajRepo.getHarajOfferById(data.id);
    if (!offer) throw new Error("العرض غير موجود");

    const imageKeys = offer.image_keys.split(",").map((key) => key.trim()).filter(Boolean);
    await Promise.all(imageKeys.map((key) => deleteFromR2(key)));
    await harajRepo.deleteHarajOffer(data.id);
    return { ok: true };
  });

async function getTeacherSubscriptionCity(email: string): Promise<string | null> {
  const subscription = await harajRepo.getActiveTeacherSubscriptionByEmail(email);
  if (!subscription?.city) return null;
  if (subscription.expires_at && new Date(subscription.expires_at).getTime() < Date.now()) return null;
  return subscription.city;
}

function getInterestBlockReason(offerCity: string, subscriptionCity: string | null): string | null {
  if (!subscriptionCity) {
    return "لا يوجد لديك اشتراك فعّال. اشترك من زر اشتراكي حتى تتمكن من إبداء الاهتمام بالعروض";
  }
  if (subscriptionCity !== offerCity) {
    return `هذا العرض في مدينة ${offerCity}، واشتراكك الفعّال في مدينة ${subscriptionCity}`;
  }
  return null;
}

export const getMyHarajOffers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const teacher = await harajRepo.findTeacherByEmail(context.email);
    if (!teacher) throw new Error("لم يتم العثور على بيانات التسجيل");
    const subscriptionCity = await getTeacherSubscriptionCity(context.email);
    const offers = await harajRepo.listActiveHarajOffers();
    const result = await Promise.all(
      offers.map(async (o) => {
        const interested = await harajRepo.hasTeacherExpressedInterest(o.id, teacher.id);
        const images: string[] = o.image_keys
          ? await Promise.all(
              o.image_keys.split(",").filter(Boolean).map((k) => resolveStoredFileUrl(k)),
            )
          : [];
        return {
          ...o,
          images,
          has_interest: interested,
          owner_phone: "",
          interest_block_reason: getInterestBlockReason(o.city, subscriptionCity),
        };
      }),
    );
    return {
      rows: result,
      unread: result.filter((o) => !o.has_interest).length,
      subscription_city: subscriptionCity,
    };
  });

export const getMyHarajTasks = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const teacher = await harajRepo.findTeacherByEmail(context.email);
    if (!teacher) throw new Error("لم يتم العثور على بيانات التسجيل");
    const offers = await harajRepo.listAssignedOffersForTeacher(teacher.id);
    const result = await Promise.all(
      offers.map(async (o) => {
        const images: string[] = o.image_keys
          ? await Promise.all(
              o.image_keys.split(",").filter(Boolean).map((k) => resolveStoredFileUrl(k)),
            )
          : [];
        return { ...o, images };
      }),
    );
    return { rows: result };
  });

const interestSchema = z.object({ offer_id: z.string().min(1) });

export const expressHarajInterest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => interestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const teacher = await harajRepo.findTeacherByEmail(context.email);
    if (!teacher) throw new Error("لم يتم العثور على بيانات التسجيل");
    const offer = await harajRepo.getHarajOfferById(data.offer_id);
    if (!offer) throw new Error("العرض غير موجود");
    if (offer.status !== "active") throw new Error("هذا العرض لم يعد متاحاً");
    const subscriptionCity = await getTeacherSubscriptionCity(context.email);
    const blockReason = getInterestBlockReason(offer.city, subscriptionCity);
    if (blockReason) throw new Error(blockReason);
    await harajRepo.insertInterest({
      offer_id: data.offer_id,
      teacher_id: teacher.id,
      teacher_name: teacher.full_name,
      teacher_phone: teacher.phone,
      teacher_city: teacher.city,
      teacher_profession: teacher.profession,
    });
    return { ok: true };
  });

const assignSchema = z.object({ offer_id: z.string().min(1), teacher_id: z.string().min(1) });

export const assignHarajTeacher = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => assignSchema.parse(d))
  .handler(async ({ data }) => {
    const offer = await harajRepo.getHarajOfferById(data.offer_id);
    if (!offer) throw new Error("العرض غير موجود");
    if (offer.status !== "active") throw new Error("تم تثبيت معلم على هذا العرض مسبقاً");
    const interests = await harajRepo.listInterestsForOffer(data.offer_id);
    if (!interests.some((i) => i.teacher_id === data.teacher_id)) {
      throw new Error("لا يمكن تثبيت معلم لم يبد اهتمامه");
    }
    await harajRepo.assignTeacherToOffer(data.offer_id, data.teacher_id);
    await harajRepo.removeInterestsForOffer(data.offer_id);
    await insertNotification({
      user_id: data.teacher_id,
      title: "تم تثبيتك على مشروع",
      body: offer.work_name,
      link: "/haraj/dashboard",
    });
    return { ok: true };
  });

// ─── Teacher Subscriptions (اشتراك المعلمين — مستقل عن اشتراك العملاء) ───

const subscribeSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب"),
  email: z.string().trim().email("بريد إلكتروني غير صحيح"),
  plan: z.string().trim().min(1, "اختر الباقة"),
  city: z.string().trim().min(1, "اختر المدينة"),
  receipt_path: z.string().trim().min(1, "إيصال التحويل مطلوب"),
});

export const submitTeacherSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => subscribeSchema.parse(d))
  .handler(async ({ data }) => {
    const id = await harajRepo.insertTeacherSubscription({
      teacher_email: data.email,
      name: data.name,
      plan: data.plan,
      city: data.city,
      receipt_path: data.receipt_path,
    });
    const admins = (await (await import("./users.repo")).listUsersWithRoles(500)).filter((u) => u.roles.includes("admin"));
    if (admins.length > 0) {
      const { insertMany } = await import("./notifications.repo");
      await insertMany(
        admins.map((a) => ({
          user_id: a.id,
          title: "طلب اشتراك معلم جديد",
          body: "تم رفع إيصال اشتراك معلم بانتظار الموافقة",
          link: "/admin/haraj",
        })),
      );
    }
    return { id };
  });

export const getMyTeacherSubscription = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const sub = await harajRepo.getActiveTeacherSubscriptionByEmail(context.email);
    if (!sub) return { status: null as string | null, city: null as string | null, expires_at: null as string | null };
    const expired = sub.expires_at ? new Date(sub.expires_at).getTime() < Date.now() : false;
    return {
      status: expired ? "expired" : sub.status,
      city: sub.city || null,
      expires_at: sub.expires_at || null,
    };
  });

export const adminListTeacherSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = await harajRepo.listAllTeacherSubscriptions();
    return Promise.all(
      rows.map(async (r) => ({
        ...r,
        receipt_url: r.receipt_path ? await resolveStoredFileUrl(r.receipt_path).catch(() => null) : null,
      })),
    );
  });

export const approveTeacherSubscription = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const row = await harajRepo.updateTeacherSubscriptionStatus(data.id, "active");
    if (!row) throw new Error("الاشتراك غير موجود");
    if (row.teacher_email) {
      try {
        const { sendResendEmail } = await import("./resend-send.server");
        await sendResendEmail({
          to: row.teacher_email,
          subject: "تم تفعيل اشتراك المعلم ✅",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name},</h2><p>تم <strong>تفعيل</strong> اشتراكك في حراج المعلمين بنجاح.</p><p>يمكنك الآن إبداء الاهتمام بالعروض في مدينة ${row.city}.</p></div>`,
        });
      } catch (e) {
        console.error("teacher subscription approval email error", e);
      }
    }
    return { ok: true };
  });

export const rejectTeacherSubscription = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await harajRepo.updateTeacherSubscriptionStatus(data.id, "rejected");
    return { ok: true };
  });
