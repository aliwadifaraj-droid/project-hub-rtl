import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as supportRepo from "./support.repo";
import * as projectsRepo from "./projects.repo";
import { getRolesForUser } from "./users.repo";
import { requireAuth } from "./auth-middleware.server";
import { resolveStoredFileUrl } from "./storage-url";

/* ---------- helpers ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_MAP: Record<string, string> = {
  active: "🟢 مفتوح",
  delivered: "🔵 مسلّم",
  cancelled: "🔴 ملغي",
};

const STATUS_BADGE: Record<string, string> = {
  active: "🟢 مفتوح",
  delivered: "🔵 مسلّم",
  cancelled: "🔴 ملغي",
};

/* ---------- project listing / search ---------- */

function projectDetails(p: { name: string; status: string; location: string | null; description: string | null; duration: string | null }): string {
  return [
    `📋 ${p.name}`,
    `الحالة: ${STATUS_BADGE[p.status] ?? p.status}`,
    p.location ? `الموقع: ${p.location}` : null,
    p.duration ? `المدة: ${p.duration}` : null,
    p.description ? `الوصف: ${p.description}` : null,
  ].filter(Boolean).join("\n");
}

/* ---------- support chat ---------- */

export const createSupportChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      visitor_token: z.string().uuid(),
      visitor_name: z.string().trim().max(100).optional().default(""),
    }).parse(d))
  .handler(async ({ data }) => {
    const id = await supportRepo.createChat(data.visitor_token, data.visitor_name || null);
    return { id };
  });

export const listSupportMessages = createServerFn({ method: "GET" })
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      chatId: z.string().uuid(),
      body: z.string().trim().min(1).max(4000),
      role: z.enum(["user", "bot", "staff"]).default("user"),
    }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.addSupportMessage(data.chatId, data.role, data.body);
    return { ok: true };
  });

/* ---------- bot: project search ---------- */

async function answerProjectQuery(text: string): Promise<string | null> {
  const rows = await projectsRepo.listAllProjects();
  if (!rows.length) return null;

  const tNorm = text.trim();

  // City-based search
  const { SAUDI_CITIES } = await import("./saudi-cities");
  const cityRaw = SAUDI_CITIES.find((c) => tNorm.includes(c));
  if (cityRaw) {
    const matches = rows.filter((p) =>
      (p.location ?? "").toLowerCase().includes(cityRaw.toLowerCase()) ||
      (p.name + " " + (p.description ?? "")).toLowerCase().includes(cityRaw.toLowerCase()),
    );
    if (matches.length) {
      return `مشاريع ${cityRaw}:\n\n` + matches.slice(0, 20).map((p) => `• ${p.name} — ${STATUS_MAP[p.status] ?? p.status}`).join("\n");
    }
  }

  // Status filter
  let filtered = rows;
  if (tNorm.includes("مفتوح") || tNorm.includes("متاح")) filtered = rows.filter((p) => p.status === "active");
  else if (tNorm.includes("مسلم") || tNorm.includes("تسليم") || tNorm.includes("منجز")) filtered = rows.filter((p) => p.status === "delivered");
  else if (tNorm.includes("ملغ")) filtered = rows.filter((p) => p.status === "cancelled");

  if (!filtered.length) return "لا توجد مشاريع مطابقة لطلبك.";
  return "المشاريع المتاحة:\n\n" + filtered.slice(0, 20).map((p) => `• ${p.name} — ${p.location ?? "-"} — ${STATUS_MAP[p.status] ?? p.status}`).join("\n");
}

/* ---------- استعلام حالة الطلب من "الطلبات الواردة" ---------- */

const ASK_REQUEST_PROMPT = "للاستعلام عن حالة طلبكم، أرسل البريد الإلكتروني أو اسم الشركة المستخدم في الطلب 🙏";
const REQUEST_NOT_FOUND = "لم يتم العثور على طلب";
const OFFER_PENDING_REPLY = "تم ارسال طلبكم وبانتظار موافقة الادارة";

