import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import * as harajRepo from "./haraj.repo";
import { hashPassword, verifyPassword, setSessionCookie, signSessionToken } from "./auth.server";

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
    if (await harajRepo.findTeacherByEmail(data.email) || await harajRepo.findLoginByEmail(data.email)) {
      throw new Error("هذا البريد الإلكتروني مسجل مسبقاً");
    }
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
    return { ok: true };
  });

export const listTeachers = createServerFn({ method: "GET" }).handler(async () => []);

export const adminListTeachers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    if (!context.roles?.includes("admin") && !context.roles?.includes("employee")) throw new Error("غير مصرح");
    const rows = await harajRepo.listAllTeachers();
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
