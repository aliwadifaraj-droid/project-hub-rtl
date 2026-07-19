import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import * as supportRepo from "./support.repo";
import * as projectsRepo from "./projects.repo";
import { getBotSettingsRow } from "./bot-settings.repo";

const uuid = z.string().uuid();
const CLARIFY_PROMPT = "ممكن توضح مشكلتك أحاول أساعدك؟";
const STAFF_KEYWORDS = ["موظف", "موظفة", "خدمة العملاء", "الدعم", "كلم موظف", "أريد موظف", "اريد موظف", "human", "agent", "support"];

function assertStaff(roles: string[]) {
  if (!roles.includes("admin") && !roles.includes("employee")) throw new Error("Forbidden");
}

function assertAdmin(roles: string[]) {
  if (!roles.includes("admin")) throw new Error("Forbidden");
}

function wantsHuman(text: string) {
  const t = (text ?? "").toLowerCase();
  return STAFF_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function matchQa(qas: Array<{ question: string; answer: string; keywords: string[]; action?: string }>, text: string) {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  for (const q of qas) {
    if (q.question.toLowerCase().includes(t) || t.includes(q.question.toLowerCase())) return q;
    for (const k of q.keywords ?? []) {
      const kk = (k ?? "").toLowerCase().trim();
      if (kk && t.includes(kk)) return q;
    }
  }
  return null;
}

const STATUS_MAP: Record<string, string> = { active: "مفتوح للعروض", delivered: "تم التسليم", cancelled: "ملغي" };

const STOP_WORDS = new Set([
  "مشروع", "المشروع", "مشاريع", "المشاريع", "project", "projects",
  "حالة", "حاله", "وضع", "status", "معلومات", "تفاصيل", "عن", "بخصوص",
  "ايش", "ما", "هو", "هي", "كم", "عدد", "count", "how", "many",
  "في", "من", "الى", "على", "the", "a", "an", "is", "what", "tell", "me", "about",
  "لو", "سمحت", "ممكن", "please",
]);

function normalizeAr(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/[?؟.!،,:;()"'`]/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalizeAr(s).split(" ").filter((w) => w && !STOP_WORDS.has(w));
}

function projectDetails(p: { name: string; status: string; location: string | null; description: string | null; duration: string | null }): string {
  const lines = [
    `📌 ${p.name}`,
    `الحالة: ${STATUS_MAP[p.status] ?? p.status}`,
    `الموقع: ${p.location ?? "-"}`,
  ];
  if (p.duration) lines.push(`المدة: ${p.duration}`);
  if (p.description) lines.push(`الوصف: ${p.description.slice(0, 300)}`);
  return lines.join("\n");
}

function findProjectByQuery(rows: Array<{ name: string; location: string | null }>, query: string): number {
  const qTokens = tokens(query);
  if (!qTokens.length) return -1;
  let bestIdx = -1;
  let bestScore = 0;
  rows.forEach((r, i) => {
    const nameNorm = normalizeAr(r.name);
    const locNorm = normalizeAr(r.location ?? "");
    let score = 0;
    // Full-name substring in either direction
    const qJoined = qTokens.join(" ");
    if (nameNorm && (nameNorm === qJoined || nameNorm.includes(qJoined) || qJoined.includes(nameNorm))) score += 10;
    // Per-token matches
    for (const t of qTokens) {
      if (t.length < 2) continue;
      if (nameNorm.includes(t)) score += 3;
      else if (locNorm && locNorm.includes(t)) score += 1;
    }
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });
  return bestScore >= 3 ? bestIdx : -1;
}

async function answerProjectQuery(text: string): Promise<string | null> {
  const raw = (text ?? "").trim();
  if (!raw) return null;
  const tNorm = normalizeAr(raw);
  const projectKeywords = ["مشروع", "مشاريع", "project"];
  const hasProjectWord = projectKeywords.some((k) => tNorm.includes(normalizeAr(k)));

  const rows = (await projectsRepo.listAllProjects()).filter((p) => p.admin_approval === "approved");
  if (!rows.length) return hasProjectWord ? "لا توجد مشاريع متاحة حالياً." : null;

  // 1) Count queries first
  if (hasProjectWord && (tNorm.includes("كم") || tNorm.includes("عدد") || tNorm.includes("count") || tNorm.includes("how many"))) {
    const active = rows.filter((r) => r.status === "active").length;
    const delivered = rows.filter((r) => r.status === "delivered").length;
    return `عدد المشاريع المعتمدة: ${rows.length}\n• مفتوح للعروض: ${active}\n• تم التسليم: ${delivered}`;
  }

  // 2) City query: "مشاريع [المدينة]"
  const cityRe = /^\s*(?:مشاريع|projects)\s+(?:في|by|in)?\s*(.+)$/i;
  const cm = raw.match(cityRe);
  if (cm && cm[1]) {
    const cityRaw = cm[1].trim();
    const city = normalizeAr(cityRaw);
    if (city && !["المعتمده", "المتاحه", "المفتوحه", "كلها", "الكل"].includes(city)) {
      const matches = rows.filter((r) => {
        const c = normalizeAr(((r as any).city ?? r.location ?? "").toString());
        return c && (c.includes(city) || city.includes(c));
      });
      if (matches.length) {
        return `مشاريع ${cityRaw}:\n\n` + matches.slice(0, 20).map((p) => `• ${p.name} — ${STATUS_MAP[p.status] ?? p.status}`).join("\n");
      }
      // fall through: maybe user asked about specific project name, try name match
    }
  }

  // 3) Specific project match by fuzzy tokens
  const idx = findProjectByQuery(rows, raw);
  if (idx >= 0) {
    return projectDetails(rows[idx]);
  }

  // 4) If not clearly a project query, don't answer
  if (!hasProjectWord) return null;

  // 5) Status-filtered listing
  let filtered = rows;
  if (tNorm.includes("مفتوح") || tNorm.includes("متاح")) filtered = rows.filter((p) => p.status === "active");
  else if (tNorm.includes("مسلم") || tNorm.includes("تسليم") || tNorm.includes("منجز")) filtered = rows.filter((p) => p.status === "delivered");
  else if (tNorm.includes("ملغ")) filtered = rows.filter((p) => p.status === "cancelled");

  if (!filtered.length) return "لا توجد مشاريع مطابقة لطلبك.";
  return "المشاريع المتاحة:\n\n" + filtered.slice(0, 20).map((p) => `• ${p.name} — ${p.location ?? "-"} — ${STATUS_MAP[p.status] ?? p.status}`).join("\n");
}


/** Ask Groq (llama-3.1-8b-instant) as a last-resort fallback. Returns null on any failure. */
async function askGroq(userText: string, opts: {
  systemInstruction?: string | null;
  dialect?: string | null;
  botName?: string | null;
  scope?: string | null;
  blockedReplies?: string[] | null;
}): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const sysParts = [
    opts.systemInstruction?.trim(),
    opts.botName ? `اسمك: ${opts.botName}.` : null,
    opts.dialect ? `اللهجة: ${opts.dialect}.` : null,
    opts.scope ? `نطاق عملك: ${opts.scope}` : null,
  ].filter(Boolean);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 512,
        messages: [
          ...(sysParts.length ? [{ role: "system", content: sysParts.join("\n") }] : []),
          { role: "user", content: userText },
        ],
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const text: string | undefined = j?.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    for (const bad of opts.blockedReplies ?? []) {
      if (bad && text.toLowerCase().includes(bad.toLowerCase())) return null;
    }
    return text;
  } catch {
    return null;
  }
}


