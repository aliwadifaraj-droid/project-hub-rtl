import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAuth, requireAdmin } from "./auth-middleware.server";
import { getRolesForUser, findUserById } from "./users.repo";
import * as projectsRepo from "./projects.repo";
import * as requestsRepo from "./project-requests.repo";
import * as submissionsRepo from "./project-submissions.repo";

async function resolveStoragePath(path: string | null): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("/")) return path;
  if (!path.includes("/")) return path;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("project-images")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? "";
}

// ---------- Public: list projects ----------
export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const rows = await projectsRepo.listAllProjects();
    return Promise.all(rows.map(async (p) => ({
      id: p.id, name: p.name, description: p.description, location: p.location,
      duration: p.duration, cover_image: p.cover_image, images: p.images,
      pdf_file: p.pdf_file, created_by: p.created_by, status: p.status,
      admin_approval: p.admin_approval,
      cover_url: await resolveStoragePath(p.cover_image).catch(() => ""),
      pdf_url: p.pdf_file ? await resolveStoragePath(p.pdf_file).catch(() => "") : "",
    })));
  } catch (e) {
    console.error("[listProjects] unexpected error:", e);
    return [];
  }
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const p = await projectsRepo.getById(data.id);
      if (!p) return null;
      const cover_url = await resolveStoragePath(p.cover_image).catch(() => "");
      const image_urls = await Promise.all((p.images ?? []).map((path) => resolveStoragePath(path).catch(() => "")));
      const pdf_url = p.pdf_file ? await resolveStoragePath(p.pdf_file).catch(() => "") : "";
      return {
        id: p.id, name: p.name, description: p.description, location: p.location,
        duration: p.duration, cover_image: p.cover_image, images: p.images,
        pdf_file: p.pdf_file, status: p.status,
        cover_url, image_urls, pdf_url,
      };
    } catch (e) {
      console.error("[getProject] unexpected error:", e);
      return null;
    }
  });

// ---------- Public: search requests ----------
export const searchRequests = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) =>
    z.object({ q: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const rows = await requestsRepo.searchRequestsByCompany(data.q);
    const withProj = await Promise.all(rows.map(async (r) => {
      const proj = r.project_id ? await projectsRepo.getById(r.project_id).catch(() => null) : null;
      return { ...r, projects: proj ? { name: proj.name } : null };
    }));
    return withProj;
  });

// ---------- Admin: signed URL for bid PDF ----------
export const getBidPdfUrl = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { path: string }) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");
    if (!isAdmin) {
      const req = await requestsRepo.getRequestByPdfPath(data.path);
      const proj = req?.project_id ? await projectsRepo.getById(req.project_id) : null;
      if (!proj || proj.created_by !== context.userId) throw new Error("غير مصرح بفتح هذا الملف");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("bid-pdfs")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return signed.signedUrl;
  });

