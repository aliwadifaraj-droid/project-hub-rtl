// Public auth server functions: signUp, signIn, signOut, getMe, changePassword, requestPasswordReset, resetPasswordWithToken.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
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
  findUserByEmail,
  findUserById,
  createUser,
  countUsers,
  grantRole,
  getRolesForUser,
  updateUserPassword,
} from "./users.repo";
import { findClientByEmail, findClientById, createClient } from "./clients.repo"; // ضف createClient
import { createClientProfile } from "./client-profiles.repo"; // ضف هذا
import { createPasswordResetToken, getValidPasswordResetToken, markPasswordResetTokenUsed } from "./password-reset.repo";
import { sendResendEmail } from "./resend-send.server";

const FIRST_ADMIN_EMAIL = "aliwadifaraj@gmail.com";

const credsSchema = z.object({
  email: z.string().email().max(255).transform((s) => s.trim().toLowerCase()),
  password: z.string().min(6).max(72),
  company_name: z.string().optional(),
  phone: z.string().optional(),
});

// تسجيل العميل الجديد
export const signUp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credsSchema.parse(d))
  .handler(async ({ data }) => {
    const existing = await findClientByEmail(data.email);
    if (existing) throw new Error("هذا البريد مسجل بالفعل");
    const hash = await hashPassword(data.password);
    const clientId = await createClient(data.email, hash);
    if (data.company_name || data.phone) {
      await createClientProfile(clientId, data.company_name, data.phone);
    }
    const token = await signSessionToken({ sub: clientId, email: data.email, roles: ["client"] });
    setSessionCookie(token);
    return { id: clientId, email: data.email, roles: ["client"] };
  });

// تسجيل دخول: clients اول ثم users
export const signIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credsSchema.parse(d))
  .handler(async ({ data }) => {
    const client = await findClientByEmail(data.email);
    if (client) {
      if (!await verifyPassword(data.password, client.password_hash)) throw new Error("بيانات الدخول غير صحيحة");
      const token = await signSessionToken({ sub: client.id, email: client.email, roles: ["client"] });
      setSessionCookie(token);
      return { id: client.id, email: client.email, roles: ["client"] };
    }
    const user = await findUserByEmail(data.email);
    if (!user) throw new Error("بيانات الدخول غير صحيحة");
    if (!await verifyPassword(data.password, user.password_hash)) throw new Error("بيانات الدخول غير صحيحة");
    const roles = await getRolesForUser(user.id);
    const token = await signSessionToken({ sub: user.id, email: user.email, roles });
    setSessionCookie(token);
    return { id: user.id, email: user.email, roles };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  clearSessionCookie();
  return { ok: true };
});

export const getMe = createServerFn({ method: "GET" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims) return null;
  const client = await findClientById(claims.sub);
  if (client) return { id: client.id, email: client.email, roles: ["client"] };
  const user = await findUserById(claims.sub);
  if (!user) return null;
  const roles = await getRolesForUser(user.id);
  return { id: user.id, email: user.email, roles };
});

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ currentPassword: z.string().min(1).max(72), newPassword: z.string().min(6).max(72) }).parse(d),
  )
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    if (!claims) throw new Error("غير مصرح");
    const user = await findUserById(claims.sub);
    if (!user) throw new Error("العميل لا يمكنه تغيير كلمة السر من هنا");
    const ok = await verifyPassword(data.currentPassword, user.password_hash);
    if (!ok) throw new Error("كلمة المرور الحالية غير صحيحة");
    await updateUserPassword(user.id, await hashPassword(data.newPassword));
    return { ok: true };
  });

const emailSchema = z.object({ email: z.string().email().max(255).transform((s) => s.trim().toLowerCase()) });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data }) => {
    const user = await findUserByEmail(data.email);
    if (user) {
      const token = await createPasswordResetToken(user.id);
      const requestOrigin = new URL(getRequest().url).origin;
      const configuredUrl = process.env.APP_URL?.trim() || process.env.DEPLOYMENT_URL?.trim();
      const appUrl = configuredUrl || requestOrigin || "http://localhost:3000";
      const resetLink = `${appUrl}/reset-password?token=${token}`;
      await sendResendEmail({
        to: user.email, subject: "إعادة تعيين كلمة المرور — Alamran",
        html: `<!DOCTYPE html><html dir="rtl" lang="ar"><body>...</body></html>`,
      });
    }
    return { ok: true };
  });

const resetWithTokenSchema = z.object({ token: z.string().min(1), newPassword: z.string().min(6).max(72) });

export const resetPasswordWithToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => resetWithTokenSchema.parse(d))
  .handler(async ({ data }) => {
    const tokenRow = await getValidPasswordResetToken(data.token);
    if (!tokenRow) throw new Error("الرابط غير صالح أو منتهي الصلاحية");
    const user = await findUserById(tokenRow.user_id);
    if (!user) throw new Error("المستخدم غير موجود");
    await updateUserPassword(user.id, await hashPassword(data.newPassword));
    await markPasswordResetTokenUsed(data.token);
    return { ok: true };
  });
