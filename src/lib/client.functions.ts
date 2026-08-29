// Server functions for the client portal:
// - signUpClient / signInClient (separate from admin auth, stored on Turso)
// - getMyClientProfile / updateMyClientProfile
// - getMyOffers (track all offers submitted with the client's company name + email)
// - searchProjectsForOffer (project search for the offer form)
// - submitClientOffer (submit a price offer with all bot-form validations)
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  setSessionCookie,
  getSessionClaims,
} from "./auth.server";
import {
  findUserByEmail,
  createUser,
  getRolesForUser,
} from "./users.repo";
import * as clientRepo from "./client.repo";
import * as projectsRepo from "./projects.repo";
import * as notificationsRepo from "./notifications.repo";
import * as blockedRepo from "./blocked.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";
import { detectCity } from "./vip-notify.server";
import { requireAuth } from "./auth-middleware.server";

const clientCredsSchema = z.object({
  email: z.string().email().max(255).transform((s) => s.trim().toLowerCase()),
  password: z.string().min(6).max(72),
});

// ---------- Client Sign Up ----------
const signUpClientSchema = clientCredsSchema.extend({
  company_name: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(4).max(40),
  city: z.string().trim().min(1).max(100),
  cr_number: z.string().trim().max(50).optional().default(""),
  bio: z.string().trim().max(2000).optional().default(""),
});

export const signUpClient = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signUpClientSchema.parse(d))
  .handler(async ({ data }) => {
    const existing = await findUserByEmail(data.email);
    if (existing) throw new Error("هذا البريد مسجل بالفعل");
    const hash = await hashPassword(data.password);
    const userId = await createUser(data.email, hash);
    await clientRepo.createClientProfile(userId, data.email, {
      company_name: data.company_name,
      phone: data.phone,
      city: data.city,
      cr_number: data.cr_number,
      bio: data.bio,
    });
    const roles = await getRolesForUser(userId);
    const token = await signSessionToken({ sub: userId, email: data.email, roles });
    setSessionCookie(token);
    return { id: userId, email: data.email, roles };
  });

// ---------- Client Sign In ----------
export const signInClient = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => clientCredsSchema.parse(d))
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

// ---------- Get current client session ----------
export const getClientSession = createServerFn({ method: "GET" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims) return null;
  const profile = await clientRepo.getClientProfile(claims.sub);
  if (!profile) return null;
  return {
    id: claims.sub,
    email: claims.email,
    company_name: profile.company_name,
    profile,
  };
});

// ---------- Get / Update profile ----------
export const getMyClientProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    return clientRepo.getClientProfile(context.userId);
  });

export const updateMyClientProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      company_name: z.string().trim().min(2).max(200),
      phone: z.string().trim().min(4).max(40),
      city: z.string().trim().min(1).max(100),
      cr_number: z.string().trim().max(50).optional().default(""),
      bio: z.string().trim().max(2000).optional().default(""),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    if (!claims) throw new Error("Unauthorized");
    const existing = await clientRepo.getClientProfile(claims.sub);
    if (!existing) {
      await clientRepo.createClientProfile(claims.sub, claims.email, {
        company_name: data.company_name,
        phone: data.phone,
        city: data.city,
        cr_number: data.cr_number,
        bio: data.bio,
      });
    } else {
      await clientRepo.updateClientProfile(claims.sub, {
        company_name: data.company_name,
        phone: data.phone,
        city: data.city,
        cr_number: data.cr_number,
        bio: data.bio,
      });
    }
    return { ok: true };
  });

