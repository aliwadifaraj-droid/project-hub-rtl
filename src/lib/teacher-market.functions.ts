import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import {
  listTeachersMarket,
  insertTeacherMarket,
  updateTeacherMarketStatus,
  findTeacherMarketByEmail,
  findTeacherMarketByPhone,
  findTeacherMarketByName,
  getTeacherMarketById,
  insertTeacherNotification,
  listTeacherNotifications,
  markTeacherNotificationRead,
  markAllTeacherNotificationsRead,
  insertTeacherChatMessage,
  listTeacherChatMessages,
  markTeacherChatMessagesRead,
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
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();
    const name = data.name.trim();
    if (await findTeacherMarketByEmail(email)) {
      throw new Error("هذا البريد الإلكتروني مسجل بالفعل، يرجى استخدام بريد آخر أو تسجيل الدخول");
    }
    if (await findTeacherMarketByPhone(phone)) {
      throw new Error("رقم الهاتف مسجل بالفعل، يرجى استخدام رقم آخر أو تسجيل الدخول");
    }
    if (await findTeacherMarketByName(name)) {
      throw new Error("الاسم مسجل بالفعل، يرجى استخدام اسم آخر أو تسجيل الدخول");
    }
    const id = await insertTeacherMarket({
      name,
      email,
      city: data.city,
      phone,
      profession: data.profession,
      cv: data.cv ?? null,
      password: data.password,
    });
    return { id };
  });

export const checkTeacherByEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => findTeacherMarketByEmail(data.email));

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const loginTeacher = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => loginSchema.parse(d))
  .handler(async ({ data }) => {
    const row = await findTeacherMarketByEmail(data.email);
    if (!row) return { ok: false as const, error: "البريد الإلكتروني غير مسجل" };
    if (row.password !== data.password) return { ok: false as const, error: "كلمة السر غير صحيحة" };
    return { ok: true as const, email: row.email };
  });

export const listTeachers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => listTeachersMarket());

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
      await insertTeacherNotification({
        teacher_email: teacher.email,
        title: "تحديث حالة المعلم",
        body:
          `تم تحديث حالتك إلى: ${statusLabels[data.status] ?? data.status}` +
          (data.exit_date ? `\nتاريخ الخروج: ${data.exit_date}` : ""),
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
    if (!teacher) return { ok: false as const, error: "المعلم غير موجود" };
    await insertTeacherNotification({
      teacher_email: teacher.email,
      title: data.title,
      body: data.body,
    });
    return { ok: true as const };
  });

const chatMessageSchema = z.object({
  email: z.string().email().max(200),
  body: z.string().trim().min(1).max(2000),
});

const chatEmailSchema = z.object({
  email: z.string().email().max(200),
});

export const getTeacherChatMessages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => chatEmailSchema.parse(d))
  .handler(async ({ data }) => listTeacherChatMessages(data.email));

export const getTeacherChatUnreadCount = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => chatEmailSchema.parse(d))
  .handler(async ({ data }) => {
    const messages = await listTeacherChatMessages(data.email);
    return messages.filter((message) => message.sender === "admin" && !message.read).length;
  });

export const markTeacherChatRead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => chatEmailSchema.parse(d))
  .handler(async ({ data }) => {
    await markTeacherChatMessagesRead(data.email, "admin");
    return { ok: true };
  });

export const sendTeacherChatMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => chatMessageSchema.parse(d))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const teacher = await findTeacherMarketByEmail(email);
    if (!teacher) return { ok: false as const, error: "المعلم غير موجود" };
    await insertTeacherChatMessage({ teacher_email: email, sender: "teacher", body: data.body });
    return { ok: true as const };
  });

export const getAdminTeacherChatMessages = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => chatEmailSchema.parse(d))
  .handler(async ({ data }) => listTeacherChatMessages(data.email));

export const getAdminTeacherChatUnreadCount = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => chatEmailSchema.parse(d))
  .handler(async ({ data }) => {
    const messages = await listTeacherChatMessages(data.email);
    return messages.filter((message) => message.sender === "teacher" && !message.read).length;
  });

export const markAdminTeacherChatRead = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => chatEmailSchema.parse(d))
  .handler(async ({ data }) => {
    await markTeacherChatMessagesRead(data.email, "teacher");
    return { ok: true };
  });

export const sendAdminTeacherChatMessage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => chatMessageSchema.parse(d))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const teacher = await findTeacherMarketByEmail(email);
    if (!teacher) return { ok: false as const, error: "المعلم غير موجود" };
    await insertTeacherChatMessage({ teacher_email: email, sender: "admin", body: data.body });
    return { ok: true as const };
  });

const emailSchema = z.object({ email: z.string().email().max(200) });

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
  .handler(async ({ data }) => listTeacherNotifications(data.email, 50));

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
