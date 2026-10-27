import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, rowsToObjects } from "./db";
import { clearSessionCookie, getSessionClaims, hashPassword, setSessionCookie, signSessionToken, verifyPassword } from "./auth.server";
import { requireAuth } from "./auth-middleware.server";

type OwnerRow = { id: string; email: string; password_hash: string };

const ownerProfileSchema = z.object({
  email: z.string().email().max(255).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(6).max(72),
  company_name: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(4).max(40),
  city: z.string().trim().min(1).max(100),
  cr_number: z.string().trim().max(50).optional().default(""),
  bio: z.string().trim().max(2000).optional().default(""),
});

async function ensureOwnerTables(): Promise<void> {
  await db.batch([
    { sql: `CREATE TABLE IF NOT EXISTS project_owners (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))` , args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS project_owner_profiles (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE, company_name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))` , args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS project_owner_sessions (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT (datetime('now')), last_login_at TEXT NOT NULL DEFAULT (datetime('now')), revoked_at TEXT)` , args: [] },
  ]);
}

async function findOwnerByEmail(email: string): Promise<OwnerRow | null> {
  const result = await db.execute("SELECT id,email,password_hash FROM project_owners WHERE lower(email) = lower(?) LIMIT 1", [email]);
  const row = rowsToObjects<OwnerRow>(result)[0];
  return row ? { id: String(row.id), email: String(row.email), password_hash: String(row.password_hash) } : null;
}

async function findOwnerById(id: string): Promise<OwnerRow | null> {
  const result = await db.execute("SELECT id,email,password_hash FROM project_owners WHERE id = ? LIMIT 1", [id]);
  const row = rowsToObjects<OwnerRow>(result)[0];
  return row ? { id: String(row.id), email: String(row.email), password_hash: String(row.password_hash) } : null;
}

async function activateOwnerSession(ownerId: string): Promise<void> {
  await db.execute(
    `INSERT INTO project_owner_sessions (id,owner_id,last_login_at,revoked_at) VALUES (?,?,?,NULL)
     ON CONFLICT(owner_id) DO UPDATE SET last_login_at = excluded.last_login_at, revoked_at = NULL`,
    [crypto.randomUUID(), ownerId, new Date().toISOString()],
  );
}

async function hasActiveOwnerSession(ownerId: string): Promise<boolean> {
  const result = await db.execute("SELECT 1 FROM project_owner_sessions WHERE owner_id = ? AND revoked_at IS NULL LIMIT 1", [ownerId]);
  return rowsToObjects(result).length > 0;
}

async function signOwnerSession(owner: OwnerRow): Promise<void> {
  await activateOwnerSession(owner.id);
  setSessionCookie(await signSessionToken({ sub: owner.id, email: owner.email, roles: ["project_owner"] }));
}

export const signUpProjectOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ownerProfileSchema.parse(input))
  .handler(async ({ data }) => {
    await ensureOwnerTables();
    if (await findOwnerByEmail(data.email)) throw new Error("هذا البريد مسجل بالفعل");
    const ownerId = crypto.randomUUID();
    await db.execute("INSERT INTO project_owners (id,email,password_hash,created_at) VALUES (?,?,?,?)", [ownerId, data.email, await hashPassword(data.password), new Date().toISOString()]);
    await db.execute(
      `INSERT INTO project_owner_profiles (id,owner_id,company_name,phone,city,bio,created_at) VALUES (?,?,?,?,?,?,?)`,
      [crypto.randomUUID(), ownerId, data.company_name, data.phone, data.city, data.bio, new Date().toISOString()],
    );
    await signOwnerSession({ id: ownerId, email: data.email, password_hash: "" });
    return { id: ownerId, email: data.email, roles: ["project_owner"] };
  });

export const signInProjectOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ email: z.string().email().max(255), password: z.string().min(6).max(72) }).parse(input))
  .handler(async ({ data }) => {
    await ensureOwnerTables();
    const owner = await findOwnerByEmail(data.email.trim().toLowerCase());
    if (!owner || !(await verifyPassword(data.password, owner.password_hash))) throw new Error("بيانات الدخول غير صحيحة");
    await signOwnerSession(owner);
    return { id: owner.id, email: owner.email, roles: ["project_owner"] };
  });

