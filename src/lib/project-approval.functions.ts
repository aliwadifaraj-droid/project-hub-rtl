import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!data?.some((r: { role: string }) => r.role === "admin")) {
    throw new Error("Forbidden");
  }
}

export const listPendingProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("id,name,description,location,duration,cover_image,created_by,created_at")
      .eq("admin_approval", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // resolve creator emails
    const ids = Array.from(new Set((data ?? []).map((p) => p.created_by).filter(Boolean) as string[]));
    const emails = new Map<string, string>();
    if (ids.length > 0) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      (users?.users ?? []).forEach((u) => {
        if (ids.includes(u.id) && u.email) emails.set(u.id, u.email);
      });
    }
    return (data ?? []).map((p) => ({
      ...p,
      creator_email: p.created_by ? emails.get(p.created_by) ?? "" : "",
    }));
  });

export const countPendingProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: myRoles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (!myRoles?.some((r) => r.role === "admin")) return 0;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("admin_approval", "pending");
    return count ?? 0;
  });

export const approveProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("projects")
      .update({ admin_approval: "approved" })
      .eq("id", data.id)
      .select("id,name,created_by")
      .single();
    if (error) throw new Error(error.message);

    if (row.created_by) {
      await supabaseAdmin.from("notifications").insert({
        user_id: row.created_by,
        title: "تمت الموافقة على مشروعك",
        body: `تمت الموافقة على المشروع: ${row.name}`,
        link: `/projects/${row.id}`,
      });
    }
    return { ok: true };
  });

export const rejectProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("projects")
      .update({ admin_approval: "rejected" })
      .eq("id", data.id)
      .select("id,name,created_by")
      .single();
    if (error) throw new Error(error.message);

    if (row.created_by) {
      await supabaseAdmin.from("notifications").insert({
        user_id: row.created_by,
        title: "تم رفض مشروعك",
        body: data.reason ? `${row.name}: ${data.reason}` : `تم رفض المشروع: ${row.name}`,
      });
    }
    return { ok: true };
  });
