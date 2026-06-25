import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Public: list projects with resolved cover URLs ----------
export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("id,name,description,location,duration,cover_image,images,pdf_file")
      .eq("admin_approval", "approved")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[listProjects] supabase error:", error.message);
      return [];
    }
    const resolved = await Promise.all(
      (data ?? []).map(async (p) => ({
        ...p,
        cover_url: await resolveStoragePath(p.cover_image).catch(() => ""),
        pdf_url: p.pdf_file ? await resolveStoragePath(p.pdf_file).catch(() => "") : "",
      }))
    );
    return resolved;
  } catch (e) {
    console.error("[listProjects] unexpected error:", e);
    return [];
  }
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: p, error } = await supabaseAdmin
        .from("projects")
        .select("id,name,description,location,duration,cover_image,images,pdf_file")
        .eq("id", data.id)
        .maybeSingle();
      if (error) {
        console.error("[getProject] supabase error:", error.message);
        return null;
      }
      if (!p) return null;
      const cover_url = await resolveStoragePath(p.cover_image).catch(() => "");
      const image_urls = await Promise.all((p.images ?? []).map((path) => resolveStoragePath(path).catch(() => "")));
      const pdf_url = p.pdf_file ? await resolveStoragePath(p.pdf_file).catch(() => "") : "";
      return { ...p, cover_url, image_urls, pdf_url };
    } catch (e) {
      console.error("[getProject] unexpected error:", e);
      return null;
    }
  });

async function resolveStoragePath(path: string | null): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("/")) return path;
  // seed keys
  if (!path.includes("/")) return path;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("project-images")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? "";
}

// ---------- Public: search project requests by company name ----------
export const searchRequests = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) =>
    z.object({ q: z.string().trim().min(1).max(200) }).parse(d)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("project_requests")
      .select("id,company_name,facility_location,status,created_at,project_id,projects(name)")
      .ilike("company_name", `%${data.q}%`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- Admin: signed URL for the bid PDF ----------
export const getBidPdfUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { path: string }) =>
    z.object({ path: z.string().min(1).max(500) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // ensure user has staff role
    const { data: roles } = await supabase.from("user_roles").select("role");
    if (!roles || roles.length === 0) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("bid-pdfs")
      .createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return signed.signedUrl;
  });

// ---------- Admin/Staff: list all requests ----------
export const adminListRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("project_requests")
      .select("id,company_name,facility_location,pdf_url,status,created_at,project_id,submitter_type,projects(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "reviewing", "accepted", "rejected"]),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("project_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Notify the customer via email when their request is accepted ("مقبول").
    if (data.status === "accepted") {
      try {
        const { data: row } = await supabase
          .from("project_requests")
          .select("id,email,company_name")
          .eq("id", data.id)
          .maybeSingle();

        if (row?.email) {
          const { getRequest } = await import("@tanstack/react-start/server");
          const req = getRequest();
          const authHeader = req?.headers.get("authorization") ?? "";
          const origin = new URL(req!.url).origin;
          await fetch(`${origin}/lovable/email/transactional/send`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: authHeader,
            },
            body: JSON.stringify({
              templateName: "request-accepted",
              recipientEmail: row.email,
              idempotencyKey: `request-accepted:${row.id}`,
              templateData: {
                requestId: row.id,
                companyName: row.company_name ?? "",
              },
            }),
          }).catch((e) => console.error("send email failed", e));
        }
      } catch (e) {
        console.error("accepted email trigger failed", e);
      }
    }

    return { ok: true };
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => projectSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = !!myRoles?.some((r) => r.role === "admin");

    if (data.id) {
      // only admins can edit existing projects
      if (!isAdmin) throw new Error("غير مصرح بالتعديل");
      const { error } = await supabase.from("projects").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const insertRow = {
      ...data,
      created_by: userId,
      admin_approval: "approved",
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("projects")
      .insert(insertRow)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, admin_approval: insertRow.admin_approval };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: employees management ----------
export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // verify admin via own roles
    const { data: myRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rolesData } = await supabaseAdmin
      .from("user_roles")
      .select("user_id,role,created_at");
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const users = usersList?.users ?? [];
    return (rolesData ?? []).map((r) => {
      const u = users.find((x) => x.id === r.user_id);
      return {
        user_id: r.user_id,
        email: u?.email ?? "?",
        role: r.role,
        created_at: r.created_at,
      };
    });
  });

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("roles")
      .select("id,name,label")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; role_id: string }) =>
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(6).max(72),
      role_id: z.string().uuid(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRow, error: roleLookupErr } = await supabaseAdmin
      .from("roles").select("id,name").eq("id", data.role_id).maybeSingle();
    if (roleLookupErr || !roleRow) throw new Error("الدور غير موجود");
    if (roleRow.name !== "admin" && roleRow.name !== "employee") {
      throw new Error("نوع الدور غير مدعوم");
    }

    const { createAdminAuthClient } = await import("@/lib/admin-auth.server");
    const authAdmin = createAdminAuthClient();
    const { data: created, error: createErr } = await authAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create user");

    // Keep legacy user_roles in sync so existing has_role gates keep working
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: roleRow.name as "admin" | "employee" });
    if (roleErr) throw new Error(roleErr.message);

    // New profiles table (with role_id)
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .insert({ id: created.user.id, email: data.email, role_id: data.role_id });
    if (profErr) throw new Error(profErr.message);

    return { id: created.user.id };
  });

