import { d as db, r as rowsToObjects } from "./db-D5OYORU-.mjs";
function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
function decode(row) {
  return {
    id: String(row.id),
    work_days: parseJson(row.work_days, null),
    work_start: row.work_start ?? null,
    work_end: row.work_end ?? null,
    off_hours_message: row.off_hours_message ?? null,
    fallback_message: row.fallback_message ?? null,
    allow_escalation: Number(row.allow_escalation ?? 1) === 1,
    show_suggested_questions: Number(row.show_suggested_questions ?? 1) === 1,
    local_enabled: Number(row.local_enabled ?? 1) === 1,
    local_system_prompt: row.local_system_prompt ?? null,
    groq_enabled: Number(row.groq_enabled ?? 1) === 1,
    gemini_system_instruction: row.gemini_system_instruction ?? null,
    gemini_dialect: row.gemini_dialect ?? null,
    gemini_bot_name: row.gemini_bot_name ?? null,
    gemini_blocked_replies: parseJson(row.gemini_blocked_replies, []),
    gemini_scope: row.gemini_scope ?? null,
    created_at: row.created_at ?? void 0,
    updated_at: row.updated_at ?? void 0
  };
}
async function getBotSettingsRow() {
  const r = await db.execute(`SELECT * FROM bot_settings ORDER BY created_at ASC LIMIT 1`);
  const row = rowsToObjects(r)[0];
  return row ? decode(row) : null;
}
async function upsertBotSettings(patch) {
  const existing = await getBotSettingsRow();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const dbPatch = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === void 0) continue;
    if (key === "work_days" || key === "gemini_blocked_replies") dbPatch[key] = JSON.stringify(value);
    else if (typeof value === "boolean") dbPatch[key] = value ? 1 : 0;
    else dbPatch[key] = typeof value === "string" || typeof value === "number" ? value : null;
  }
  if (existing) {
    const sets = Object.keys(dbPatch).map((k) => `${k} = ?`);
    if (!sets.length) return;
    await db.execute(
      `UPDATE bot_settings SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`,
      [...Object.values(dbPatch), now, existing.id]
    );
    return;
  }
  const id = crypto.randomUUID();
  const cols = ["id", "singleton", ...Object.keys(dbPatch), "created_at", "updated_at"];
  const qs = cols.map(() => "?").join(",");
  await db.execute(
    `INSERT INTO bot_settings (${cols.join(",")}) VALUES (${qs})`,
    [id, 1, ...Object.values(dbPatch), now, now]
  );
}
export {
  getBotSettingsRow as g,
  upsertBotSettings as u
};