// ---------- Admin/Staff: list requests ----------
export const adminListRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const isAdmin = context.roles.includes("admin");
    const rows = await requestsRepo.listAllRequests();
    return Promise.all(rows.map(async (r) => {
      const proj = r.project_id ? await projectsRepo.getById(r.project_id).catch(() => null) : null;
      const canManage = !!proj && proj.created_by === context.userId;
      return {
        ...r,
        email: isAdmin || canManage ? r.email : null,
        projects: proj ? { name: proj.name } : null,
        can_manage: canManage,
      };
    }));
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string; status: string }) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "reviewing", "accepted", "rejected"]),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");
    const req = await requestsRepo.getRequestById(data.id);
    if (!req) throw new Error("الطلب غير موجود");
    if (!isAdmin) {
      const proj = req.project_id ? await projectsRepo.getById(req.project_id) : null;
      if (!proj || proj.created_by !== context.userId) throw new Error("غير مصرح بتغيير حالة هذا الطلب");
    }
    await requestsRepo.updateRequestStatus(data.id, data.status);

    if (req.email) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const proj = req.project_id ? await projectsRepo.getById(req.project_id).catch(() => null) : null;
        const projectName = proj?.name || req.company_name || "طلبك";
        const statusLabels: Record<string, string> = { new: "جديد", reviewing: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض" };
        const statusColors: Record<string, string> = { new: "#2563eb", reviewing: "#d97706", accepted: "#16a34a", rejected: "#dc2626" };
        const label = statusLabels[data.status] ?? data.status;
        const color = statusColors[data.status] ?? "#111";
        const html = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;background:#f9fafb"><div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px;border:1px solid #e5e7eb"><h2 style="margin:0 0 12px">تحديث حالة طلبك</h2><p>مرحباً،</p><p>نودّ إعلامك بأن حالة طلبك المتعلق بمشروع <strong>"${projectName}"</strong> قد تم تحديثها إلى:</p><p style="font-size:18px;font-weight:bold;color:${color};padding:12px;background:#f3f4f6;border-radius:6px;text-align:center">${label}</p><p>شكراً لاستخدامك <strong>منصة العمران</strong>.</p></div></div>`;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ from: "alamran <send@alamran.online>", to: [req.email], subject: "تحديث حالة طلبك في منصة العمران", html }),
          });
        } catch (e) { console.error("Resend send exception", e); }
      }
    }
    return { ok: true };
  });

