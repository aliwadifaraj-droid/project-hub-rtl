import process from "node:process";
import { c as createServerRpc } from "./createServerRpc-Dx-ThoJh.mjs";
import { c as createServerFn, g as getRequest } from "./server-BNqJEEJz.mjs";
import { h as hashPassword, s as signSessionToken, a as setSessionCookie, v as verifyPassword, c as clearSessionCookie, g as getSessionClaims, d as db, r as rowsToObjects } from "./db-BSVZwhof.mjs";
import { f as findUserByEmail, c as createUser, e as countUsers, a as grantRole, b as getRolesForUser, h as findUserById, u as updateUserPassword } from "./users.repo-JS4Zo3xr.mjs";
import { sendResendEmail } from "./resend-send.server-Cc6n_-h6.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";





import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";

import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

const TOKEN_TTL_MINUTES = 30;
let _tableReady = null;
function ensureTable() {
  if (_tableReady) return _tableReady;
  _tableReady = db.execute(
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`
  ).then(() => db.execute(
    `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`
  )).then(() => void 0);
  return _tableReady;
}
async function createPasswordResetToken(userId) {
  await ensureTable();
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const id = crypto.randomUUID();
  const now = /* @__PURE__ */ new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MINUTES * 60 * 1e3).toISOString();
  await db.execute(
    `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)`,
    [id, userId, token, expiresAt, now.toISOString()]
  );
  return token;
}
async function getValidPasswordResetToken(token) {
  await ensureTable();
  const r = await db.execute(
    `SELECT id, user_id, token, expires_at, used, created_at FROM password_reset_tokens WHERE token = ? LIMIT 1`,
    [token]
  );
  const row = rowsToObjects(r)[0];
  if (!row) return null;
  const used = Number(row.used ?? 0) === 1;
  const expired = new Date(String(row.expires_at)).getTime() < Date.now();
  if (used || expired) return null;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    token: String(row.token),
    expires_at: String(row.expires_at),
    used,
    created_at: String(row.created_at ?? "")
  };
}
async function markPasswordResetTokenUsed(token) {
  await ensureTable();
  await db.execute(`UPDATE password_reset_tokens SET used = 1 WHERE token = ?`, [token]);
}
const FIRST_ADMIN_EMAIL = "aliwadifaraj@gmail.com";
const credsSchema = objectType({
  email: stringType().email().max(255).transform((s) => s.trim().toLowerCase()),
  password: stringType().min(6).max(72)
});
const signUp_createServerFn_handler = createServerRpc({
  id: "bbd9915d8b85c65a3b3f8e8ee5957a3dfe60390cf4d3eb0e1e0afb89dda15aea",
  name: "signUp",
  filename: "src/lib/auth.functions.ts"
}, (opts) => signUp.__executeServer(opts));
const signUp = createServerFn({
  method: "POST"
}).inputValidator((d) => credsSchema.parse(d)).handler(signUp_createServerFn_handler, async ({
  data
}) => {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new Error("هذا البريد مسجل بالفعل");
  const hash = await hashPassword(data.password);
  const userId = await createUser(data.email, hash);
  const isFirstUser = await countUsers() === 1;
  if (isFirstUser || data.email === FIRST_ADMIN_EMAIL) {
    await grantRole(userId, "admin");
  }
  const roles = await getRolesForUser(userId);
  const token = await signSessionToken({
    sub: userId,
    email: data.email,
    roles
  });
  setSessionCookie(token);
  return {
    id: userId,
    email: data.email,
    roles
  };
});
const signIn_createServerFn_handler = createServerRpc({
  id: "15946b07b54e0909aa27fa0f35669f0600b7c3f449e509501f5aec30c0ba00fd",
  name: "signIn",
  filename: "src/lib/auth.functions.ts"
}, (opts) => signIn.__executeServer(opts));
const signIn = createServerFn({
  method: "POST"
}).inputValidator((d) => credsSchema.parse(d)).handler(signIn_createServerFn_handler, async ({
  data
}) => {
  const user = await findUserByEmail(data.email);
  if (!user) throw new Error("بيانات الدخول غير صحيحة");
  const ok = await verifyPassword(data.password, user.password_hash);
  if (!ok) throw new Error("بيانات الدخول غير صحيحة");
  let roles = await getRolesForUser(user.id);
  if ((data.email === FIRST_ADMIN_EMAIL || await countUsers() === 1) && !roles.includes("admin")) {
    await grantRole(user.id, "admin");
    roles = await getRolesForUser(user.id);
  }
  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    roles
  });
  setSessionCookie(token);
  return {
    id: user.id,
    email: user.email,
    roles
  };
});
const signOut_createServerFn_handler = createServerRpc({
  id: "95f2cf03275bf7421044cb43581f390444f8462eb7ceef40d1fbcdaa0f979964",
  name: "signOut",
  filename: "src/lib/auth.functions.ts"
}, (opts) => signOut.__executeServer(opts));
const signOut = createServerFn({
  method: "POST"
}).handler(signOut_createServerFn_handler, async () => {
  clearSessionCookie();
  return {
    ok: true
  };
});
const getMe_createServerFn_handler = createServerRpc({
  id: "05d540c91ea9147d57c434f81d698c2e3ff5d23ba136ebab060a4513339a2b8c",
  name: "getMe",
  filename: "src/lib/auth.functions.ts"
}, (opts) => getMe.__executeServer(opts));
const getMe = createServerFn({
  method: "GET"
}).handler(getMe_createServerFn_handler, async () => {
  const claims = await getSessionClaims();
  if (!claims) return null;
  const user = await findUserById(claims.sub);
  if (!user) return null;
  const roles = await getRolesForUser(user.id);
  return {
    id: user.id,
    email: user.email,
    roles
  };
});
const changePassword_createServerFn_handler = createServerRpc({
  id: "99a6241c2e872ac588fb9e911f1c19e326e4ed158596fc59ad6d76613657d027",
  name: "changePassword",
  filename: "src/lib/auth.functions.ts"
}, (opts) => changePassword.__executeServer(opts));
const changePassword = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  currentPassword: stringType().min(1).max(72),
  newPassword: stringType().min(6).max(72)
}).parse(d)).handler(changePassword_createServerFn_handler, async ({
  data
}) => {
  const claims = await getSessionClaims();
  if (!claims) throw new Error("غير مصرح");
  const user = await findUserById(claims.sub);
  if (!user) throw new Error("غير موجود");
  const ok = await verifyPassword(data.currentPassword, user.password_hash);
  if (!ok) throw new Error("كلمة المرور الحالية غير صحيحة");
  await updateUserPassword(user.id, await hashPassword(data.newPassword));
  return {
    ok: true
  };
});
const emailSchema = objectType({
  email: stringType().email().max(255).transform((s) => s.trim().toLowerCase())
});
const requestPasswordReset_createServerFn_handler = createServerRpc({
  id: "e92855947cae016a13e8d6fa4b210ab347a059e2ad930c57303e3cd0fdac2134",
  name: "requestPasswordReset",
  filename: "src/lib/auth.functions.ts"
}, (opts) => requestPasswordReset.__executeServer(opts));
const requestPasswordReset = createServerFn({
  method: "POST"
}).inputValidator((d) => emailSchema.parse(d)).handler(requestPasswordReset_createServerFn_handler, async ({
  data
}) => {
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
</body></html>`
    });
  }
  return {
    ok: true
  };
});
const resetWithTokenSchema = objectType({
  token: stringType().min(1),
  newPassword: stringType().min(6).max(72)
});
const resetPasswordWithToken_createServerFn_handler = createServerRpc({
  id: "eb4e3c706f872f0da3aaed5a5f23123c66e0b18caf30063f912ba5bcf5982885",
  name: "resetPasswordWithToken",
  filename: "src/lib/auth.functions.ts"
}, (opts) => resetPasswordWithToken.__executeServer(opts));
const resetPasswordWithToken = createServerFn({
  method: "POST"
}).inputValidator((d) => resetWithTokenSchema.parse(d)).handler(resetPasswordWithToken_createServerFn_handler, async ({
  data
}) => {
  const tokenRow = await getValidPasswordResetToken(data.token);
  if (!tokenRow) throw new Error("الرابط غير صالح أو منتهي الصلاحية");
  const user = await findUserById(tokenRow.user_id);
  if (!user) throw new Error("المستخدم غير موجود");
  await updateUserPassword(user.id, await hashPassword(data.newPassword));
  await markPasswordResetTokenUsed(data.token);
  return {
    ok: true
  };
});
export {
  changePassword_createServerFn_handler,
  getMe_createServerFn_handler,
  requestPasswordReset_createServerFn_handler,
  resetPasswordWithToken_createServerFn_handler,
  signIn_createServerFn_handler,
  signOut_createServerFn_handler,
  signUp_createServerFn_handler
};