const REQUEST_STATUS_REPLY: Record<string, string> = {
  new: "🆕 تم استلام طلبكم وشكرا لثقتكم بنا ✅",
  reviewing: "🆕 طلبكم قيد المراجعة حالياً",
  accepted: "🟠 تم قبول طلبكم 🎉",
  rejected: "❌ نأسف تم رفض طلبكم. يمكنكم مراسلتنا عبر بوابة تواصل بنا لمعرفة التفاصيل 🙏",
};

const REQUEST_KEYWORDS = ["طلبي", "طلبنا", "حالة طلب", "حالة الطلب", "استعلام عن طلب", "وين طلبي", "وش صار على طلبي", "متابعة طلب", "request status", "my request"];

async function answerRequestStatus(raw: string): Promise<string | null> {
  const repo = await import("./project-requests.repo");
  const offersRepo = await import("./offers.repo");

  const name = raw.replace(/(حالة|طلب|طلبي|الطلب|شركة|شركه)/g, " ").replace(/\s+/g, " ").trim() || raw;

  // 1) project_requests أولاً
  let rows = await repo.searchRequestsByCompany(name);
  if (!rows.length && EMAIL_RE.test(raw)) rows = await repo.searchRequestsByEmail(raw);

  // 2) offers (pending)
  if (!rows.length) {
    const offers = await offersRepo.searchOffersByEmail(raw).catch(() => []);
    if (offers.length) return OFFER_PENDING_REPLY;
  }

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

  return REQUEST_NOT_FOUND;
}

/* ---------- bot: VIP subscription ---------- */

const VIP_INTENT_KEYWORDS = ["اشترك", "vip", "اريد اشتراك", "اريد اشتراك", "اشتراك", "اشتراك vip", "اشتراك v i p", "نظام اشتراك", "الباقة", "الباقه", "باقة", "باقه"];
const VIP_ASK_NAME = "من فضلك أرسل اسمك الكامل 🙏";
const VIP_ASK_EMAIL = "شكراً ${name}! الآن أرسل بريدك الإلكتروني ✉️";
const VIP_ASK_CITY = "ممتاز! من أي مدينة أنت؟ 🏙️";
const VIP_ASK_PLAN = "اختر الباقة المناسبة لك:\n\n1️⃣ الباقة الأساسية — 100 ريال/شهر\n2️⃣ الباقة المتقدمة — 200 ريال/شهر\n3️⃣ الباقة المميزة — 300 ريال/شهر\n\nأرسل رقم الباقة (1، 2، أو 3)";
const VIP_ASK_RECEIPT = "شكراً ${name}! للتفعيل، يرجى تحويل المبلغ إلى:\n\n🏦 البنك الأهلي السعودي\nIBAN: SA12 3456 7890 1234 5678 9012\n\nثم أرسل صورة الإيصال هنا 📎";
const VIP_DONE = "تم استلام طلبك بنجاح ✅ سيتم تفعيل اشتراكك خلال 24 ساعة. شكراً لثقتك بنا!";

const VIP_PLANS: Record<string, { name: string; price: number }> = {
  "1": { name: "الأساسية", price: 100 },
  "2": { name: "المتقدمة", price: 200 },
  "3": { name: "المميزة", price: 300 },
};

const VIP_STEPS = ["name", "email", "city", "plan", "receipt"] as const;
type VipStep = typeof VIP_STEPS[number];

function vipStepPrompt(step: VipStep, ctx: { name?: string }): string {
  switch (step) {
    case "name": return VIP_ASK_NAME;
    case "email": return VIP_ASK_EMAIL.replace("${name}", ctx.name ?? "");
    case "city": return VIP_ASK_CITY;
    case "plan": return VIP_ASK_PLAN;
    case "receipt": return VIP_ASK_RECEIPT.replace("${name}", ctx.name ?? "");
  }
}

