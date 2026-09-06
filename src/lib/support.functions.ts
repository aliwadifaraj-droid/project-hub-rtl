import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import * as supportRepo from "./support.repo";
import * as projectsRepo from "./projects.repo";
import { getBotSettingsRow } from "./bot-settings.repo";
import { cached, cacheKeys, TTL_CHAT, invalidateChat, invalidate } from "./cache";
import * as offersRepo from "./offers.repo";
import {
  ALERT_MARKER,
  PRIORITY_ALERT_MARKER,
  ESCALATION_START_MARKER,
  recentAlertExists,
  sendWaitingAlert,
  checkEscalationTimers,
} from "./escalation-jobs";


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

const STATUS_BADGE: Record<string, string> = {
  active: `<span style="background:#ffc107;color:white;font-weight:bold;padding:10px 20px;border-radius:8px;display:inline-block">🟡 مفتوح للعروض</span>`,
  delivered: `<span style="background:#28a745;color:white;font-weight:bold;padding:10px 20px;border-radius:8px;display:inline-block">✅ تم التسليم</span>`,
  cancelled: `<span style="background:#dc3545;color:white;font-weight:bold;padding:10px 20px;border-radius:8px;display:inline-block">❌ ملغي</span>`,
};

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
    `الحالة: ${STATUS_BADGE[p.status] ?? p.status}`,
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
    const qJoined = qTokens.join(" ");
    if (nameNorm && (nameNorm === qJoined || nameNorm.includes(qJoined) || qJoined.includes(nameNorm))) score += 10;
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

  if (hasProjectWord && (tNorm.includes("كم") || tNorm.includes("عدد") || tNorm.includes("count") || tNorm.includes("how many"))) {
    const active = rows.filter((r) => r.status === "active").length;
    const delivered = rows.filter((r) => r.status === "delivered").length;
    return `عدد المشاريع المعتمدة: ${rows.length}\n• مفتوح للعروض: ${active}\n• تم التسليم: ${delivered}`;
  }

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
    }
  }

  const idx = findProjectByQuery(rows, raw);
  if (idx >= 0) {
    return projectDetails(rows[idx]);
  }

  if (!hasProjectWord) return null;

  let filtered = rows;
  if (tNorm.includes("مفتوح") || tNorm.includes("متاح")) filtered = rows.filter((p) => p.status === "active");
  else if (tNorm.includes("مسلم") || tNorm.includes("تسليم") || tNorm.includes("منجز")) filtered = rows.filter((p) => p.status === "delivered");
  else if (tNorm.includes("ملغ")) filtered = rows.filter((p) => p.status === "cancelled");

  if (!filtered.length) return "لا توجد مشاريع مطابقة لطلبك.";
  return "المشاريع المتاحة:\n\n" + filtered.slice(0, 20).map((p) => `• ${p.name} — ${p.location ?? "-"} — ${STATUS_MAP[p.status] ?? p.status}`).join("\n");
}

const ASK_REQUEST_PROMPT = "للاستعلام عن حالة طلبكم، أرسل البريد الإلكتروني أو اسم الشركة المستخدم في الطلب 🙏";
const REQUEST_NOT_FOUND = "لم يتم العثور على طلب";
const OFFER_PENDING_REPLY = "تم ارسال طلبكم وبانتظار موافقة الادارة";


const REQUEST_STATUS_REPLY: Record<string, string> = {
  new: "🆕 تم استلام طلبكم وشكرا لثقتكم بنا ✅",
  reviewing: "🆕 طلبكم قيد المراجعة حالياً",
  accepted: "🟠 تم قبول طلبكم 🎉",
  rejected: "❌ نأسف تم رفض طلبكم. يمكنكم مراسلتنا عبر بوابة تواصل بنا لمعرفة التفاصيل 🙏",
};

const REQUEST_STATUS_LABEL: Record<string, string> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
};

