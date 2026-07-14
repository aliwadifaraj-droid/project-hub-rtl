import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import { getBotSettingsRow, upsertBotSettings } from "./bot-settings.repo";

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
  fallback_message: string;
  allow_escalation: boolean;
  show_suggested_questions: boolean;
  local_enabled: boolean;
  local_system_prompt: string;
};

export const getBotSettings = createServerFn({ method: "GET" }).handler(async () => {
  const row = await getBotSettingsRow();
  return row ? {
    id: row.id,
    work_days: row.work_days,
    work_start: row.work_start,
    work_end: row.work_end,
    off_hours_message: row.off_hours_message,
    fallback_message: row.fallback_message,
    allow_escalation: row.allow_escalation,
    show_suggested_questions: row.show_suggested_questions,
    local_enabled: row.local_enabled,
    local_system_prompt: row.local_system_prompt,
  } as BotSettings : null;
});


export const updateBotSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: {
    work_days: z.infer<typeof daysSchema>;
    work_start: string;
    work_end: string;
    off_hours_message: string;
    fallback_message: string;
    allow_escalation: boolean;
    show_suggested_questions: boolean;
    local_enabled: boolean;
    local_system_prompt: string;
  }) =>
    z.object({
      work_days: daysSchema,
      work_start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      work_end: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      off_hours_message: z.string().trim().min(1).max(1000),
      fallback_message: z.string().trim().min(1).max(1000),
      allow_escalation: z.boolean(),
      show_suggested_questions: z.boolean(),
      local_enabled: z.boolean(),
      local_system_prompt: z.string().trim().max(4000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await upsertBotSettings(data);
    return { ok: true };
  });
