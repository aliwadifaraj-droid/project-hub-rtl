// Auth primitives: bcrypt password hashing + JWT session in httpOnly cookies.
// Server-only. Do not import from client code.

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";

const COOKIE_NAME = "session";
const SESSION_DAYS = 30;

function secret(): Uint8Array {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s) throw new Error("AUTH_JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export type SessionClaims = {
  sub: string;   // user id
  email: string;
  roles: string[];
};

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT(claims as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.email) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
    };
  } catch {
    return null;
  }
}

/** Parse the incoming request cookie header for our session cookie. */
export function readSessionCookie(): string | null {
  const req = getRequest();
  const header = req?.headers?.get?.("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === COOKIE_NAME) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Read and validate the current session (or null). */
export async function getSessionClaims(): Promise<SessionClaims | null> {
  const token = readSessionCookie();
  if (!token) return null;
  return verifySessionToken(token);
}

/** Set the session cookie on the outgoing response. */
export function setSessionCookie(token: string) {
  const req = getRequest();
  const isHttps = req?.url?.startsWith("https://") ?? false;
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
  ];
  if (isHttps) parts.push("Secure");
  setResponseHeader("set-cookie", parts.join("; "));
}

export function clearSessionCookie() {
  const req = getRequest();
  const isHttps = req?.url?.startsWith("https://") ?? false;
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isHttps) parts.push("Secure");
  setResponseHeader("set-cookie", parts.join("; "));
}