const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Returns true when current time (Riyadh, UTC+3) is inside configured work hours. */
function isInWorkHours(settings: { work_days: Record<string, boolean> | null; work_start: string | null; work_end: string | null }): boolean {
  if (!settings.work_days || !settings.work_start || !settings.work_end) return true;
  const now = new Date();
  // Compute in Asia/Riyadh (UTC+3, no DST).
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const localMinutes = (utcMinutes + 3 * 60) % (24 * 60);
  const dayIdx = (now.getUTCDay() + Math.floor((utcMinutes + 3 * 60) / (24 * 60))) % 7;
  const dayKey = DAY_KEYS[dayIdx];
  if (!settings.work_days[dayKey]) return false;
  const [sh, sm] = settings.work_start.split(":").map(Number);
  const [eh, em] = settings.work_end.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return localMinutes >= start && localMinutes <= end;
}

async function getOrCreateVisitorChat(visitorToken: string, visitorName?: string | null) {
  const existing = await supportRepo.getChatByVisitorToken(visitorToken);
  if (existing) return existing;
  const created = await supportRepo.createVisitorChat(visitorToken, visitorName);
  await supportRepo.addSupportMessage(created.id, "bot", "أهلًا بك في دعم العمران! اختر سؤالًا من الأسفل أو اطلب التحدث مع موظف.");
  return created;
}

