import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getVipMaintenance = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.from("site_settings").select("value").eq("key", "vip_maintenance").maybeSingle();
  if (error) throw new Error(error.message);
  const v = (data?.value ?? {}) as { enabled?: boolean };
  return { enabled: !!v.enabled };
});

export const setVipMaintenance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled: boolean }) => ({ enabled: !!d?.enabled }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "vip_maintenance", value: { enabled: data.enabled }, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled };
  });

export const getHideSupportChat = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.from("site_settings").select("value").eq("key", "hide_support_chat").maybeSingle();
  if (error) throw new Error(error.message);
  const v = (data?.value ?? {}) as { enabled?: boolean };
  return { enabled: !!v.enabled };
});

export const setHideSupportChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled: boolean }) => ({ enabled: !!d?.enabled }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "hide_support_chat", value: { enabled: data.enabled }, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled };
  });