const REQUEST_KEYWORDS = ["طلبي", "طلبنا", "حالة طلب", "حالة الطلب", "استعلام عن طلب", "وين طلبي", "وش صار على طلبي", "متابعة طلب", "request status", "my request"];

function asksAboutRequest(text: string): boolean {
  const t = normalizeAr(text);
  return REQUEST_KEYWORDS.some((k) => t.includes(normalizeAr(k)));
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;

async function answerRequestStatus(query: string): Promise<string | null> {
  const raw = (query ?? "").trim();
  if (!raw) return null;
  const repo = await import("./project-requests.repo");
  const emailMatch = raw.match(EMAIL_RE);
  const name = raw.replace(/(حالة|طلب|طلبي|الطلب|شركة|شركه)/g, " ").replace(/\s+/g, " ").trim() || raw;

  let rows = emailMatch ? await repo.searchRequestsByEmail(emailMatch[0]) : [];
  if (!rows.length && !emailMatch) rows = await repo.searchRequestsByCompany(name);
  if (rows.length) {
    const rowsToShow = rows.slice(0, 5);
    const projectNames = new Map<string, string>();
    await Promise.all(
      rowsToShow
        .filter((r) => r.project_id)
        .map(async (r) => {
          if (!projectNames.has(r.project_id!)) {
            const p = await projectsRepo.getById(r.project_id!).catch(() => null);
            projectNames.set(r.project_id!, p?.name ?? "—");
          }
        }),
    );
    return rowsToShow
      .map((r) => {
        const label = r.status==='new' ? `<span style="background:#17a2b8;color:white;font-weight:bold;padding:8px 16px;border-radius:20px;display:inline-block;font-size:14px">📥 جديد</span>` : r.status==='reviewing' ? `<span style="background:#fd7e14;color:white;font-weight:bold;padding:8px 16px;border-radius:20px;display:inline-block;font-size:14px">⏳ قيد المراجعة</span>` : r.status==='accepted' ? `<span style="background:#28a745;color:white;font-weight:bold;padding:8px 16px;border-radius:50px;display:inline-block;font-size:14px">● ✅ مقبول</span>` : r.status==='rejected' ? `<span style="background:#dc3545;color:white;font-weight:bold;padding:12px 24px;border-radius:8px;display:inline-block;font-size:16px">❌ مرفوض</span>` : r.status;
        const projName = r.project_id ? projectNames.get(r.project_id) ?? "—" : "—";
        const lines = [`📄 ${r.company_name ?? "طلب"}`, `المشروع: ${projName}`, `حالة الطلب: ${label}`];
        if (r.note && r.note.trim()) lines.push(`الملاحظة: ${r.note.trim()}`);
        else lines.push(REQUEST_STATUS_REPLY[r.status] ?? REQUEST_STATUS_REPLY.new);
        return lines.join("\n");
      })
      .join("\n\n");
  }

  let offers = emailMatch ? await offersRepo.searchOffersByEmail(emailMatch[0]) : [];
  if (!offers.length && !emailMatch) offers = await offersRepo.searchOffersByCompany(name);
  if (offers.length) return OFFER_PENDING_REPLY;

  return REQUEST_NOT_FOUND;
}


export const OFFER_FLOW_MARKER = "__OFFER_FLOW__";

const OFFER_KEYWORDS = [
  "كيف اقدم عرض سعر", "كيف أقدم عرض سعر", "عرض سعر", "تقديم عرض", "اقدم عرض", "أقدم عرض",
  "ارفع عرض", "أرفع عرض", "تسعير", "quote", "price offer", "submit offer",
];

const OFFER_TERMS = [
  "لتقديم عرض سعر، وافق على الشروط أولاً:",
  "",
  "1) العرض يجب أن يكون بصيغة PDF واضحة ومختومة.",
  "2) السعر المقدم نهائي وساري لمدة 30 يوماً على الأقل.",
  "3) الالتزام بمدة تنفيذ المشروع المعلنة في تفاصيل المشروع.",
  "4) صحة البيانات (اسم الشركة والبريد الإلكتروني) مسؤولية مقدّم العرض.",
  "5) تقديم العرض لا يعني قبوله، وسيتم إشعاركم بأي تحديث.",
].join("\n");

function asksAboutOffer(text: string): boolean {
  const t = normalizeAr(text);
  return OFFER_KEYWORDS.some((k) => t.includes(normalizeAr(k)));
}


export const VIP_FLOW_MARKER = "__VIP_FLOW__";

const VIP_KEYWORDS = [
  "اشترك", "اشتراك", "vip", "ابغى اشترك", "اريد اشتراك", "اريد اشترك",
  "ابغى اشتراك", "الاشتراك", "اشتراك vip", "باقة", "باقه", "العملاء المميزون",
  "مميز", "اشتراك مميز", "اشترك vip",
];

const VIP_PLANS_TEXT = [
  "باقات اشتراك VIP المتاحة:",
  "",
  "باقة 100 ريال — 30 يوم",
  "تستقبل مشاريع خاصة عبر الإيميل بلا منافس + دعم فني VIP",
  "",
  "باقة 200 ريال — 60 يوم",
  "تستقبل مشاريع خاصة عبر الإيميل بلا منافس + دعم فني VIP",
  "",
  "باقة 300 ريال — 90 يوم",
  "تستقبل مشاريع خاصة عبر الإيميل بلا منافس + دعم فني VIP",
  "",
  "بيانات التحويل البنكي:",
  "البنك الأهلي — IBAN: SA35 1000 0065 5000 4711 0807",
  "",
  "اختر الباقة التي تناسبك، ثم عبّئ بياناتك وارفع صورة الإيصال.",
].join("\n");

function asksAboutVip(text: string): boolean {
  const t = normalizeAr(text);
  return VIP_KEYWORDS.some((k) => t.includes(normalizeAr(k)));
}




const CEREBRAS_MODEL = "qwen-3-32b";
const CEREBRAS_ENDPOINT = "https://api.cerebras.ai/v1/chat/completions";

async function askCerebras(userText: string, opts: {
  systemInstruction?: string | null;
  dialect?: string | null;
  botName?: string | null;
  scope?: string | null;
  blockedReplies?: string[] | null;
}): Promise<string | null> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    console.log("[cerebras] CEREBRAS_API_KEY not set — skipping Cerebras call");
    return null;
  }
  const sysParts = [
    opts.systemInstruction?.trim(),
    opts.botName ? `اسمك: ${opts.botName}.` : null,
    opts.dialect ? `اللهجة: ${opts.dialect}.` : null,
    opts.scope ? `نطاق عملك: ${opts.scope}` : null,
  ].filter(Boolean);
  console.log("[cerebras] calling Cerebras for:", userText.slice(0, 80));
  try {
    const res = await fetch(CEREBRAS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        temperature: 0.4,
        max_tokens: 512,
        messages: [
          ...(sysParts.length ? [{ role: "system", content: sysParts.join("\n") }] : []),
          { role: "user", content: userText },
        ],
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[cerebras] API returned non-OK status:", res.status, errBody.slice(0, 200));
      return null;
    }
    const j: any = await res.json();
    const text: string | undefined = j?.choices?.[0]?.message?.content?.trim();
    console.log("[cerebras] response received:", text?.slice(0, 80) ?? "(empty)");
    if (!text) return null;
    for (const bad of opts.blockedReplies ?? []) {
      if (bad && text.toLowerCase().includes(bad.toLowerCase())) {
        console.log("[cerebras] response blocked by blockedReplies filter");
        return null;
      }
    }
    return text;
  } catch (err) {
    console.error("[cerebras] call failed:", err);
    return null;
  }
}