// ---------- Track my offers ----------
// Returns all offers submitted with the client's company_name and email
export const getMyOffers = createServerFn({ method: "GET" }).handler(async () => {
  const claims = await getSessionClaims();
  if (!claims) throw new Error("Unauthorized");
  const profile = await clientRepo.getClientProfile(claims.sub);
  if (!profile) return [];

  // Search notifications by email (pending offers)
  const pendingByEmail = await notificationsRepo.searchOfferNotificationsByEmail(profile.email, 200);
  // Also search by company name
  const pendingByCompany = await notificationsRepo.searchOfferNotificationsByCompany(profile.company_name, 200);

  // Merge and deduplicate
  const seen = new Set<string>();
  const merged = [...pendingByEmail, ...pendingByCompany].filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  // Also fetch accepted offers from project_requests
  const { db, rowsToObjects } = await import("./db");
  const r = await db.execute(
    `SELECT id, project_id, company_name, facility_location, email, pdf_url, status, submitter_type, project_type, note, created_at
     FROM project_requests
     WHERE lower(trim(email)) = lower(trim(?)) OR lower(trim(company_name)) = lower(trim(?))
     ORDER BY created_at DESC LIMIT 200`,
    [profile.email, profile.company_name],
  );
  const accepted = rowsToObjects<any>(r).map((row) => ({
    id: String(row.id),
    project_id: row.project_id ?? null,
    project_name: row.facility_location ?? "",
    company_name: String(row.company_name ?? ""),
    email: String(row.email ?? ""),
    amount: "",
    pdf_key: row.pdf_url ?? null,
    pdf_filename: null,
    status: String(row.status ?? "new"),
    source: row.project_type ?? "platform",
    created_at: String(row.created_at ?? ""),
    is_accepted: true,
  }));

  // Map pending offers to a common shape
  const pending = merged.map((n) => ({
    id: n.id,
    project_id: n.project_id,
    project_name: n.project_name ?? "",
    company_name: n.company_name ?? "",
    email: n.email ?? "",
    amount: n.amount ?? "",
    pdf_key: n.pdf_key,
    pdf_filename: n.pdf_filename,
    status: n.offer_status ?? "new",
    source: n.source ?? "platform",
    created_at: n.created_at,
    is_accepted: false,
  }));

  return [...pending, ...accepted];
});

// ---------- Search projects for offer form ----------
export const searchProjectsForClient = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ q: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const rows = await projectsRepo.searchByName(data.q);
    return Promise.all(rows.map(async (p) => {
      const exclusive = await projectsRepo.getProjectExclusive(p.id).catch(() => null);
      const activeExclusive = !!exclusive && Date.now() < new Date(exclusive.vip_end_at).getTime();
      return {
        id: p.id,
        name: p.name,
        location: p.location,
        status: p.status,
        offers_enabled: p.offers_enabled,
        is_exclusive: activeExclusive,
        vip_end_at: activeExclusive ? exclusive!.vip_end_at : null,
      };
    }));
  });

// ---------- Submit offer from client portal ----------
// Applies ALL the same validations as the bot form (submitOffer in offers.functions.ts)
const submitClientOfferSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string().trim().min(2).max(200),
  amount: z.string().trim().min(1).max(60),
  pdfKey: z.string().trim().min(1).max(500),
  pdfFilename: z.string().trim().min(1).max(200),
});