// ---------- Admin: send test email ----------
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { to: string }) => z.object({ to: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY غير مضبوط في المتغيرات");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "alamran <send@alamran.online>",
        to: [data.to],
        subject: "بريد تجريبي من لوحة الإدارة",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً 👋</h2><p>هذا بريد تجريبي للتأكد من عمل إرسال البريد عبر Resend من نطاق <strong>alamran.online</strong>.</p><p>الوقت: ${new Date().toLocaleString("ar")}</p></div>`,
      }),
    });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`فشل الإرسال (${res.status}): ${bodyText.slice(0, 300)}`);
    let id: string | undefined;
    try { id = JSON.parse(bodyText)?.id; } catch { /* ignore */ }
    return { ok: true, id, to: data.to };
  });

// ---------- Admin: project CRUD ----------
const projectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  location: z.string().trim().min(1).max(300),
  duration: z.string().trim().min(1).max(100),
  cover_image: z.string().trim().min(1).max(500),
  images: z.array(z.string().max(500)).max(20).default([]),
  pdf_file: z.string().trim().max(500).nullable().optional(),
});

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => projectSchema.parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");
    if (!isAdmin) {
      const dup = await projectsRepo.findByOwnerAndName(context.userId, data.name, data.id);
      if (dup) throw new Error("لديك مشروع بنفس الاسم بالفعل");
    }
    if (data.id) {
      const existing = await projectsRepo.getById(data.id);
      if (!existing) throw new Error("المشروع غير موجود");
      if (!isAdmin && existing.created_by !== context.userId) throw new Error("غير مصرح بالتعديل");
      await projectsRepo.updateProject(data.id, {
        name: data.name, description: data.description, location: data.location,
        duration: data.duration, cover_image: data.cover_image, images: data.images,
        pdf_file: data.pdf_file ?? null,
      });
      return { id: data.id };
    }
    const id = await projectsRepo.insertProject({
      name: data.name, description: data.description, location: data.location,
      duration: data.duration, cover_image: data.cover_image, images: data.images,
      pdf_file: data.pdf_file ?? null,
      created_by: context.userId,
      admin_approval: "approved",
    });
    return { id, admin_approval: "approved" };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const isAdmin = context.roles.includes("admin");
    const existing = await projectsRepo.getById(data.id);
    if (!existing) throw new Error("المشروع غير موجود");
    if (!isAdmin && existing.created_by !== context.userId) throw new Error("غير مصرح بالحذف");
    await projectsRepo.deleteProject(data.id);
    return { ok: true };
  });

export const updateProjectStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["active", "delivered", "cancelled"]),
    }).parse(d))
  .handler(async ({ data }) => {
    await projectsRepo.updateProject(data.id, { status: data.status });
    return { ok: true };
  });

// ---------- Admin: employees management (still Supabase auth admin) ----------
export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rolesData } = await supabaseAdmin.from("user_roles").select("user_id,role,created_at");
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const users = usersList?.users ?? [];
    return (rolesData ?? []).map((r) => {
      const u = users.find((x) => x.id === r.user_id);
      return { user_id: r.user_id, email: u?.email ?? "?", role: r.role, created_at: r.created_at };
    });
  });

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async (): Promise<{ id: string; name: string; label: string }[]> => {
    const { db, rowsToObjects } = await import("./db");
    const r = await db.execute(`SELECT id,name,label FROM roles ORDER BY name`);
    return rowsToObjects(r).map((x: any) => ({
      id: String(x.id), name: String(x.name), label: String(x.label),
    }));
  });

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; role_id: string }) =>
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(6).max(72),
      role_id: z.string().uuid(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRow, error: roleLookupErr } = await supabaseAdmin
      .from("roles").select("id,name").eq("id", data.role_id).maybeSingle();
    if (roleLookupErr || !roleRow) throw new Error("الدور غير موجود");
    if (roleRow.name !== "admin" && roleRow.name !== "employee") throw new Error("نوع الدور غير مدعوم");

    const { createAdminAuthClient } = await import("@/lib/admin-auth.server");
    const authAdmin = createAdminAuthClient();
    const { data: created, error: createErr } = await authAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create user");

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles").insert({ user_id: created.user.id, role: roleRow.name as "admin" | "employee" });
    if (roleErr) throw new Error(roleErr.message);

    const { error: profErr } = await supabaseAdmin
      .from("profiles").insert({ id: created.user.id, email: data.email, role_id: data.role_id });
    if (profErr) throw new Error(profErr.message);
    return { id: created.user.id };
  });

export const deleteEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.user_id === userId) throw new Error("لا يمكنك حذف نفسك");
    const { data: myRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const roles = (await getRolesForUser(context.userId)) as ("admin" | "employee")[];
    return roles.sort((a, b) => (a === "admin" ? -1 : b === "admin" ? 1 : a.localeCompare(b)));
  });

export const getMyUserId = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => ({ userId: context.userId }));

// ---------- Contact messages (unchanged Supabase for now) ----------
export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id,name,email,message,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const countContactMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ since: z.string().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    let q = supabase.from("contact_messages").select("id", { count: "exact", head: true });
    if (data.since) q = q.gt("created_at", data.since);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });

export const adminDeleteContactMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { error } = await supabase.from("contact_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Signup first admin (still Supabase auth) ----------
const FIRST_ADMIN_EMAIL = "zydalwadii@gmail.com";
export const signupFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) =>
    z.object({ email: z.string().email().max(255), password: z.string().min(6).max(72) }).parse(d))
  .handler(async ({ data }) => {
    if (data.email.toLowerCase() !== FIRST_ADMIN_EMAIL) throw new Error("التسجيل مسموح فقط للحساب المخصص");
    const { createAdminAuthClient } = await import("@/lib/admin-auth.server");
    const supabaseAdmin = createAdminAuthClient();
    const { data: existingAdmins } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "admin").limit(1);
    if (existingAdmins && existingAdmins.length > 0) throw new Error("يوجد أدمن مسجل بالفعل");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "فشل إنشاء الحساب");
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles").insert({ user_id: created.user.id, role: "admin" });
    if (roleErr) throw new Error(roleErr.message);
    return { ok: true };
  });

// ---------- Public: submit a bid ----------
export const submitBidRequest = createServerFn({ method: "POST" })
  .inputValidator((d: {
    project_id: string; company_name: string; facility_location: string;
    email: string; file_name: string; file_base64: string;
  }) =>
    z.object({
      project_id: z.string().uuid(),
      company_name: z.string().trim().min(1).max(200),
      facility_location: z.string().trim().min(1).max(300),
      email: z.string().trim().email().max(255),
      file_name: z.string().trim().min(1).max(200),
      file_base64: z.string().min(8).max(15_000_000),
    }).parse(d))
  .handler(async ({ data }) => {
    const bytes = Buffer.from(data.file_base64, "base64");
    if (bytes.length === 0) throw new Error("الملف فارغ");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
    if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46 || bytes[4] !== 0x2d) {
      throw new Error("الملف ليس PDF صالحاً");
    }

    // Detect submitter type
    let submitterType: "guest" | "user" = "guest";
    try {
      const { getSessionClaims } = await import("./auth.server");
      const claims = await getSessionClaims();
      if (claims) submitterType = "user";
    } catch { /* ignore */ }

    const proj = await projectsRepo.getById(data.project_id);
    if (!proj) throw new Error("المشروع غير موجود");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safeName = data.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
    const path = `${data.project_id}/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("bid-pdfs")
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw new Error(upErr.message);

    await requestsRepo.insertRequest({
      project_id: data.project_id,
      company_name: data.company_name,
      facility_location: data.facility_location,
      email: data.email,
      pdf_url: path,
      submitter_type: submitterType,
    });
    return { ok: true };
  });

