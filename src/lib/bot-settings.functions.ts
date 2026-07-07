import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const daysSchema = z.object({
  sun: z.boolean(), mon: z.boolean(), tue: z.boolean(),
  wed: z.boolean(), thu: z.boolean(), fri: z.boolean(), sat: z.boolean(),
});

export type BotSettings = {
  id: string;
  work_days: z.infer<typeof daysSchema>;
  work_start: string;
  work_end: string;
  off_hours_message: string;
  allow_escalation: boolean;
  show_suggested_questions: boolean;
};

export const getBotSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("bot_settings")
    .select("id,work_days,work_start,work_end,off_hours_message,allow_escalation,show_suggested_questions")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as BotSettings | null;
});


export const updateBotSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    work_days: z.infer<typeof daysSchema>;
    work_start: string;
    work_end: string;
    off_hours_message: string;
    allow_escalation: boolean;
  }) =>
    z.object({
      work_days: daysSchema,
      work_start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      work_end: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      off_hours_message: z.string().trim().min(1).max(1000),
      allow_escalation: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: adminRow } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!adminRow) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("bot_settings").select("id").limit(1).maybeSingle();
    if (existing) {
      const { error } = await supabaseAdmin.from("bot_settings").update(data).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("bot_settings").insert({ ...data, singleton: true });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
