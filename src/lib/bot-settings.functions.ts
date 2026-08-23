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

const DEFAULT_DAYS = { sun: true, mon: true, tue: true, wed: true, thu: true, fri: false, sat: false };

export const getBotSettings = createServerFn({ method: "GET" }).handler(async () => {
  const row = await getBotSettingsRow();
  return row ? {
    id: row.id,
    work_days: (row.work_days as any) ?? DEFAULT_DAYS,
    work_start: row.work_start ?? "09:00",
    work_end: row.work_end ?? "17:00",
    off_hours_message: row.off_hours_message ?? "",
    fallback_message: row.fallback_message ?? "",
    allow_escalation: row.allow_escalation,
    show_suggested_questions: row.show_suggested_questions,
    local_enabled: row.local_enabled,
    local_system_prompt: row.local_system_prompt ?? "",
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

// ==== Groq / Gemini persona settings ====
export type GroqSettings = {
  systemInstruction: string;
  dialect: string;
  botName: string;
  blockedReplies: string[];
  scope: string;
  groqEnabled: boolean;
};

export const getGroqSettings = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<GroqSettings> => {
    const row = await getBotSettingsRow();
    return {
      systemInstruction: row?.gemini_system_instruction ?? "",
      dialect: row?.gemini_dialect ?? "",
      botName: row?.gemini_bot_name ?? "",
      blockedReplies: row?.gemini_blocked_replies ?? [],
      scope: row?.gemini_scope ?? "",
      groqEnabled: row?.groq_enabled ?? true,
    };
  });

export const updateGroqSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: GroqSettings) =>
    z.object({
      systemInstruction: z.string().trim().max(4000),
      dialect: z.string().trim().max(100),
      botName: z.string().trim().max(100),
      blockedReplies: z.array(z.string().trim().max(200)).max(50),
      scope: z.string().trim().max(2000),
      groqEnabled: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await upsertBotSettings({
      gemini_system_instruction: data.systemInstruction,
      gemini_dialect: data.dialect,
      gemini_bot_name: data.botName,
      gemini_blocked_replies: data.blockedReplies.filter((s) => s.length > 0),
      gemini_scope: data.scope,
      groq_enabled: data.groqEnabled,
    });
    return { ok: true };
  });