const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function isInWorkHours(settings: { work_days: Record<string, boolean> | null; work_start: string | null; work_end: string | null }): boolean {
  if (!settings.work_days || !settings.work_start || !settings.work_end) return true;
  const now = new Date();
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

async function escalateOrOffHours(chatId: string) {
  const settings = await getBotSettingsRow();
  const offHours = settings ? !isInWorkHours(settings) : false;
  if (offHours || settings?.allow_escalation === false) {
    await supportRepo.addSupportMessage(chatId, "bot", settings?.off_hours_message?.trim() || "نحن خارج ساعات العمل حالياً. سنرد عليك في أقرب وقت.");
    return { escalated: false };
  }
  await supportRepo.updateChatStatus(chatId, "escalated");
  await supportRepo.addSupportMessage(chatId, "bot", "تم تحويل محادثتك لموظف الدعم الفني. سيتم الرد عليك في اقرب وقت");
  await supportRepo.addSupportMessage(chatId, "system", ESCALATION_START_MARKER);

  const chat = await supportRepo.getChatById(chatId);
  await invalidateChat(chat?.visitor_token ?? "");
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
    const load = async () => {
      const chat = await supportRepo.getChatByVisitorToken(data.visitorToken);
      if (!chat) return { chat: null, messages: [] };
      if (chat.status === "escalated") {
        await checkEscalationTimers(chat.id).catch((e) => console.error("[escalation] timer check failed", e));
        await invalidateChat(data.visitorToken);
        return { chat, messages: await supportRepo.listMessages(chat.id, data.sinceIso) };
      }
      return { chat, messages: await supportRepo.listMessages(chat.id, data.sinceIso) };
    };
    return load();
  });