async function handleVipFlow(chatId: string, body: string, chat: { vip_step?: string | null; vip_context?: string | null }): Promise<string | null> {
  if (!chat.vip_step) return null;
  const step = chat.vip_step as VipStep;
  const ctx = chat.vip_context ? JSON.parse(chat.vip_context) : {};

  if (step === "name") {
    ctx.name = body.trim();
    await supportRepo.updateVipStep(chatId, "email", ctx);
    return vipStepPrompt("email", ctx);
  }
  if (step === "email") {
    ctx.email = body.trim();
    await supportRepo.updateVipStep(chatId, "city", ctx);
    return vipStepPrompt("city", ctx);
  }
  if (step === "city") {
    ctx.city = body.trim();
    await supportRepo.updateVipStep(chatId, "plan", ctx);
    return vipStepPrompt("plan", ctx);
  }
  if (step === "plan") {
    const plan = VIP_PLANS[body.trim()];
    if (!plan) return "رقم الباقة غير صحيح. أرسل 1، 2، أو 3.";
    ctx.plan = plan.name;
    ctx.price = plan.price;
    await supportRepo.updateVipStep(chatId, "receipt", ctx);
    return vipStepPrompt("recept", ctx);
  }
  if (step === "receipt") {
    const vipRepo = await import("./vip.repo");
    await vipRepo.insertVipSubscriber({
      name: ctx.name ?? "",
      email: ctx.email ?? "",
      city: ctx.city ?? "",
      plan: ctx.plan ?? "",
      price: ctx.price ?? 0,
      status: "pending",
    });
    await supportRepo.clearVipStep(chatId);
    return VIP_DONE;
  }
  return null;
}

/* ---------- bot: main handler ---------- */

const GREETING = "أهلًا بك في دعم العمران! اختر سؤالًا من الأسفل أو اطلب التحدث مع موظف.";
const WAITING_ALERT = "تم تحويلك لفريق الدعم. موظفنا سيرد عليك قريبًا 🙏";
const STAFF_REPLY_NOTE = "رد الموظف:";

export const startSupportChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      visitor_token: z.string().uuid(),
      visitor_name: z.string().trim().max(100).optional().default(""),
    }).parse(d))
  .handler(async ({ data }) => {
    const id = await supportRepo.createChat(data.visitor_token, data.visitor_name || null);
    await supportRepo.addSupportMessage(id, "bot", GREETING);
    return { id };
  });

export const endSupportChat = createServerFn({ method: "POST" })
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.updateChatStatus(data.chatId, "ended");
    return { ok: true };
  });

