import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import {
  listTeachersMarket,
  insertTeacherMarket,
  updateTeacherMarketStatus,
  findTeacherMarketByEmail,
} from "./teacher-market.repo";

const registerSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(200),
  city: z.string().min(1).max(100),
  phone: z.string().min(5).max(30),
  cv: z.string().max(500).optional().nullable(),
});

export const registerTeacher = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registerSchema.parse(d))
  .handler(async ({ data }) => {
    const id = await insertTeacherMarket({
      name: data.name,
      email: data.email,
      city: data.city,
      phone: data.phone,
      cv: data.cv ?? null,
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

export const updateTeacherStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data }) => {
    await updateTeacherMarketStatus(data.id, data.status, data.exit_date);
    return { ok: true };
  });
