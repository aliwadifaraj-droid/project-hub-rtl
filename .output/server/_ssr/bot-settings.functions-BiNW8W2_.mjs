import { c as createServerRpc } from "./createServerRpc-DYLDSQ_Q.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { a as requireAdmin } from "./auth-middleware.server-B9hAjfqi.mjs";
import { g as getBotSettingsRow, u as upsertBotSettings } from "./bot-settings.repo-71vbkXe-.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import { o as objectType, b as booleanType, s as stringType, a as arrayType } from "../_libs/zod.mjs";

import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";





import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";

import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "./db-D5OYORU-.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

const daysSchema = objectType({
  sun: booleanType(),
  mon: booleanType(),
  tue: booleanType(),
  wed: booleanType(),
  thu: booleanType(),
  fri: booleanType(),
  sat: booleanType()
});
const DEFAULT_DAYS = {
  sun: true,
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: false,
  sat: false
};
const getBotSettings_createServerFn_handler = createServerRpc({
  id: "0e113e277043fca586d7600364ab04300dab4100b6547e1d76f77517b24c6256",
  name: "getBotSettings",
  filename: "src/lib/bot-settings.functions.ts"
}, (opts) => getBotSettings.__executeServer(opts));
const getBotSettings = createServerFn({
  method: "GET"
}).handler(getBotSettings_createServerFn_handler, async () => {
  const row = await getBotSettingsRow();
  return row ? {
    id: row.id,
    work_days: row.work_days ?? DEFAULT_DAYS,
    work_start: row.work_start ?? "09:00",
    work_end: row.work_end ?? "17:00",
    off_hours_message: row.off_hours_message ?? "",
    fallback_message: row.fallback_message ?? "",
    allow_escalation: row.allow_escalation,
    show_suggested_questions: row.show_suggested_questions,
    local_enabled: row.local_enabled,
    local_system_prompt: row.local_system_prompt ?? ""
  } : null;
});
const updateBotSettings_createServerFn_handler = createServerRpc({
  id: "4f8dc13b790c5f24f39e1a5cc0b8247f23005360e7a43f8aeddfe521ba17d07d",
  name: "updateBotSettings",
  filename: "src/lib/bot-settings.functions.ts"
}, (opts) => updateBotSettings.__executeServer(opts));
const updateBotSettings = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  work_days: daysSchema,
  work_start: stringType().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  work_end: stringType().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  off_hours_message: stringType().trim().min(1).max(1e3),
  fallback_message: stringType().trim().min(1).max(1e3),
  allow_escalation: booleanType(),
  show_suggested_questions: booleanType(),
  local_enabled: booleanType(),
  local_system_prompt: stringType().trim().max(4e3)
}).parse(d)).handler(updateBotSettings_createServerFn_handler, async ({
  data
}) => {
  await upsertBotSettings(data);
  return {
    ok: true
  };
});
const getGroqSettings_createServerFn_handler = createServerRpc({
  id: "c8a82179ef36b1b5cbb6f0269981709217c19604b4627b7c6d34db26c0a63f2d",
  name: "getGroqSettings",
  filename: "src/lib/bot-settings.functions.ts"
}, (opts) => getGroqSettings.__executeServer(opts));
const getGroqSettings = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(getGroqSettings_createServerFn_handler, async () => {
  const row = await getBotSettingsRow();
  return {
    systemInstruction: row?.gemini_system_instruction ?? "",
    dialect: row?.gemini_dialect ?? "",
    botName: row?.gemini_bot_name ?? "",
    blockedReplies: row?.gemini_blocked_replies ?? [],
    scope: row?.gemini_scope ?? "",
    groqEnabled: row?.groq_enabled ?? true
  };
});
const updateGroqSettings_createServerFn_handler = createServerRpc({
  id: "8816c8285bd6ce60443893f0f50a1aa744622b22fe2763515a8c9d4144b3ea33",
  name: "updateGroqSettings",
  filename: "src/lib/bot-settings.functions.ts"
}, (opts) => updateGroqSettings.__executeServer(opts));
const updateGroqSettings = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  systemInstruction: stringType().trim().max(4e3),
  dialect: stringType().trim().max(100),
  botName: stringType().trim().max(100),
  blockedReplies: arrayType(stringType().trim().max(200)).max(50),
  scope: stringType().trim().max(2e3),
  groqEnabled: booleanType()
}).parse(d)).handler(updateGroqSettings_createServerFn_handler, async ({
  data
}) => {
  await upsertBotSettings({
    gemini_system_instruction: data.systemInstruction,
    gemini_dialect: data.dialect,
    gemini_bot_name: data.botName,
    gemini_blocked_replies: data.blockedReplies.filter((s) => s.length > 0),
    gemini_scope: data.scope,
    groq_enabled: data.groqEnabled
  });
  return {
    ok: true
  };
});
export {
  getBotSettings_createServerFn_handler,
  getGroqSettings_createServerFn_handler,
  updateBotSettings_createServerFn_handler,
  updateGroqSettings_createServerFn_handler
};
