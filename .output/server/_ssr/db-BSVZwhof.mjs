import process from "node:process";
import { b as bcrypt } from "../_libs/bcryptjs.mjs";
import { g as getRequest, s as setResponseHeader } from "./server-BNqJEEJz.mjs";
import { c as createClient } from "../_libs/libsql__client.mjs";
import { j as jwtVerify, S as SignJWT } from "../_libs/jose.mjs";



import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";

import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";





import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";

import "../_libs/react.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/promise-limit.mjs";
const COOKIE_NAME = "session";
const SESSION_DAYS = 30;
function secret() {
  const s = process.env.AUTH_JWT_SECRET || process.env.SESSION_SECRET || process.env.TURSO_AUTH_TOKEN;
  if (!s) throw new Error("AUTH_JWT_SECRET or SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
}
async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}
async function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}
async function signSessionToken(claims) {
  return new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_DAYS}d`).sign(secret());
}
async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.email) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      roles: Array.isArray(payload.roles) ? payload.roles : []
    };
  } catch {
    return null;
  }
}
function readSessionCookie() {
  const req = getRequest();
  const header = req?.headers?.get?.("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === COOKIE_NAME) return decodeURIComponent(rest.join("="));
  }
  return null;
}
async function getSessionClaims() {
  const token = readSessionCookie();
  if (!token) return null;
  return verifySessionToken(token);
}
function setSessionCookie(token) {
  const req = getRequest();
  const isHttps = req?.url?.startsWith("https://") ?? false;
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`
  ];
  if (isHttps) parts.push("Secure");
  setResponseHeader("set-cookie", parts.join("; "));
}
function clearSessionCookie() {
  const req = getRequest();
  const isHttps = req?.url?.startsWith("https://") ?? false;
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (isHttps) parts.push("Secure");
  setResponseHeader("set-cookie", parts.join("; "));
}
const auth_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clearSessionCookie,
  getSessionClaims,
  hashPassword,
  readSessionCookie,
  setSessionCookie,
  signSessionToken,
  verifyPassword,
  verifySessionToken
}, Symbol.toStringTag, { value: "Module" }));
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  throw new Error("TURSO_DATABASE_URL environment variable is required");
}
const client = createClient({ url, authToken });
const db = {
  execute(sql, args) {
    if (args !== void 0) {
      return client.execute({ sql, args });
    }
    return client.execute(sql);
  },
  batch(statements) {
    return client.batch(statements);
  }
};
function rowsToObjects(result) {
  return result.rows;
}
const db$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  db,
  rowsToObjects
}, Symbol.toStringTag, { value: "Module" }));
export {
  setSessionCookie as a,
  auth_server as b,
  clearSessionCookie as c,
  db as d,
  db$1 as e,
  getSessionClaims as g,
  hashPassword as h,
  rowsToObjects as r,
  signSessionToken as s,
  verifyPassword as v
};
