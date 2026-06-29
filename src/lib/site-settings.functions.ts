import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getVipMaintenance = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await sb.from("site_settings").select("value").eq("key", "vip_maintenance").maybeSingle();
  const v = (data?.value ?? {}) as { enabled?: boolean };
  return { enabled: !!v.enabled };
});

export const setVipMaintenance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled: boolean }) => ({ enabled: !!d?.enabled }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ key: "vip_maintenance", value: { enabled: data.enabled }, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled };
  });