export const deleteEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.user_id === userId) throw new Error("لا يمكنك حذف نفسك");
    const { data: myRoles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("role", { ascending: true });
    if (error) throw new Error(error.message);
    const roles = (data ?? []).map((r) => r.role as "admin" | "employee");
    return roles.sort((a, b) => (a === "admin" ? -1 : b === "admin" ? 1 : a.localeCompare(b)));
  });

// ---------- Admin/Staff: list contact messages ----------
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

export const adminDeleteContactMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { error } = await supabase.from("contact_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Public: signup (first admin only) ----------
const FIRST_ADMIN_EMAIL = "zydalwadii@gmail.com";

export const signupFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) =>
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(6).max(72),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    if (data.email.toLowerCase() !== FIRST_ADMIN_EMAIL) {
      throw new Error("التسجيل مسموح فقط للحساب المخصص");
    }
    const { createAdminAuthClient } = await import("@/lib/admin-auth.server");
    const supabaseAdmin = createAdminAuthClient();
    // check if any admin already exists
    const { data: existingAdmins } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "admin").limit(1);
    if (existingAdmins && existingAdmins.length > 0) {
      throw new Error("يوجد أدمن مسجل بالفعل");
    }
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "فشل إنشاء الحساب");
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles").insert({ user_id: created.user.id, role: "admin" });
    if (roleErr) throw new Error(roleErr.message);
    return { ok: true };
  });

// ---------- Public: submit a bid (server-validated PDF upload) ----------
export const submitBidRequest = createServerFn({ method: "POST" })
  .inputValidator((d: {
    project_id: string;
    company_name: string;
    facility_location: string;
    email: string;
    file_name: string;
    file_base64: string;
  }) =>
    z.object({
      project_id: z.string().uuid(),
      company_name: z.string().trim().min(1).max(200),
      facility_location: z.string().trim().min(1).max(300),
      email: z.string().trim().email().max(255),
      file_name: z.string().trim().min(1).max(200),
      file_base64: z.string().min(8).max(15_000_000), // ~10MB base64
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const bytes = Buffer.from(data.file_base64, "base64");
    if (bytes.length === 0) throw new Error("الملف فارغ");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
    // PDF magic bytes: %PDF-
    if (
      bytes[0] !== 0x25 || bytes[1] !== 0x50 ||
      bytes[2] !== 0x44 || bytes[3] !== 0x46 || bytes[4] !== 0x2d
    ) {
      throw new Error("الملف ليس PDF صالحاً");
    }

    // Detect submitter type from Authorization header
    let submitterType: "guest" | "user" = "guest";
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const authHeader = getRequestHeader("authorization");
      const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
      if (token) {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } }
        );
        const { data: u } = await sb.auth.getUser(token);
        if (u?.user) submitterType = "user";
      }
    } catch {
      // ignore — default to guest
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // verify project exists
    const { data: proj } = await supabaseAdmin
      .from("projects").select("id").eq("id", data.project_id).maybeSingle();
    if (!proj) throw new Error("المشروع غير موجود");

    const safeName = data.file_name.replace(/[^\w.\-]/g, "_").slice(-100);
    const path = `${data.project_id}/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(".pdf") ? "" : ".pdf"}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("bid-pdfs")
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { error: insErr } = await supabaseAdmin.from("project_requests").insert({
      project_id: data.project_id,
      company_name: data.company_name,
      facility_location: data.facility_location,
      email: data.email,
      pdf_url: path,
      submitter_type: submitterType,
    });
    if (insErr) throw new Error(insErr.message);

    return { ok: true };
  });

// ---------- Public: submit a new project suggestion ----------
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
    }).parse(d)
  )
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

    const { error } = await supabaseAdmin.from("project_submissions").insert({
      name: data.name,
      description: data.description,
      location: data.location,
      contact_phone: data.contact_phone,
      images: uploadedPaths,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin only: list project submissions ----------
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r: { role: string }) => r.role === "admin")) throw new Error("Forbidden");
}

export const adminListSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("project_submissions")
      .select("id,name,description,location,contact_phone,images,status,created_at,approved_project_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = await Promise.all(
      (data ?? []).map(async (s) => ({
        ...s,
        image_urls: await Promise.all((s.images ?? []).map(resolveStoragePath)),
      }))
    );
    return rows;
  });

export const approveSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sub, error: sErr } = await supabaseAdmin
      .from("project_submissions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!sub) throw new Error("الطلب غير موجود");
    if (sub.status === "approved" && sub.approved_project_id) {
      return { id: sub.approved_project_id };
    }

    const images: string[] = sub.images ?? [];
    const cover = images[0] ?? "placeholder.jpg";

    const { data: created, error: insErr } = await supabaseAdmin
      .from("projects")
      .insert({
        name: sub.name,
        description: sub.description,
        location: sub.location,
        duration: "غير محدد",
        cover_image: cover,
        images,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    await supabaseAdmin
      .from("project_submissions")
      .update({ status: "approved", approved_project_id: created.id })
      .eq("id", data.id);

    return { id: created.id };
  });

export const deleteSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("project_submissions")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Public: submit project with already-uploaded image paths ----------
export const submitProjectWithPaths = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(5000),
      location: z.string().trim().min(1).max(300),
      contact_phone: z.string().trim().min(4).max(40).regex(/^[0-9+\-\s()]+$/),
      image_paths: z.array(z.string().trim().min(1).max(500)).max(8).default([]),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const safePaths = data.image_paths.filter((p) => p.startsWith("submissions/"));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_submissions").insert({
      name: data.name,
      description: data.description,
      location: data.location,
      contact_phone: data.contact_phone,
      images: safePaths,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