export const submitClientOffer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submitClientOfferSchema.parse(d))
  .handler(async ({ data }) => {
    const claims = await getSessionClaims();
    if (!claims) throw new Error("يجب تسجيل الدخول");

    const profile = await clientRepo.getClientProfile(claims.sub);
    if (!profile) throw new Error("الملف غير موجود، يرجى إكمال بياناتك أولاً");

    // Company name and email are forced from the registration data
    const companyName = profile.company_name;
    const email = profile.email;

    await projectsRepo.ensureOffersEnabledColumn();
    const project = await projectsRepo.getById(data.projectId);
    if (!project) {
      return { ok: false as const, message: "المشروع غير موجود" };
    }

    // Check project name matches
    const projByName = await projectsRepo.getByNameExact(data.projectName);
    if (!projByName || projByName.id !== data.projectId) {
      return { ok: false as const, message: "اسم المشروع غير مطابق" };
    }

    // Check project status — cancelled
    if (project.status === "cancelled") {
      return { ok: false as const, message: "تنبيه: تم إلغاء هذا المشروع ولا يمكنك التقديم عليه" };
    }

    // Check project status — delivered
    if (project.status === "delivered") {
      return { ok: false as const, message: "تنبيه: هذا المشروع تم تسليمه ولا يمكن التقديم عليه" };
    }

    // Check exclusive window
    const exclusive = await projectsRepo.getProjectExclusive(project.id).catch(() => null);
    if (exclusive && Date.now() < new Date(exclusive.vip_end_at).getTime()) {
      const city = detectCity(project.location ?? "");
      const cityLabel = city ? ` في ${city}` : "";
      return { ok: false as const, message: `هذا المشروع حصري خاص بعملاء VIP${cityLabel}` };
    }

    // Check offers enabled
    if (!project.offers_enabled) {
      return { ok: false as const, message: "تقديم عروض الأسعار متوقف حالياً لهذا المشروع" };
    }

    // Check duplicate offer
    const dup = await notificationsRepo.checkDuplicateOffer({
      projectName: data.projectName,
      companyName,
      projectId: project.id,
    });
    if (dup) {
      return { ok: false as const, message: "هذا المشروع سبق وتم تقديم عرض سعر له من قبلكم" };
    }

    // Check blocked
    const blocked = await blockedRepo.isBlocked(companyName, email);
    if (blocked) {
      return { ok: false as const, message: BLOCKED_MESSAGE };
    }

    // Check notifications for same email+project pending
    const { db } = await import("./db");
    const checkEmailNotif = await db.execute(
      `SELECT id FROM notifications WHERE email = ? AND project_name = ? AND status = 'pending'`,
      [email, data.projectName],
    );
    if (checkEmailNotif.rows.length > 0) {
      return { ok: false as const, message: "هذا الايميل مستخدم في عرض سعر سابق لنفس المشروع" };
    }

    const checkNameNotif = await db.execute(
      `SELECT id FROM notifications WHERE company_name = ? AND project_name = ? AND status = 'pending'`,
      [companyName, data.projectName],
    );
    if (checkNameNotif.rows.length > 0) {
      return { ok: false as const, message: "اسم المنشأة مستخدم في عرض سعر سابق لنفس المشروع" };
    }

    // Check project_requests for same email+project
    const checkEmailReq = await db.execute(
      `SELECT id FROM project_requests WHERE email = ? AND facility_location = ?`,
      [email, data.projectName],
    );
    if (checkEmailReq.rows.length > 0) {
      return { ok: false as const, message: "هذا الايميل مستخدم في عرض سعر سابق لنفس المشروع" };
    }

    const checkNameReq = await db.execute(
      `SELECT id FROM project_requests WHERE company_name = ? AND facility_location = ?`,
      [companyName, data.projectName],
    );
    if (checkNameReq.rows.length > 0) {
      return { ok: false as const, message: "اسم المنشأة مستخدم في عرض سعر سابق لنفس المشروع" };
    }

    // Notify all admin/employee staff
    const staff = await listAdminUserIds();
    const title = "عرض سعر جديد";
    const body = `${companyName} — ${data.projectName} — ${data.amount}`;
    const ids = await notificationsRepo.insertOfferNotificationMany(
      staff.map((uid) => ({
        user_id: uid,
        title,
        body,
        link: "/admin/offers",
        project_id: project.id,
        project_name: data.projectName,
        company_name: companyName,
        email,
        amount: data.amount,
        pdf_key: data.pdfKey,
        pdf_filename: data.pdfFilename,
        source: "client_portal",
        submitter_type: "user",
        offer_status: "new",
        status: "pending",
      })),
    );
    const id = ids[0] ?? "";

    return { ok: true as const, id, message: "تم استلام عرضك بنجاح. سيتم اشعاركم بأي تحديث ✅" };
  });

async function listAdminUserIds(): Promise<string[]> {
  const { db, rowsToObjects } = await import("./db");
  const r = await db.execute(`SELECT DISTINCT user_id FROM user_roles WHERE role IN ('admin','employee')`);
  return rowsToObjects<{ user_id: string }>(r).map((x) => String(x.user_id));
}