const ALERT_MARKER = "__ALERT_SENT__";
const BUSY_REPLY = "الموظفين مشغولين حالياً. كيف أقدر أساعدك؟";

async function sendWaitingAlert(chatId: string, visitorName: string | null) {
  const to = process.env.VITE_ALERT_EMAIL || process.env.ALERT_EMAIL;
  const key = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!to || !key) { console.error("alert email/key missing"); return; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: "alamran <send@alamran.online>",
        to: [to],
        subject: "🚨 عميل ينتظر",
        html: `<p><strong>الاسم:</strong> ${visitorName ?? "زائر"}</p><p><strong>customer_id:</strong> ${chatId}</p>`,
      }),
    });
    if (!res.ok) console.error("waiting alert failed", res.status, await res.text());
  } catch (e) { console.error("waiting alert exception", e); }
}

async function agentRepliedSince(chatId: string, sinceIso: string): Promise<boolean> {
  const msgs = await supportRepo.listMessages(chatId, sinceIso);
  return msgs.some((m) => m.sender === "admin");
}

async function recentAlertExists(chatId: string): Promise<boolean> {
  const { db, rowsToObjects } = await import("./db");
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const r = await db.execute(
    `SELECT id FROM support_messages WHERE chat_id = ? AND sender = 'system' AND body = ? AND created_at > ? LIMIT 1`,
    [chatId, ALERT_MARKER, cutoff],
  );
  return rowsToObjects(r).length > 0;
}

function scheduleEscalationWatchers(chatId: string, visitorName: string | null, startIso: string) {
  setTimeout(async () => {
    try {
      if (await agentRepliedSince(chatId, startIso)) return;
      if (await recentAlertExists(chatId)) return;
      await sendWaitingAlert(chatId, visitorName);
      await supportRepo.addSupportMessage(chatId, "system", ALERT_MARKER);
    } catch (e) { console.error("watcher-30s", e); }
  }, 30_000);

  setTimeout(async () => {
    try {
      if (await agentRepliedSince(chatId, startIso)) return;
      await supportRepo.addSupportMessage(chatId, "bot", BUSY_REPLY);
    } catch (e) { console.error("watcher-60s", e); }
  }, 60_000);
}

async function escalateOrOffHours(chatId: string) {
  const settings = await getBotSettingsRow();
  const offHours = settings ? !isInWorkHours(settings) : false;
  if (offHours || settings?.allow_escalation === false) {
    await supportRepo.addSupportMessage(chatId, "bot", settings?.off_hours_message?.trim() || "نحن خارج ساعات العمل حالياً. سنرد عليك في أقرب وقت.");
    return { escalated: false };
  }
  await supportRepo.updateChatStatus(chatId, "escalated");
  await supportRepo.addSupportMessage(chatId, "system", "تم تحويل محادثتك لموظف الدعم. سيتم الرد عليك في أقرب وقت.");
  const chat = await supportRepo.getChatById(chatId);
  scheduleEscalationWatchers(chatId, chat?.visitor_name ?? null, new Date().toISOString());
  return { escalated: true };
}

export const listBotQuestions = createServerFn({ method: "GET" }).handler(async () => {
  const { listActiveForVisitors } = await import("./bot-qa.repo");
  return listActiveForVisitors();
});

export const startVisitorChat = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string; visitorName?: string | null }) =>
    z.object({ visitorToken: uuid, visitorName: z.string().trim().max(80).nullable().optional() }).parse(d))
  .handler(async ({ data }) => getOrCreateVisitorChat(data.visitorToken, data.visitorName));

export const visitorGetMessages = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string; sinceIso?: string | null }) =>
    z.object({ visitorToken: uuid, sinceIso: z.string().nullable().optional() }).parse(d))
  .handler(async ({ data }) => {
    const chat = await supportRepo.getChatByVisitorToken(data.visitorToken);
    if (!chat) return { chat: null, messages: [] };
    return { chat, messages: await supportRepo.listMessages(chat.id, data.sinceIso) };
  });

