import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, rowsToObjects } from "./db";
import { hashPassword, verifyPassword, signSessionToken, setSessionCookie, getSessionClaims } from "./auth.server";
import { createUser, findUserByEmail, findUserById, getRolesForUser, grantRole } from "./users.repo";
import { requireAuth } from "./auth-middleware.server";

const ownerProfileSchema = z.object({
  email: z.string().email().max(255).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(6).max(72),
  company_name: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(4).max(40),
  city: z.string().trim().min(1).max(100),
  cr_number: z.string().trim().max(50).optional().default(""),
  bio: z.string().trim().max(2000).optional().default(""),
});

async function ensureOwnerProfilesTable(): Promise<void> {
  await db.execute(`CREATE TABLE IF NOT EXISTS project_owner_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    cr_number TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
}

export const signUpProjectOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ownerProfileSchema.parse(input))
  .handler(async ({ data }) => {
    await ensureOwnerProfilesTable();
    if (await findUserByEmail(data.email)) throw new Error("هذا البريد مسجل بالفعل");
    const userId = await createUser(data.email, await hashPassword(data.password));
    await grantRole(userId, "project_owner");
    await db.execute(
      `INSERT INTO project_owner_profiles (id,user_id,company_name,email,phone,city,cr_number,bio,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [crypto.randomUUID(), userId, data.company_name, data.email, data.phone, data.city, data.cr_number, data.bio, new Date().toISOString()],
    );
    const roles = await getRolesForUser(userId);
    setSessionCookie(await signSessionToken({ sub: userId, email: data.email, roles }));
    return { id: userId, email: data.email, roles };
  });

export const signInProjectOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ email: z.string().email().max(255), password: z.string().min(6).max(72) }).parse(input))
  .handler(async ({ data }) => {
    const user = await findUserByEmail(data.email.trim().toLowerCase());
    if (!user || !(await verifyPassword(data.password, user.password_hash))) throw new Error("بيانات الدخول غير صحيحة");
    const roles = await getRolesForUser(user.id);
    if (!roles.includes("project_owner")) throw new Error("هذا الحساب ليس حساب صاحب مشروع");
    setSessionCookie(await signSessionToken({ sub: user.id, email: user.email, roles }));
    return { id: user.id, email: user.email, roles };
  });

export const getProjectOwnerSession = createServerFn({ method: "GET" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims || !claims.roles.includes("project_owner")) return null;
  const user = await findUserById(claims.sub);
  if (!user) return null;
  await ensureOwnerProfilesTable();
  const profileResult = await db.execute("SELECT company_name,phone,city,cr_number,bio FROM project_owner_profiles WHERE user_id = ? LIMIT 1", [user.id]);
  const profile = rowsToObjects<Record<string, unknown>>(profileResult)[0];
  return {
    id: user.id,
    email: user.email,
    company_name: String(profile?.company_name ?? ""),
    phone: String(profile?.phone ?? ""),
    city: String(profile?.city ?? ""),
    cr_number: String(profile?.cr_number ?? ""),
    bio: String(profile?.bio ?? ""),
  };
});

const projectSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().min(2).max(5000),
  location: z.string().trim().min(1).max(200),
  duration: z.string().trim().min(1).max(100),
  cover_image: z.string().trim().max(500).optional().default(""),
  pdf_file: z.string().trim().max(500).optional().default(""),
});

export const createOwnerProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) => projectSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!context.roles.includes("project_owner")) throw new Error("غير مصرح");
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO projects (id,name,description,location,duration,cover_image,images,pdf_file,created_by,status,admin_approval,is_customer_request,created_at)
       VALUES (?,?,?,?,?,?,?,? ,?, 'pending', 'pending', 1, ?)`,
      [id, data.name, data.description, data.location, data.duration, data.cover_image, "[]", data.pdf_file, context.userId, new Date().toISOString()],
    );
    return { id };
  });

export const listOwnerProjects = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    if (!context.roles.includes("project_owner")) throw new Error("غير مصرح");
    const result = await db.execute(
      `SELECT id,name,description,location,duration,cover_image,pdf_file,status,admin_approval,created_at
       FROM projects WHERE created_by = ? ORDER BY created_at DESC`,
      [context.userId],
    );
    return rowsToObjects<Record<string, unknown>>(result).map((row) => ({
      id: String(row.id), name: String(row.name ?? ""), description: String(row.description ?? ""),
      location: String(row.location ?? ""), duration: String(row.duration ?? ""), cover_image: String(row.cover_image ?? ""),
      pdf_file: String(row.pdf_file ?? ""), status: String(row.status ?? "pending"),
      admin_approval: String(row.admin_approval ?? "pending"), created_at: String(row.created_at ?? ""),
    }));
  });

export const listOwnerRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    if (!context.roles.includes("project_owner")) throw new Error("غير مصرح");
    const result = await db.execute(
      `SELECT r.id,r.project_id,r.company_name,r.project_name,r.facility_location,r.email,r.pdf_url,r.status,r.note,r.created_at,p.name AS owner_project_name
       FROM project_requests r INNER JOIN projects p ON p.id = r.project_id
       WHERE p.created_by = ? ORDER BY r.created_at DESC`,
      [context.userId],
    );
    return rowsToObjects<Record<string, unknown>>(result).map((row) => ({
      id: String(row.id), project_id: String(row.project_id ?? ""), company_name: String(row.company_name ?? ""),
      project_name: String(row.project_name ?? row.owner_project_name ?? ""), facility_location: String(row.facility_location ?? ""),
      email: String(row.email ?? ""), pdf_url: String(row.pdf_url ?? ""), status: String(row.status ?? "new"),
      note: String(row.note ?? ""), created_at: String(row.created_at ?? ""),
    }));
  });
