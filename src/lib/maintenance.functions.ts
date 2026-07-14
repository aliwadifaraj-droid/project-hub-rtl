import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const KEY = "maintenance_mode";

export const getMaintenance = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const v = (data?.value ?? {}) as { enabled?: boolean; endAt?: string | null };
  let enabled = !!v.enabled;
  const endAt = v.endAt ?? null;

  // Auto-disable when countdown has ended
  if (enabled && endAt) {
    const endMs = new Date(endAt).getTime();
    if (!Number.isNaN(endMs) && endMs <= Date.now()) {
      enabled = false;
      try {
        const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
        await supabaseAdmin.from("site_settings").upsert({
          key: KEY,
          value: { enabled: false, endAt },
          updated_at: new Date().toISOString(),
        });
      } catch {
        // best-effort; still return disabled to the client
      }
    }
  }

  return { enabled, endAt };
});


export const setMaintenance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled: boolean; endAt: string | null }) => ({
    enabled: !!d?.enabled,
    endAt: d?.endAt ? String(d.endAt) : null,
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");
    const normalizedEndAt = data.enabled && data.endAt && new Date(data.endAt).getTime() <= Date.now()
      ? null
      : data.endAt;
    const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
    const { error } = await supabaseAdmin.from("site_settings").upsert({
      key: KEY,
      value: { enabled: data.enabled, endAt: normalizedEndAt },
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled, endAt: normalizedEndAt };
  });