// ---------- Public: submit project suggestion ----------
const imageItemSchema = z.object({
  file_name: z.string().trim().min(1).max(200),
  file_base64: z.string().min(8).max(8_000_000),
  content_type: z.string().regex(/^image\/(png|jpe?g|webp|gif)$/),
});

export const submitProjectSuggestion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(5000),
      location: z.string().trim().min(1).max(300),
      contact_phone: z.string().trim().min(4).max(40).regex(/^[0-9+\-\s()]+$/),
      images: z.array(imageItemSchema).max(8).default([]),
    }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uploadedPaths: string[] = [];
    for (const img of data.images) {
      const bytes = Buffer.from(img.file_base64, "base64");
      if (bytes.length === 0) continue;
      if (bytes.length > 5 * 1024 * 1024) throw new Error("حجم الصورة يجب أن يكون أقل من 5 ميغابايت");
      const safeName = img.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
      const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("project-images")
        .upload(path, bytes, { contentType: img.content_type, upsert: false });
      if (upErr) throw new Error(upErr.message);
      uploadedPaths.push(path);
    }
    await submissionsRepo.insertSubmission({
      name: data.name, description: data.description, location: data.location,
      contact_phone: data.contact_phone, images: uploadedPaths,
    });
    return { ok: true };
  });

// ---------- Admin: submissions ----------
export const adminListSubmissions = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rows = await submissionsRepo.listAllSubmissions();
    return Promise.all(rows.map(async (s) => ({
      ...s,
      image_urls: await Promise.all((s.images ?? []).map(resolveStoragePath)),
    })));
  });

export const approveSubmission = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sub = await submissionsRepo.getSubmissionById(data.id);
    if (!sub) throw new Error("الطلب غير موجود");
    if (sub.status === "approved" && sub.approved_project_id) {
      return { id: sub.approved_project_id };
    }
    const images = sub.images ?? [];
    const cover = images[0] ?? "placeholder.jpg";
    const newId = await projectsRepo.insertProject({
      name: sub.name, description: sub.description, location: sub.location,
      duration: "غير محدد", cover_image: cover, images,
      admin_approval: "approved",
    });
    await submissionsRepo.markSubmissionApproved(data.id, newId);
    return { id: newId };
  });

export const deleteSubmission = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await submissionsRepo.deleteSubmission(data.id);
    return { ok: true };
  });

export const submitProjectWithPaths = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(5000),
      location: z.string().trim().min(1).max(300),
      contact_phone: z.string().trim().min(4).max(40).regex(/^[0-9+\-\s()]+$/),
      image_paths: z.array(z.string().trim().min(1).max(500)).max(8).default([]),
    }).parse(d))
  .handler(async ({ data }) => {
    const safePaths = data.image_paths.filter((p) => p.startsWith("submissions/"));
    await submissionsRepo.insertSubmission({
      name: data.name, description: data.description, location: data.location,
      contact_phone: data.contact_phone, images: safePaths,
    });
    return { ok: true };
  });
