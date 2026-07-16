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

async function answerProjectQuery(text: string): Promise<string | null> {
  const t = (text ?? "").toLowerCase().trim();
  if (!t) return null;
  const projectKeywords = ["مشروع", "المشاريع", "مشاريع", "project", "projects"];
  if (!projectKeywords.some((k) => t.includes(k))) return null;

  const rows = (await projectsRepo.listAllProjects()).filter((p) => p.admin_approval === "approved");
  if (!rows.length) return "لا توجد مشاريع متاحة حالياً.";

  const statusMap: Record<string, string> = { active: "مفتوح للعروض", delivered: "تم التسليم", cancelled: "ملغي" };

  // Count queries
  if (t.includes("كم") || t.includes("عدد") || t.includes("count") || t.includes("how many")) {
    return `عدد المشاريع المعتمدة حالياً: ${rows.length}`;
  }

  // Try to find a specific project by name/location match
  const match = rows.find((p) => {
    const name = (p.name ?? "").toLowerCase();
    const loc = (p.location ?? "").toLowerCase();
    return (name && t.includes(name)) || (loc && t.includes(loc));
  });
  if (match) {
    const parts = [
      `المشروع: ${match.name}`,
      match.location ? `الموقع: ${match.location}` : null,
      match.duration ? `المدة: ${match.duration}` : null,
      `الحالة: ${statusMap[match.status] ?? match.status}`,
      match.description ? `الوصف: ${match.description.slice(0, 400)}` : null,
    ].filter(Boolean);
    return parts.join("\n");
  }

  // Status-filtered listing
  let filtered = rows;
  if (t.includes("مفتوح") || t.includes("متاح")) filtered = rows.filter((p) => p.status === "active");
  else if (t.includes("مسلم") || t.includes("تسليم") || t.includes("منجز")) filtered = rows.filter((p) => p.status === "delivered");
  else if (t.includes("ملغ")) filtered = rows.filter((p) => p.status === "cancelled");

  if (!filtered.length) return "لا توجد مشاريع مطابقة لطلبك.";
  return "المشاريع المتاحة:\n\n" + filtered.slice(0, 20).map((p) => `• ${p.name} — ${p.location ?? "-"} — ${statusMap[p.status] ?? p.status}`).join("\n");
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

async function escalateOrOffHours(chatId: string) {
  const settings = await getBotSettingsRow();
  const offHours = settings ? !isInWorkHours(settings) : false;
  if (offHours || settings?.allow_escalation === false) {
    await supportRepo.addSupportMessage(chatId, "bot", settings?.off_hours_message?.trim() || "نحن خارج ساعات العمل حالياً. سنرد عليك في أقرب وقت.");
    return { escalated: false };
  }
  await supportRepo.updateChatStatus(chatId, "escalated");
  await supportRepo.addSupportMessage(chatId, "system", "تم تحويل محادثتك لموظف الدعم. سيتم الرد عليك في أقرب وقت.");
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
      if (await supportRepo.botAlreadyAsked(chat.id, CLARIFY_PROMPT)) await escalateOrOffHours(chat.id);
      else await supportRepo.addSupportMessage(chat.id, "bot", CLARIFY_PROMPT);
      return { ok: true };
    }
    answer = answer || await answerProjectQuery(data.body) || settings?.fallback_message?.trim() || "عذرًا، لا أملك إجابة على هذا السؤال. يمكنك كتابة \"موظف\" للتحدث مع الدعم.";
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