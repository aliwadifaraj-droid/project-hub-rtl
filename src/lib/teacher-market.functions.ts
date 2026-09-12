import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import {
  listTeachersMarket,
  insertTeacherMarket,
  updateTeacherMarketStatus,
  findTeacherMarketByEmail,
  getTeacherMarketById,
  insertTeacherNotification,
  listTeacherNotifications,
  markTeacherNotificationRead,
  markAllTeacherNotificationsRead,
} from "./teacher-market.repo";

const registerSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(200),
  city: z.string().min(1).max(100),
  phone: z.string().min(5).max(30),
  profession: z.string().min(1).max(100),
  cv: z.string().max(500).optional().nullable(),
  password: z.string().min(1).max(200),
});

export const registerTeacher = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registerSchema.parse(d))
  .handler(async ({ data }) => {
    const id = await insertTeacherMarket({
      name: data.name,
      email: data.email,
      city: data.city,
      phone: data.phone,
      profession: data.profession,
      cv: data.cv ?? null,
      password: data.password,
    });
    return { id };
  });

export const checkTeacherByEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email() }).parse(d),
  )
  .handler(async ({ data }) => {
    const row = await findTeacherMarketByEmail(data.email);
    return row;
  });

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const loginTeacher = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => loginSchema.parse(d))
  .handler(async ({ data }) => {
    const row = await findTeacherMarketByEmail(data.email);
    if (!row) {
      return { ok: false as const, error: "البريد الإلكتروني غير مسجل" };
    }
    if (row.password !== data.password) {
      return { ok: false as const, error: "كلمة السر غير صحيحة" };
    }
    return { ok: true as const, email: row.email };
  });

export const listTeachers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return await listTeachersMarket();
  });

const updateSchema = z.object({
  id: z.number().int(),
  status: z.string().min(1),
  exit_date: z.string().nullable(),
});

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  suspended: "موقوف",
};

export const updateTeacherStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data }) => {
    const teacher = await getTeacherMarketById(data.id);
    await updateTeacherMarketStatus(data.id, data.status, data.exit_date);
    if (teacher) {
      const body =
        `تم تحديث حالتك إلى: ${statusLabels[data.status] ?? data.status}` +
        (data.exit_date ? `\nتاريخ الخروج: ${data.exit_date}` : "");
      await insertTeacherNotification({
        teacher_email: teacher.email,
        title: "تحديث حالة المعلم",
        body,
      });
    }
    return { ok: true };
  });

const sendNotifSchema = z.object({
  id: z.number().int(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
});

export const sendTeacherNotification = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => sendNotifSchema.parse(d))
  .handler(async ({ data }) => {
    const teacher = await getTeacherMarketById(data.id);
    if (!teacher) {
      return { ok: false as const, error: "المعلم غير موجود" };
    }
    await insertTeacherNotification({
      teacher_email: teacher.email,
      title: data.title,
      body: data.body,
    });
    return { ok: true as const };
  });

// --- Teacher dashboard functions (public, no admin auth) ---

const emailSchema = z.object({
  email: z.string().email().max(200),
});

export const getTeacherData = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data }) => {
    const row = await findTeacherMarketByEmail(data.email);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      city: row.city,
      phone: row.phone,
      profession: row.profession,
      cv: row.cv,
      entry_date: row.entry_date,
      exit_date: row.exit_date,
      status: row.status,
    };
  });

export const getTeacherNotifications = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data }) => {
    return await listTeacherNotifications(data.email, 50);
  });

const markReadSchema = z.object({
  email: z.string().email().max(200),
  id: z.number().int(),
});

export const markTeacherNotifRead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => markReadSchema.parse(d))
  .handler(async ({ data }) => {
    await markTeacherNotificationRead(data.email, data.id);
    return { ok: true };
  });

export const markAllTeacherNotifsRead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data }) => {
    await markAllTeacherNotificationsRead(data.email);
    return { ok: true };
  });