export const visitorSendMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string; body: string; qaId?: string | number | null }) =>
    z.object({ visitorToken: uuid, body: z.string().trim().min(1).max(2000), qaId: z.preprocess((v) => (v == null || v === "" ? null : String(v)), z.string().nullable()).optional() }).parse(d))
  .handler(async ({ data }) => {
    await invalidateChat(data.visitorToken);
    const chat = await getOrCreateVisitorChat(data.visitorToken);
    await supportRepo.addSupportMessage(chat.id, "visitor", data.body);

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
      if (chat.status === "escalated") {
        if (!(await recentAlertExists(chat.id, PRIORITY_ALERT_MARKER))) {
          await sendWaitingAlert(chat.id, chat.visitor_name, true);
          await supportRepo.addSupportMessage(chat.id, "system", PRIORITY_ALERT_MARKER);
        }
        await supportRepo.addSupportMessage(chat.id, "bot", "تم إرسال تنبيه أولوية للإدارة. سيتم الرد عليك في أقرب وقت 🙏");
      } else {
        await escalateOrOffHours(chat.id);
      }
      await invalidateChat(data.visitorToken);
      return { ok: true };
    }

    if (!answer && asksAboutOffer(data.body)) {
      const allRows = (await projectsRepo.listAllProjects()).filter((p) => p.admin_approval === "approved");
      const pIdx = findProjectByQuery(allRows, data.body);
      if (pIdx >= 0) {
        const excl = await projectsRepo.getProjectExclusive(allRows[pIdx].id);
        if (excl && Date.now() < new Date(excl.vip_end_at).getTime()) {
          const remainingMs = new Date(excl.vip_end_at).getTime() - Date.now();
          const hrs = Math.floor(remainingMs / 3_600_000);
          const mins = Math.floor((remainingMs % 3_600_000) / 60_000);
          await supportRepo.addSupportMessage(chat.id, "bot", `هذا المشروع في فترة حصرية. المتبقي: ${hrs} ساعة و ${mins} دقيقة`);
          await invalidateChat(data.visitorToken);
          return { ok: true };
        }
      }
      await supportRepo.addSupportMessage(chat.id, "bot", `${OFFER_TERMS}\n${OFFER_FLOW_MARKER}`);
      await invalidateChat(data.visitorToken);
      return { ok: true };
    }

    if (!answer && asksAboutVip(data.body)) {
      await supportRepo.addSupportMessage(chat.id, "bot", `${VIP_PLANS_TEXT}\n${VIP_FLOW_MARKER}`);
      await invalidateChat(data.visitorToken);
      return { ok: true };
    }

    let requestAnswer: string | null = null;
    if (!answer) {
      const prev = await supportRepo.listMessages(chat.id);
      const lastBot = [...prev].reverse().find((m) => m.sender === "bot");
      const awaitingData = lastBot?.body?.trim() === ASK_REQUEST_PROMPT;
      if (awaitingData) {
        requestAnswer = await answerRequestStatus(data.body);
      } else if (asksAboutRequest(data.body)) {
        requestAnswer = EMAIL_RE.test(data.body) || data.body.trim().split(/\s+/).length > 2
          ? (await answerRequestStatus(data.body)) ?? ASK_REQUEST_PROMPT
          : ASK_REQUEST_PROMPT;
        if (requestAnswer === REQUEST_NOT_FOUND && !EMAIL_RE.test(data.body)) requestAnswer = ASK_REQUEST_PROMPT;
      }
    }
    const projectAnswer = requestAnswer ? null : await answerProjectQuery(data.body);
    let finalAnswer = answer || requestAnswer || projectAnswer;
    const cerebrasEnabled = settings?.cerebras_enabled == null ? true : settings.cerebras_enabled;
    if (!finalAnswer && cerebrasEnabled !== false) {
      finalAnswer = await askCerebras(data.body, {
        systemInstruction: settings?.gemini_system_instruction,
        dialect: settings?.gemini_dialect,
        botName: settings?.gemini_bot_name,
        scope: settings?.gemini_scope,
        blockedReplies: settings?.gemini_blocked_replies,
      });
    }
    const fallback = chat.status === "escalated"
      ? "عذرًا، لا أملك إجابة على هذا السؤال حالياً. الموظف سيرد عليك قريباً أو يمكنك كتابة \"موظف\" لإرسال تنبيه أولوية."
      : "عذرًا، لا أملك إجابة على هذا السؤال. يمكنك كتابة \"موظف\" للتحدث مع الدعم.";
    answer = finalAnswer || settings?.fallback_message?.trim() || fallback;
    await supportRepo.addSupportMessage(chat.id, "bot", answer);
    await invalidateChat(data.visitorToken);
    return { ok: true };
  });

