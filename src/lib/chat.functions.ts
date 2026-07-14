import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: { role: string }) => r.role) as ("admin" | "employee")[];
}

export const listTeamMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    void userId;


    const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
    const { data: msgs, error } = await supabaseAdmin
      .from("team_messages")
      .select("id,user_id,body,created_at")
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((msgs ?? []).map((m) => m.user_id)));
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const users = usersList?.users ?? [];
    const { data: rolesData } = await supabaseAdmin
      .from("user_roles").select("user_id,role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const meta = new Map<string, { email: string; role: "admin" | "employee" | "user" }>();
    for (const id of ids) {
      const u = users.find((x) => x.id === id);
      const r = rolesData?.find((x) => x.user_id === id);
      meta.set(id, {
        email: u?.email ?? "?",
        role: (r?.role as any) ?? "user",
      });
    }

    return (msgs ?? []).map((m) => ({
      ...m,
      sender_email: meta.get(m.user_id)?.email ?? "?",
      sender_role: meta.get(m.user_id)?.role ?? "user",
    }));
  });

export const sendTeamMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { body: string }) =>
    z.object({ body: z.string().trim().min(1).max(4000) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    void supabase;

    const { error } = await supabase
      .from("team_messages")
      .insert({ user_id: userId, body: data.body });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTeamMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    const isAdmin = roles.includes("admin");
    const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
    const query = supabaseAdmin.from("team_messages").delete().eq("id", data.id);
    // Admins can delete any message; non-admins only their own
    const { error } = isAdmin ? await query : await query.eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const countUnreadTeamMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { since: string | null }) =>
    z.object({ since: z.string().nullable() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    void supabase;
    const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
    let q = supabaseAdmin
      .from("team_messages")
      .select("id", { count: "exact", head: true })
      .neq("user_id", userId);
    if (data.since) q = q.gt("created_at", data.since);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });

export const deleteAllTeamMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.includes("admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
    const { error } = await supabaseAdmin
      .from("team_messages")
      .delete()
      .not("id", "is", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