export const signOutProjectOwner = createServerFn({ method: "POST" }).handler(async () => {
  await ensureOwnerTables();
  const claims = await getSessionClaims();
  if (claims?.roles.includes("project_owner")) {
    await db.execute("UPDATE project_owner_sessions SET revoked_at = ? WHERE owner_id = ?", [new Date().toISOString(), claims.sub]);
  }
  clearSessionCookie();
  return { ok: true };
});

export const getProjectOwnerSession = createServerFn({ method: "GET" }).handler(async () => {
  await ensureOwnerTables();
  const claims = await getSessionClaims();
  if (!claims?.roles.includes("project_owner") || !(await hasActiveOwnerSession(claims.sub))) return null;
  const owner = await findOwnerById(claims.sub);
  if (!owner) return null;
  const profileResult = await db.execute("SELECT company_name,phone,city,bio FROM project_owner_profiles WHERE owner_id = ? LIMIT 1", [owner.id]);
  const profile = rowsToObjects<Record<string, unknown>>(profileResult)[0];
  return { id: owner.id, email: owner.email, company_name: String(profile?.company_name ?? ""), phone: String(profile?.phone ?? ""), city: String(profile?.city ?? ""), cr_number: "", bio: String(profile?.bio ?? "") };
});

const projectSchema = z.object({
  name: z.string().trim().min(2).max(200), description: z.string().trim().min(2).max(5000), location: z.string().trim().min(1).max(200), duration: z.string().trim().min(1).max(100), cover_image: z.string().trim().max(500).min(1), images: z.array(z.string().trim().max(500)).max(20).optional().default([]), pdf_file: z.string().trim().max(500).optional().default(""),
});

async function requireActiveOwner(ownerId: string, roles: string[]): Promise<void> {
  if (!roles.includes("project_owner") || !(await hasActiveOwnerSession(ownerId))) throw new Error("غير مصرح");
}

export const createOwnerProject = createServerFn({ method: "POST" }).middleware([requireAuth]).inputValidator((input: unknown) => projectSchema.parse(input)).handler(async ({ data, context }) => {
  await ensureOwnerTables();
  await requireActiveOwner(context.userId, context.roles);
  const id = crypto.randomUUID();
  await db.execute(`INSERT INTO projects (id,name,description,location,duration,cover_image,images,pdf_file,created_by,status,admin_approval,is_customer_request,created_at) VALUES (?,?,?,?,?,?,?,? ,?, 'pending', 'pending', 1, ?)`, [id, data.name, data.description, data.location, data.duration, data.cover_image, JSON.stringify(data.images), data.pdf_file, context.userId, new Date().toISOString()]);
  return { id };
});

export const listOwnerProjects = createServerFn({ method: "GET" }).middleware([requireAuth]).handler(async ({ context }) => {
  await ensureOwnerTables(); await requireActiveOwner(context.userId, context.roles);
  const result = await db.execute("SELECT id,name,description,location,duration,cover_image,pdf_file,status,admin_approval,created_at FROM projects WHERE created_by = ? ORDER BY created_at DESC", [context.userId]);
  return rowsToObjects<Record<string, unknown>>(result).map((row) => ({ id: String(row.id), name: String(row.name ?? ""), description: String(row.description ?? ""), location: String(row.location ?? ""), duration: String(row.duration ?? ""), cover_image: String(row.cover_image ?? ""), pdf_file: String(row.pdf_file ?? ""), status: String(row.status ?? "pending"), admin_approval: String(row.admin_approval ?? "pending"), created_at: String(row.created_at ?? "") }));
});

export const listOwnerRequests = createServerFn({ method: "GET" }).middleware([requireAuth]).handler(async ({ context }) => {
  await ensureOwnerTables(); await requireActiveOwner(context.userId, context.roles);
  const result = await db.execute("SELECT r.id,r.project_id,r.company_name,r.project_name,r.facility_location,r.email,r.pdf_url,r.status,r.note,r.created_at,p.name AS owner_project_name FROM project_requests r INNER JOIN projects p ON p.id = r.project_id WHERE p.created_by = ? ORDER BY r.created_at DESC", [context.userId]);
  return rowsToObjects<Record<string, unknown>>(result).map((row) => ({ id: String(row.id), project_id: String(row.project_id ?? ""), company_name: String(row.company_name ?? ""), project_name: String(row.project_name ?? row.owner_project_name ?? ""), facility_location: String(row.facility_location ?? ""), email: String(row.email ?? ""), pdf_url: String(row.pdf_url ?? ""), status: String(row.status ?? "new"), note: String(row.note ?? ""), created_at: String(row.created_at ?? "") }));
});
