// Server functions for teachers marketplace (حراج المعلمين).
// Auth + subscription management via Turso.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionClaims,
} from "./auth.server";
import {
  findTeacherByEmail,
  findTeacherById,
  createTeacher,
  updateTeacherSubscription,
  listAllTeachers,
  listTeacherNotifications,
  countUnreadTeacherNotifications,
  markAllTeacherNotificationsRead,
  listTeacherOffers,
  createTeacherOffer,
} from "./teachers.repo";

export const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الظهران", "الأحساء", "الطائف", "بريدة", "تبوك", "أبها",
  "خميس مشيط", "حائل", "نجران", "جازان", "ينبع", "الجبيل",
  "القصيم", "عرعر", "سكاكا", "الباحة", "الرس", "المجمعة",
  "رابغ", "بيشة", "تثليث", "الدوادمي", "حفر الباطن", "الليث",
] as const;

export const TEACHER_PROFESSIONS = [
  "نجار", "حداد", "بناء", "مليس", "دهان",
  "كهربائي", "سباك", "مهندس معماري", "مهندس مدني", "مهندس مساح",
] as const;

export const SUBSCRIPTION_PLANS = [
  { id: "month", label: "شهر", price: 30, days: 30 },
  { id: "two_months", label: "شهرين", price: 50, days: 60 },
] as const;

const signUpSchema = z.object({
  full_name: z.string().min(3, "الاسم الرباعي مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "كلمة السر يجب أن تكون 6 أحرف على الأقل"),
  city: z.string().min(1, "المدينة مطلوبة"),
  profession: z.string().min(1, "المهنة مطلوبة"),
});

export const teacherSignUp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signUpSchema.parse(d))
  .handler(async ({ data }) => {
    const existing = await findTeacherByEmail(data.email);
    if (existing) throw new Error("هذا البريد مسجل بالفعل");
    const hash = await hashPassword(data.password);
    const teacherId = await createTeacher({
      full_name: data.full_name,
      email: data.email,
      password_hash: hash,
      city: data.city,
      profession: data.profession,
    });
    const token = await signSessionToken({
      sub: teacherId,
      email: data.email,
      roles: ["teacher"],
    });
    setSessionCookie(token);
    return { id: teacherId, email: data.email };
  });

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const teacherSignIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signInSchema.parse(d))
  .handler(async ({ data }) => {
    const teacher = await findTeacherByEmail(data.email);
    if (!teacher) throw new Error("البريد أو كلمة السر غير صحيحة");
    const ok = await verifyPassword(data.password, teacher.password_hash);
    if (!ok) throw new Error("البريد أو كلمة السر غير صحيحة");
    const token = await signSessionToken({
      sub: teacher.id,
      email: teacher.email,
      roles: ["teacher"],
    });
    setSessionCookie(token);
    return { id: teacher.id, email: teacher.email, full_name: teacher.full_name };
  });

export const teacherSignOut = createServerFn({ method: "POST" }).handler(async () => {
  clearSessionCookie();
  return { ok: true };
});

export const getTeacherMe = createServerFn({ method: "GET" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims || !claims.roles?.includes("teacher")) return null;
  const teacher = await findTeacherById(claims.sub);
  if (!teacher) return null;
  return {
    id: teacher.id,
    full_name: teacher.full_name,
    email: teacher.email,
    city: teacher.city,
    profession: teacher.profession,
    subscription_plan: teacher.subscription_plan,
    subscription_status: teacher.subscription_status,
    subscription_starts_at: teacher.subscription_starts_at,
    subscription_expires_at: teacher.subscription_expires_at,
    created_at: teacher.created_at,
  };
});

const subscribeSchema = z.object({
  plan_id: z.enum(["month", "two_months"]),
});

export const teacherSubscribe = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => subscribeSchema.parse(d))
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    if (!claims || !claims.roles?.includes("teacher")) throw new Error("Unauthorized");
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === data.plan_id);
    if (!plan) throw new Error("خطة غير صالحة");
    const now = new Date();
    const expires = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);
    await updateTeacherSubscription(
      claims.sub,
      plan.id,
      now.toISOString(),
      expires.toISOString(),
    );
    return {
      plan: plan.id,
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };
  });

export const getTeacherNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims || !claims.roles?.includes("teacher")) return [];
  return listTeacherNotifications(claims.sub);
});

export const getUnreadTeacherNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims || !claims.roles?.includes("teacher")) return 0;
  return countUnreadTeacherNotifications(claims.sub);
});

export const markTeacherNotificationsRead = createServerFn({ method: "POST" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims || !claims.roles?.includes("teacher")) return;
  await markAllTeacherNotificationsRead(claims.sub);
  return { ok: true };
});

export const getTeacherOffers = createServerFn({ method: "GET" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims || !claims.roles?.includes("teacher")) return [];
  return listTeacherOffers(claims.sub);
});

const createOfferSchema = z.object({
  project_title: z.string().min(1),
  amount: z.string().min(1),
  description: z.string().min(1),
});

export const submitTeacherOffer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createOfferSchema.parse(d))
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    if (!claims || !claims.roles?.includes("teacher")) throw new Error("Unauthorized");
    const id = await createTeacherOffer({
      teacher_id: claims.sub,
      project_title: data.project_title,
      amount: data.amount,
      description: data.description,
    });
    return { id };
  });

export const adminListTeachers = createServerFn({ method: "GET" }).handler(async () => {
  return listAllTeachers();
});
