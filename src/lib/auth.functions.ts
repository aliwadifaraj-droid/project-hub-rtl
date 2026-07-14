// Public auth server functions: signUp, signIn, signOut, getMe, resetPassword.
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
  findUserByEmail,
  findUserById,
  createUser,
  countUsers,
  grantRole,
  getRolesForUser,
  updateUserPassword,
} from "./users.repo";

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