export const visitorSendMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string; body: string; qaId?: string | number | null }) =>
    z.object({ visitorToken: uuid, body: z.string().trim().min(1).max(2000), qaId: z.preprocess((v) => (v == null || v === "" ? null : String(v)), z.string().nullable()).optional() }).parse(d))
  .handler(async ({ data }) => {
    const chat = await getOrCreateVisitorChat(data.visitorToken);
    await supportRepo.addSupportMessage(chat.id, "visitor", data.body);
    if (chat.status !== "bot") return { ok: true };

    const settings = await getBotSettingsRow();
    const botQa = await import("./bot-qa.repo");
    let triggerEscalate = wantsHuman(data.body);
    let answer: string | null = null;
    if (data.qaId) {
      const qa = await botQa.getQaById(data.qaId);
      triggerEscalate = qa?.action === "escalate";
      answer = qa?.answer ?? null;
    } else if (!triggerEscalate && settings?.local_enabled !== false) {
      const m = matchQa(await botQa.listActiveQa(), data.body);
      triggerEscalate = m?.action === "escalate";
      answer = m?.answer ?? null;
    }
    if (triggerEscalate) {
      await escalateOrOffHours(chat.id);
      return { ok: true };
    }
    const projectAnswer = await answerProjectQuery(data.body);
    let finalAnswer = answer || projectAnswer;
    if (!finalAnswer && settings?.groq_enabled !== false) {
      finalAnswer = await askGroq(data.body, {
        systemInstruction: settings?.gemini_system_instruction,
        dialect: settings?.gemini_dialect,
        botName: settings?.gemini_bot_name,
        scope: settings?.gemini_scope,
        blockedReplies: settings?.gemini_blocked_replies,
      });
    }
    answer = finalAnswer || settings?.fallback_message?.trim() || "عذرًا، لا أملك إجابة على هذا السؤال. يمكنك كتابة \"موظف\" للتحدث مع الدعم.";
    await supportRepo.addSupportMessage(chat.id, "bot", answer);
    return { ok: true };
  });

export const visitorEscalate = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string }) => z.object({ visitorToken: uuid }).parse(d))
  .handler(async ({ data }) => {
    const chat = await supportRepo.getChatByVisitorToken(data.visitorToken);
    if (!chat) throw new Error("جلسة الشات غير موجودة");
    return { ok: true, ...(await escalateOrOffHours(chat.id)) };
  });

export const visitorEndSession = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string }) => z.object({ visitorToken: uuid }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.deleteVisitorChat(data.visitorToken);
    return { ok: true };
  });

export const adminListChats = createServerFn({ method: "GET" }).middleware([requireAuth]).handler(async ({ context }) => {
  assertStaff(context.roles);
  return supportRepo.listSupportChats();
});

export const adminListChatMessages = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaff(context.roles);
    return supportRepo.listMessages(data.chatId);
  });

export const adminReplyChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; body: string }) => z.object({ chatId: uuid, body: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaff(context.roles);
    await supportRepo.addSupportMessage(data.chatId, "admin", data.body);
    await supportRepo.updateChatStatus(data.chatId, "escalated");
    return { ok: true };
  });

export const adminCloseChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaff(context.roles);
    await supportRepo.updateChatStatus(data.chatId, "closed");
    return { ok: true };
  });

export const adminDeleteAllSupport = createServerFn({ method: "POST" }).middleware([requireAuth]).handler(async ({ context }) => {
  assertAdmin(context.roles);
  await supportRepo.deleteAllSupport();
  return { ok: true };
});

export const adminListBotQa = createServerFn({ method: "GET" }).middleware([requireAuth]).handler(async ({ context }) => {
  assertAdmin(context.roles);
  const { listAllQa } = await import("./bot-qa.repo");
  return listAllQa();
});

export const adminUpsertBotQa = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id?: string | null; question: string; answer: string; keywords: string[]; is_active: boolean; sort_order: number; action?: "none" | "escalate" }) =>
    z.object({ id: z.string().uuid().nullable().optional(), question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(4000), keywords: z.array(z.string().trim().max(60)).max(30), is_active: z.boolean(), sort_order: z.number().int().min(0).max(9999), action: z.enum(["none", "escalate"]).default("none") }).parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.roles);
    const { upsertQa } = await import("./bot-qa.repo");
    await upsertQa({ ...data, id: data.id ?? null, action: data.action ?? "none" });
    return { ok: true };
  });

export const adminDeleteBotQa = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    assertAdmin(context.roles);
    const { deleteQa } = await import("./bot-qa.repo");
    await deleteQa(data.id);
    return { ok: true };
  });

export const adminCountOpenSupportChats = createServerFn({ method: "GET" }).middleware([requireAuth]).handler(async ({ context }) => {
  assertStaff(context.roles);
  return { count: await supportRepo.countEscalatedChats() };
});