export const visitorEscalate = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string }) => z.object({ visitorToken: uuid }).parse(d))
  .handler(async ({ data }) => {
    const chat = await supportRepo.getChatByVisitorToken(data.visitorToken);
    if (!chat) throw new Error("جلسة الشات غير موجودة");
    const res = await escalateOrOffHours(chat.id);
    await invalidateChat(data.visitorToken);
    return { ok: true, ...res };
  });

export const visitorEndSession = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string }) => z.object({ visitorToken: uuid }).parse(d))
  .handler(async ({ data }) => {
    const chat = await supportRepo.getChatByVisitorToken(data.visitorToken);
    await supportRepo.deleteVisitorChat(data.visitorToken);
    await invalidateChat(data.visitorToken);
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
    const chat = await supportRepo.getChatById(data.chatId);
    if (chat?.visitor_token) await invalidateChat(chat.visitor_token);
    return { ok: true };
  });

export const adminCloseChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    assertStaff(context.roles);
    await supportRepo.updateChatStatus(data.chatId, "closed");
    const chat = await supportRepo.getChatById(data.chatId);
    if (chat?.visitor_token) await invalidateChat(chat.visitor_token);
    return { ok: true };
  });

export const adminDeleteAllSupport = createServerFn({ method: "POST" }).middleware([requireAuth]).handler(async ({ context }) => {
  assertAdmin(context.roles);
  const chats = await supportRepo.listSupportChats();
  await supportRepo.deleteAllSupport();
  await invalidate(...chats.map((c) => (c.visitor_token ? cacheKeys.chat(c.visitor_token) : null)));
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