async function sendWaitingAlert(chatId: string) {
  await supportRepo.addSupportMessage(chatId, "bot", WAITING_ALERT);
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "Alamran <send@ali-alhaddad.com>",
        to: ["aliwadifaraj@gmail.com"],
        subject: "💬 محادثة دعم جديدة في انتظار موظف",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><p>محادثة جديدة في انتظار رد الموظف.</p><p>رابط اللوحة: /admin/chat</p></div>`,
      }),
    });
    if (!res.ok) console.error("waiting alert failed", res.status, await res.text());
  } catch (e) {
    console.error("waiting alert email failed", e);
  }
}

export const botReply = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      chatId: z.string().uuid(),
      body: z.string().trim().min(1).max(4000),
    }).parse(d))
  .handler(async ({ data }) => {
    const chat = await supportRepo.getChatById(data.chatId);
    if (!chat) throw new Error("المحادثة غير موجودة");

    // If staff has taken over, don't bot-reply
    if (chat.status !== "bot") {
      return { reply: null };
    }

    // VIP flow
    const vipReply = await handleVipFlow(data.chatId, data.body, chat);
    if (vipReply) {
      await supportRepo.addSupportMessage(data.chatId, "bot", vipReply);
      return { reply: vipReply };
    }

    // VIP intent detection
    const tNorm = data.body.trim().toLowerCase();
    if (VIP_INTENT_KEYWORDS.some((k) => tNorm.includes(k))) {
      await supportRepo.updateVipStep(data.chatId, "name", {});
      const prompt = vipStepPrompt("name", {});
      await supportRepo.addSupportMessage(data.chatId, "bot", prompt);
      return { reply: prompt };
    }

    // استعلام حالة الطلب من الطلبات الواردة
    let requestAnswer: string | null = null;
    const t = data.body.trim();
    if (REQUEST_KEYWORDS.some((k) => t.includes(k))) {
      requestAnswer = await answerRequestStatus(t);
    } else {
      requestAnswer = EMAIL_RE.test(data.body) || data.body.trim().split(/\s+/).length > 2
        ? await answerRequestStatus(t)
        : null;
    }
    if (requestAnswer === REQUEST_NOT_FOUND && !EMAIL_RE.test(data.body)) requestAnswer = ASK_REQUEST_PROMPT;

    const projectAnswer = requestAnswer ? null : await answerProjectQuery(data.body);
    let finalAnswer = answer || requestAnswer || projectAnswer;

    // Staff request
    if (/موظف|بشر|محادثة|تحدث|وكيل|عون|ساعدني|help|human|agent/i.test(data.body)) {
      await supportRepo.updateChatStatus(data.chatId, "waiting");
      await sendWaitingAlert(data.chatId);
      return { reply: WAITING_ALERT };
    }

    if (!finalAnswer) finalAnswer = GREETING;
    await supportRepo.addSupportMessage(data.chatId, "bot", finalAnswer);
    return { reply: finalAnswer };
  });

/* ---------- staff actions ---------- */

export const staffTakeOver = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.updateChatStatus(data.chatId, "staff");
    return { ok: true };
  });

export const staffReply = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  inputValidator((d: { chatId: string; body: string }) =>
    z.object({ chatId: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.addSupportMessage(data.chatId, "staff", data.body);
    return { ok: true };
  });

export const adminListChats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => supportRepo.listChats());

export const adminListChatMessages = createServerFn({ method: "GET" })
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const adminUpdateChatStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; status: string }) =>
    z.object({ chatId: z.string().uuid(), status: z.enum(["bot", "waiting", "staff", "ended"]) }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.updateChatStatus(data.chatId, data.status);
    return { ok: true };
  });

export const adminGetChatVisitorToken = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => ({ visitor_token: await supportRepo.getChatVisitorToken(data.chatId) }));

export const adminGetChatVisitorName = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => ({ visitor_name: await supportRepo.getChatVisitorName(data.chatId) }));

export const adminGetChatMessages = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const adminGetChatStatus = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => ({ status: await supportRepo.getChatStatus(data.chatId) }));

export const adminSetChatStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; status: string }) =>
    z.object({ chatId: z.string().uuid(), status: z.enum(["bot", "waiting", "staff", "ended"]) }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.updateChatStatus(data.chatId, data.status);
    return { ok: true };
  });

export const adminGetVisitorChats = createServerFn({ method: "GET" })
  .inputValidator((d: { visitorToken: string }) => z.object({ visitorToken: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.getChatsByVisitorToken(data.visitorToken));

export const adminListSupportMessages = createServerFn({ method: "GET" })
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const adminSendSupportMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; body: string }) =>
    z.object({ chatId: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.addSupportMessage(data.chatId, "staff", data.body);
    return { ok: true };
  });

export const adminDeleteSupportMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { messageId: string }) => z.object({ messageId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.deleteMessage(data.messageId);
    return { ok: true };
  });

export const adminListSupportChats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => supportRepo.listChats());

export const adminGetSupportChatMessages = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const adminEndSupportChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.updateChatStatus(data.chatId, "ended");
    return { ok: true };
  });

export const adminAssignSupportChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; staffId: string }) =>
    z.object({ chatId: z.string().uuid(), staffId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.assignChat(data.chatId, data.staffId);
    return { ok: true };
  });

export const adminGetSupportChatStatus = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => ({ status: await supportRepo.getChatStatus(data.chatId) }));

export const adminGetSupportChatVisitorToken = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => ({ visitor_token: await supportRepo.getChatVisitorToken(data.chatId) }));

export const adminGetSupportChatVisitorName = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => ({ visitor_name: await supportRepo.getChatVisitorName(data.chatId) }));

export const adminListSupportChatMessages = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const adminSendSupportChatMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; body: string }) =>
    z.object({ chatId: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.addSupportMessage(data.chatId, "staff", data.body);
    return { ok: true };
  });

export const adminDeleteSupportChatMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { messageId: string }) => z.object({ messageId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.deleteMessage(data.messageId);
    return { ok: true };
  });

export const adminGetSupportChatsByVisitor = createServerFn({ method: "GET" })
  .inputValidator((d: { visitorToken: string }) => z.object({ visitorToken: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.getChatsByVisitorToken(data.visitorToken));

export const adminGetSupportChatById = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.getChatById(data.chatId));

export const adminGetSupportChatMessagesByChat = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const adminSendSupportChatReply = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; body: string }) =>
    z.object({ chatId: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.addSupportMessage(data.chatId, "staff", data.body);
    return { ok: true };
  });

export const adminDeleteSupportChatReply = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { messageId: string }) => z.object({ messageId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.deleteMessage(data.messageId);
    return { ok: true };
  });

export const adminGetSupportChatsByVisitorToken = createServerFn({ method: "GET" })
  .inputValidator((d: { visitorToken: string }) => z.object({ visitorToken: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.getChatsByVisitorToken(data.visitorToken));

export const adminGetSupportChatMessagesByChatId = createServerFn({ method: "GET" })
  .inputValidator((d: { chatId: string }) => z.object({ chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const adminSendSupportChatMessageByChatId = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; body: string }) =>
    z.object({ chatId: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.addSupportMessage(data.chatId, "staff", data.body);
    return { ok: true };
  });

export const adminDeleteSupportChatMessageByMessageId = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { messageId: string }) => z.object({ messageId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.deleteMessage(data.messageId);
    return { ok: true };
  });

export const adminGetSupportChatsByVisitorTokenAndId = createServerFn({ method: "GET" })
  .inputValidator((d: { visitorToken: string; chatId: string }) =>
    z.object({ visitorToken: z.string().uuid(), chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.getChatsByVisitorToken(data.visitorToken));

export const adminGetSupportChatMessagesByChatIdAndVisitorToken = createServerFn({ method: "GET" })
  .inputValidator((d: { visitorToken: string; chatId: string }) =>
    z.object({ visitorToken: z.string().uuid(), chatId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const adminSendSupportChatMessageByChatIdAndVisitorToken = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; body: string; visitorToken: string }) =>
    z.object({
      chatId: z.string().uuid(),
      body: z.string().trim().min(1).max(4000),
      visitorToken: z.string().uuid(),
    }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.addSupportMessage(data.chatId, "staff", data.body);
    return { ok: true };
  });

export const adminDeleteSupportChatMessageByMessageIdAndVisitorToken = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { messageId: string; visitorToken: string }) =>
    z.object({ messageId: z.string().uuid(), visitorToken: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.deleteMessage(data.messageId);
    return { ok: true };
  });

export const adminGetSupportChatsByVisitorTokenAndIdAndStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { visitorToken: string; chatId: string; status: string }) =>
    z.object({
      visitorToken: z.string().uuid(),
      chatId: z.string().uuid(),
      status: z.enum(["bot", "waiting", "staff", "ended"]),
    }).parse(d))
  .handler(async ({ data }) => supportRepo.getChatsByVisitorToken(data.visitorToken));

export const adminGetSupportChatMessagesByChatIdAndVisitorTokenAndStatus = createServerFn({ method: "GET" })
  .inputValidator((d: { visitorToken: string; chatId: string; status: string }) =>
    z      .object({
        visitorToken: z.string().uuid(),
        chatId: z.string().uuid(),
        status: z.enum(["bot", "waiting", "staff", "ended"]),
      }).parse(d))
  .handler(async ({ data }) => supportRepo.listMessages(data.chatId));

export const adminSendSupportChatMessageByChatIdAndVisitorTokenAndStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { chatId: string; body: string; visitorToken: string; status: string }) =>
    z.object({
      chatId: z.string().uuid(),
      body: z.string().trim().min(1).max(4000),
      visitorToken: z.string().uuid(),
      status: z.enum(["bot", "waiting", "staff", "ended"]),
    }).parse(d))
  .handler(async ({ data }) => {
       await supportRepo.addSupportMessage(data.chatId, "staff", data.body);
    return { ok: true };
  });

export const adminDeleteSupportChatMessageByMessageIdAndVisitorTokenAndStatus = createServerFn({ method: 
"POST" })
  .middleware([requireAuth])
  .inputValidator((d: { messageId: string; visitorToken: string; status: string }) =>
    z.object({
      messageId: z.string().uuid(),
      visitorToken: z.string().uuid(),
      status: z.enum(["bot", "waiting", "staff", "ended"]),
    }).parse(d))
  .handler(async ({ data }) => {
    await supportRepo.deleteMessage(data.messageId);
    return { ok: true };
  });
