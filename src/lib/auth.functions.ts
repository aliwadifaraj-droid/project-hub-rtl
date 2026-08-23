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
import { createPasswordResetToken, getValidPasswordResetToken, markPasswordResetTokenUsed } from "./password-reset.repo";
import { sendResendEmail } from "./resend-send.server";

const FIRST_ADMIN_EMAIL = "aliwadifaraj@gmail.com";

const credsSchema = z.object({
  email: z.string().email().max(255).transform((s) => s.trim().toLowerCase()),
  password: z.string().min(6).max(72),
});

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credsSchema.parse(d))
  .handler(async ({ data }) => {
    const existing = await findUserByEmail(data.email);
    if (existing) throw new Error("هذا البريد مسجل بالفعل");
    const hash = await hashPassword(data.password);
    const userId = await createUser(data.email, hash);
    // First user OR the reserved admin email → admin
    const isFirstUser = (await countUsers()) === 1;
    if (isFirstUser || data.email === FIRST_ADMIN_EMAIL) {
      await grantRole(userId, "admin");
    }
    const roles = await getRolesForUser(userId);
    const token = await signSessionToken({ sub: userId, email: data.email, roles });
    setSessionCookie(token);
    return { id: userId, email: data.email, roles };
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credsSchema.parse(d))
  .handler(async ({ data }) => {
    const user = await findUserByEmail(data.email);
    if (!user) throw new Error("بيانات الدخول غير صحيحة");
    const ok = await verifyPassword(data.password, user.password_hash);
    if (!ok) throw new Error("بيانات الدخول غير صحيحة");
    let roles = await getRolesForUser(user.id);
    if ((data.email === FIRST_ADMIN_EMAIL || (await countUsers()) === 1) && !roles.includes("admin")) {
      await grantRole(user.id, "admin");
      roles = await getRolesForUser(user.id);
    }
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
  // Re-check user still exists
  const user = await findUserById(claims.sub);
  if (!user) return null;
  const roles = await getRolesForUser(user.id);
  return { id: user.id, email: user.email, roles };
});

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      currentPassword: z.string().min(1).max(72),
      newPassword: z.string().min(6).max(72),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    if (!claims) throw new Error("غير مصرح");
    const user = await findUserById(claims.sub);
    if (!user) throw new Error("غير موجود");
    const ok = await verifyPassword(data.currentPassword, user.password_hash);
    if (!ok) throw new Error("كلمة المرور الحالية غير صحيحة");
    await updateUserPassword(user.id, await hashPassword(data.newPassword));
    return { ok: true };
  });

const emailSchema = z.object({
  email: z.string().email().max(255).transform((s) => s.trim().toLowerCase()),
});

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
        to: user.email,
        subject: "إعادة تعيين كلمة المرور — Alamran",
        html: `<!DOCTYPE html><html dir="rtl" lang="ar"><body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
<h2>إعادة تعيين كلمة المرور</h2>
<p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
<p>اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
<p style="margin:24px 0;">
  <a href="${resetLink}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">إعادة تعيين كلمة المرور</a>
</p>
<p style="font-size:12px;color:#64748b;">أو انسخ هذا الرابط: ${resetLink}</p>
<p style="font-size:12px;color:#64748b;">الرابط صالح لمدة 30 دقيقة فقط. إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.</p>
</body></html>`,
      });
    }
    return { ok: true };
  });

const resetWithTokenSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6).max(72),
});

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
