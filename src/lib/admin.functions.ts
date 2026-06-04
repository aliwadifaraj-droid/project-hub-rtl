import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Public: list projects with resolved cover URLs ----------
export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id,name,description,location,duration,cover_image,images")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const resolved = await Promise.all(
    (data ?? []).map(async (p) => ({
      ...p,
      cover_url: await resolveStoragePath(p.cover_image),
    }))
  );
  return resolved;
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p, error } = await supabaseAdmin
      .from("projects")
      .select("id,name,description,location,duration,cover_image,images")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!p) return null;
    const cover_url = await resolveStoragePath(p.cover_image);
    const image_urls = await Promise.all((p.images ?? []).map(resolveStoragePath));
    return { ...p, cover_url, image_urls };
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
      .select("id,company_name,facility_location,pdf_url,status,created_at,project_id,projects(name)")
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
});

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => projectSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (data.id) {
      const { error } = await supabase.from("projects").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase
      .from("projects")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
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

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; role: string }) =>
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(6).max(72),
      role: z.enum(["admin", "employee"]),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create user");
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role });
    if (roleErr) throw new Error(roleErr.message);
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
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return (data ?? []).map((r) => r.role as "admin" | "employee");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
