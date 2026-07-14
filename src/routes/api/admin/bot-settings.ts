import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { normalizeSupabaseUrl } from "@/lib/supabase-url";

const bodySchema = z.object({
  systemInstruction: z.string().trim().max(4000),
  dialect: z.string().trim().max(100),
  botName: z.string().trim().max(100),
  blockedReplies: z.array(z.string().trim().max(200)).max(50),
  scope: z.string().trim().max(2000),
  groqEnabled: z.boolean(),
});

async function authorizeAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const url = normalizeSupabaseUrl(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  );
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data } = await supabase.auth.getClaims(token);
  const uid = data?.claims?.sub;
  if (!uid) return null;
  const { data: role } = await supabase
    .from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  if (!role) return null;
  return { uid };
}

export const Route = createFileRoute("/api/admin/bot-settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authorizeAdmin(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
        const { data, error } = await supabaseAdmin
          .from("bot_settings")
          .select("id,gemini_system_instruction,gemini_dialect,gemini_bot_name,gemini_blocked_replies,gemini_scope,groq_enabled")
          .limit(1).maybeSingle();
        if (error) return new Response(error.message, { status: 500 });
        return Response.json({
          systemInstruction: data?.gemini_system_instruction ?? "",
          dialect: data?.gemini_dialect ?? "",
          botName: data?.gemini_bot_name ?? "",
          blockedReplies: data?.gemini_blocked_replies ?? [],
          scope: data?.gemini_scope ?? "",
          groqEnabled: (data as any)?.groq_enabled ?? true,
        });
      },
      POST: async ({ request }) => {
        const auth = await authorizeAdmin(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });
        let body: unknown;
        try { body = await request.json(); }
        catch { return new Response("Invalid JSON", { status: 400 }); }
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const v = parsed.data;
        const patch = {
          gemini_system_instruction: v.systemInstruction,
          gemini_dialect: v.dialect,
          gemini_bot_name: v.botName,
          gemini_blocked_replies: v.blockedReplies.filter((s) => s.length > 0),
          gemini_scope: v.scope,
          groq_enabled: v.groqEnabled,
        };
        const { supabaseAdmin } = await import("@/lib/kill-switch-admin.server");
        const { data: existing } = await supabaseAdmin
          .from("bot_settings").select("id").limit(1).maybeSingle();
        if (existing) {
          const { error } = await supabaseAdmin.from("bot_settings").update(patch).eq("id", existing.id);
          if (error) return new Response(error.message, { status: 500 });
        } else {
          const { error } = await supabaseAdmin.from("bot_settings").insert({ ...patch, singleton: true } as any);
          if (error) return new Response(error.message, { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
