import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

async function isAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

function matchQa(qas: Array<{ question: string; answer: string; keywords: string[] }>, text: string) {
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

const GEMINI_FAIL = "ما قدرت افهم السؤال. تبغى احولك لموظف؟";
const NO_CONTEXT = "ما عندي معلومة عن هذا في ملفات المنصة. تبغى احولك لموظف؟";
type GeminiCfg = {
  system_instruction?: string | null;
  dialect?: string | null;
  bot_name?: string | null;
  blocked_replies?: string[] | null;
  scope?: string | null;
};
function buildGeminiSystem(cfg: GeminiCfg | null, context: string): string {
  const base = cfg?.system_instruction?.trim()
    || "أنت مساعد دعم لمنصة العمران. رد باللهجة السعودية، ودود ومختصر جدًا (سطر أو سطرين).";
  const parts: string[] = [base];
  if (cfg?.bot_name?.trim()) parts.push(`اسمك: ${cfg.bot_name.trim()}.`);
  if (cfg?.dialect?.trim()) parts.push(`اللهجة: ${cfg.dialect.trim()}.`);
  if (cfg?.scope?.trim()) parts.push(`نطاق عملك: ${cfg.scope.trim()}.`);
  const blocked = (cfg?.blocked_replies ?? []).map((s) => s?.trim()).filter(Boolean) as string[];
  if (blocked.length) parts.push(`ممنوع تذكر أو ترد بأي من: ${blocked.join("، ")}.`);
  parts.push(
    "قواعد صارمة:",
    "- جاوب فقط من (بيانات المنصة) أدناه.",
    "- ممنوع تخترع أي معلومة غير موجودة في البيانات.",
    "- إذا ما فيه إجابة واضحة في البيانات، رد حرفيًا: " + NO_CONTEXT,
    "",
    "===== بيانات المنصة =====",
    context || "(لا توجد بيانات)",
    "===== نهاية البيانات =====",
  );
  return parts.join("\n");
}
async function askGemini(userText: string, cfg: GeminiCfg | null, context: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return GEMINI_FAIL;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 250,
        messages: [
          { role: "system", content: buildGeminiSystem(cfg, context) },
          { role: "user", content: userText },
        ],
      }),
    });
    if (!res.ok) return GEMINI_FAIL;
    const j: any = await res.json();
    const text: string = (j?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) return GEMINI_FAIL;
    const blocked = (cfg?.blocked_replies ?? []).map((s) => s?.trim().toLowerCase()).filter(Boolean) as string[];
    if (blocked.some((b) => text.toLowerCase().includes(b))) return GEMINI_FAIL;
    return text;
  } catch {
    return GEMINI_FAIL;
  }
}
async function loadGeminiCfg(admin: any): Promise<GeminiCfg | null> {
  const { data } = await admin.from("bot_settings")
    .select("gemini_system_instruction,gemini_dialect,gemini_bot_name,gemini_blocked_replies,gemini_scope")
    .limit(1).maybeSingle();
  if (!data) return null;
  return {
    system_instruction: data.gemini_system_instruction,
    dialect: data.gemini_dialect,
    bot_name: data.gemini_bot_name,
    blocked_replies: data.gemini_blocked_replies,
    scope: data.gemini_scope,
  };
}

const RAG_STOP = new Set(["مشروع","المشروع","هل","عندكم","عندك","متوفر","موجود","موجودة","فيه","لديكم","تفاصيل","تفصيل","وضع","حالة","تكلم","عن","اخبرني","أخبرني","معلومات","كلمني","من","فضلك","لو","سمحت","ابغى","أبغى","ابي","أبي","اريد","أريد","كل","ما","وش","ايش","أيش","في","على","إلى","الى","و","أو","او","ثم","كيف","متى","اين","أين","لماذا","ليش","ايه","إيه"]);
function ragTokens(text: string): string[] {
  return (text ?? "")
    .replace(/[?؟.!,،:؛()"'“”]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !RAG_STOP.has(w));
}
async function retrieveContext(admin: any, userText: string): Promise<string> {
  const tokens = ragTokens(userText).slice(0, 6);
  const blocks: string[] = [];

  const qaOr = tokens.length
    ? tokens.map((t) => `question.ilike.%${t}%,answer.ilike.%${t}%`).join(",")
    : "";
  const qaQuery = admin.from("bot_qa").select("question,answer").eq("is_active", true).limit(6);
  const { data: qas } = qaOr ? await qaQuery.or(qaOr) : await qaQuery;
  if (qas?.length) {
    blocks.push("[الأسئلة الشائعة]\n" + qas.map((q: any) => `س: ${q.question}\nج: ${q.answer}`).join("\n---\n"));
  }

  const projOr = tokens.length
    ? tokens.map((t) => `name.ilike.%${t}%,location.ilike.%${t}%,description.ilike.%${t}%`).join(",")
    : "";
  const projQuery = admin.from("projects")
    .select("name,location,description,admin_approval,status")
    .limit(5);
  const { data: projs } = projOr ? await projQuery.or(projOr) : await projQuery;
  if (projs?.length) {
    const approvalMap: Record<string, string> = { approved: "معتمد", pending: "قيد المراجعة", rejected: "مرفوض" };
    const statusMap: Record<string, string> = { active: "مفتوح للعروض", delivered: "تم التسليم", cancelled: "ملغي" };
    blocks.push("[المشاريع]\n" + projs.map((p: any) =>
      `- ${p.name} | الموقع: ${p.location ?? "-"} | الاعتماد: ${approvalMap[p.admin_approval] ?? p.admin_approval ?? "-"} | الحالة: ${statusMap[p.status] ?? p.status ?? "-"} | ${p.description ?? ""}`.trim()
    ).join("\n"));
  }

  const adOr = tokens.length
    ? tokens.map((t) => `title.ilike.%${t}%,description.ilike.%${t}%,domain.ilike.%${t}%`).join(",")
    : "";
  const adQuery = admin.from("ads")
    .select("title,description,domain,link_url")
    .eq("status", "approved")
    .limit(5);
  const { data: ads } = adOr ? await adQuery.or(adOr) : await adQuery;
  if (ads?.length) {
    blocks.push("[الإعلانات]\n" + ads.map((a: any) =>
      `- ${a.title} | المجال: ${a.domain ?? "-"} | ${a.description ?? ""}${a.link_url ? " | رابط: " + a.link_url : ""}`
    ).join("\n"));
  }

  return blocks.join("\n\n");
}


const STAFF_KEYWORDS = ["موظف", "موظفة", "خدمة العملاء", "الدعم", "كلم موظف", "أريد موظف", "اريد موظف", "بدي موظف", "محادثة موظف", "human", "agent", "support"];
function wantsHuman(text: string) {
  const t = (text ?? "").toLowerCase();
  return STAFF_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

type BotSettingsRow = {
  work_days: Record<string, boolean> | null;
  work_start: string | null;
  work_end: string | null;
  off_hours_message: string | null;
  fallback_message: string | null;
  allow_escalation: boolean | null;
};
async function loadBotSettings(admin: any): Promise<BotSettingsRow | null> {
  const { data } = await admin
    .from("bot_settings")
    .select("work_days,work_start,work_end,off_hours_message,fallback_message,allow_escalation")
    .limit(1)
    .maybeSingle();
  return (data as BotSettingsRow) ?? null;
}
function isWithinWorkHours(s: BotSettingsRow | null): boolean {
  if (!s) return true;
  const tz = "Asia/Riyadh";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const map: Record<string, string> = { Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat" };
  const key = map[wd] ?? "sun";
  if (s.work_days && s.work_days[key] === false) return false;
  const [sh, sm] = (s.work_start ?? "00:00").split(":").map(Number);
  const [eh, em] = (s.work_end ?? "23:59").split(":").map(Number);
  const cur = (hh % 24) * 60 + (mm % 60);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return cur >= start && cur <= end;
}

// -------- Visitor (unauthenticated) --------

export const listBotQuestions = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("bot_qa")
    .select("id,question,answer,keywords,sort_order,action")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const CLARIFY_PROMPT = "ممكن توضح مشكلتك أحاول أساعدك؟";
async function botAlreadyAskedClarify(admin: any, chatId: string): Promise<boolean> {
  const { data } = await admin
    .from("support_messages")
    .select("id")
    .eq("chat_id", chatId)
    .eq("sender", "bot")
    .eq("body", CLARIFY_PROMPT)
    .limit(1);
  return !!(data && data.length);
}

// --- Project lookup from bot (DB-first, no Groq) ---
const COUNT_KEYWORDS = ["كم عدد", "كم مشروع", "عدد المشاريع", "كم عندكم", "كم لديكم"];
const LIST_KEYWORDS = ["مشاريع", "المشاريع", "قائمة", "جميع المشاريع", "كل المشاريع", "عرض المشاريع", "اعرض", "أعرض"];
const STOP_WORDS = new Set(["مشروع", "المشروع", "مشاريع", "المشاريع", "هل", "عندكم", "عندك", "متوفر", "موجود", "موجودة", "فيه", "لديكم", "تفاصيل", "تفصيل", "وضع", "حالة", "تكلم", "عن", "اخبرني", "أخبرني", "معلومات", "كلمني", "من", "فضلك", "لو", "سمحت", "ابغى", "أبغى", "ابي", "أبي", "اريد", "أريد", "كل", "ما", "وش", "ايش", "أيش", "قائمة", "جميع", "عرض", "اعرض", "أعرض", "كم", "عدد"]);

function extractProjectName(text: string): string {
  const t = (text ?? "").replace(/[?؟.!,،]/g, " ");
  const tokens = t.split(/\s+/).filter(Boolean).filter((w) => !STOP_WORDS.has(w));
  return tokens.join(" ").trim();
}

const projectStatusMap: Record<string, string> = { active: "مفتوح للعروض", delivered: "تم التسليم", cancelled: "ملغي" };

function formatProjectDetails(p: any): string {
  const st = projectStatusMap[p.status] ?? "مفتوح للعروض";
  return `• ${p.name}\n  الموقع: ${p.location ?? "-"}\n  الحالة: ${st}${p.description ? `\n  الوصف: ${p.description}` : ""}`;
}

function formatProjectShort(p: any): string {
  const st = projectStatusMap[p.status] ?? "مفتوح للعروض";
  return `• ${p.name} — ${p.location ?? "-"} — ${st}`;
}

async function answerProjectQuery(admin: any, text: string): Promise<string | null> {
  const t = (text ?? "").toLowerCase();
  const mentionsProject = t.includes("مشروع") || t.includes("المشروع") || LIST_KEYWORDS.some((k) => t.includes(k));

  // 1) "كم عدد" → number only
  if (COUNT_KEYWORDS.some((k) => t.includes(k))) {
    const { count } = await admin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("admin_approval", "approved");
    return `عدد المشاريع: ${count ?? 0}`;
  }

  // 2) Search by name → details + status only
  const name = extractProjectName(text);
  if (name) {
    const tokens = name.replace(/[%_,]/g, " ").split(/\s+/).filter((w) => w.length >= 2).slice(0, 5);
    if (tokens.length) {
      const orExpr = tokens.map((tok) => `name.ilike.%${tok}%,location.ilike.%${tok}%`).join(",");
      const { data } = await admin
        .from("projects")
        .select("name,location,description,status")
        .eq("admin_approval", "approved")
        .or(orExpr)
        .limit(3);
      if (data?.length) return data.map(formatProjectDetails).join("\n\n");
    }
  }

  // 3) General projects question → short list: name + location + status
  if (mentionsProject) {
    const { data } = await admin
      .from("projects")
      .select("name,location,status")
      .eq("admin_approval", "approved")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!data?.length) return null;
    return "المشاريع المتاحة:\n\n" + data.map(formatProjectShort).join("\n");
  }

  return null;
}

export const startVisitorChat = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string; visitorName?: string | null }) =>
    z.object({ visitorToken: uuid, visitorName: z.string().trim().max(80).nullable().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("support_chats").select("*").eq("visitor_token", data.visitorToken).maybeSingle();
    if (existing) return existing;
    const { data: created, error } = await supabaseAdmin
      .from("support_chats")
      .insert({ visitor_token: data.visitorToken, visitor_name: data.visitorName ?? null })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    // Welcome bot message
    await supabaseAdmin.from("support_messages").insert({
      chat_id: created.id, sender: "bot",
      body: "أهلًا بك في دعم العمران! اختر سؤالًا من الأسفل أو اطلب التحدث مع موظف.",
    });
    return created;
  });

export const visitorGetMessages = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string; sinceIso?: string | null }) =>
    z.object({ visitorToken: uuid, sinceIso: z.string().nullable().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: chat } = await supabaseAdmin
      .from("support_chats").select("id,status").eq("visitor_token", data.visitorToken).maybeSingle();
    if (!chat) return { chat: null, messages: [] };
    let q = supabaseAdmin.from("support_messages").select("id,sender,body,created_at").eq("chat_id", chat.id).order("created_at", { ascending: true });
    if (data.sinceIso) q = q.gt("created_at", data.sinceIso);
    const { data: msgs, error } = await q;
    if (error) throw new Error(error.message);
    return { chat, messages: msgs ?? [] };
  });

export const visitorSendMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string; body: string; qaId?: string | number | null }) =>
    z.object({
      visitorToken: uuid,
      body: z.string().trim().min(1).max(2000),
      qaId: z.preprocess((v) => (v === null || v === undefined || v === "" ? null : String(v)), z.string().nullable()).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existingChat, error: ce } = await supabaseAdmin
      .from("support_chats").select("id,status").eq("visitor_token", data.visitorToken).maybeSingle();
    if (ce) throw new Error(ce.message);
    let chat = existingChat;

    if (!chat) {
      const { data: created, error: createError } = await supabaseAdmin
        .from("support_chats")
        .insert({ visitor_token: data.visitorToken })
        .select("id,status")
        .single();
      if (createError) throw new Error(createError.message);

      const { error: welcomeError } = await supabaseAdmin.from("support_messages").insert({
        chat_id: created.id,
        sender: "bot",
        body: "أهلًا بك في دعم العمران! اختر سؤالًا من الأسفل أو اطلب التحدث مع موظف.",
      });
      if (welcomeError) throw new Error(welcomeError.message);
      chat = created;
    }

    const { error: visitorMessageError } = await supabaseAdmin
      .from("support_messages")
      .insert({ chat_id: chat.id, sender: "visitor", body: data.body });
    if (visitorMessageError) throw new Error(visitorMessageError.message);

    const { error: touchError } = await supabaseAdmin
      .from("support_chats")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", chat.id);
    if (touchError) throw new Error(touchError.message);

    // If chat still with bot, reply
    if (chat.status === "bot") {
      const settings = await loadBotSettings(supabaseAdmin);
      const within = isWithinWorkHours(settings);
      const allowEsc = settings?.allow_escalation !== false;
      const offMsg = settings?.off_hours_message?.trim()
        || "نحن خارج ساعات العمل حالياً. سنرد عليك في أقرب وقت.";

      async function doEscalate() {
        if (within && allowEsc) {
          await supabaseAdmin.from("support_chats")
            .update({ status: "escalated", last_message_at: new Date().toISOString() })
            .eq("id", chat!.id);
          await supabaseAdmin.from("support_messages").insert({
            chat_id: chat!.id, sender: "system",
            body: "تم تحويل محادثتك لموظف الدعم. سيتم الرد عليك في أقرب وقت.",
          });
        } else {
          await supabaseAdmin.from("support_messages").insert({
            chat_id: chat!.id, sender: "bot", body: offMsg,
          });
        }
      }

      // Determine if this turn triggers an escalate action
      let triggerEscalate = false;
      let answer: string | null = null;

      if (data.qaId) {
        const { data: qa } = await supabaseAdmin
          .from("bot_qa").select("answer,action")
          .eq("id", data.qaId).eq("is_active", true).maybeSingle();
        if (qa?.action === "escalate") triggerEscalate = true;
        else answer = qa?.answer ?? null;
      } else if (wantsHuman(data.body)) {
        triggerEscalate = true;
      } else {
        const { data: qas } = await supabaseAdmin
          .from("bot_qa").select("question,answer,keywords,action").eq("is_active", true);
        const m = matchQa((qas ?? []) as any, data.body);
        if (m && (m as any).action === "escalate") triggerEscalate = true;
        else answer = m?.answer ?? null;
      }

      if (triggerEscalate) {
        const alreadyAsked = await botAlreadyAskedClarify(supabaseAdmin, chat.id);
        if (alreadyAsked) {
          await doEscalate();
        } else {
          await supabaseAdmin.from("support_messages").insert({
            chat_id: chat.id, sender: "bot", body: CLARIFY_PROMPT,
          });
        }
      } else {
        if (!answer) {
          answer = await answerProjectQuery(supabaseAdmin, data.body);
        }
        if (!answer) {
          const context = await retrieveContext(supabaseAdmin, data.body);
          if (!context) {
            answer = NO_CONTEXT;
          } else {
            const cfg = await loadGeminiCfg(supabaseAdmin);
            answer = await askGemini(data.body, cfg, context);
          }
        }

        if (!answer) {
          answer = settings?.fallback_message?.trim()
            || "عذرًا، لا أملك إجابة على هذا السؤال. يمكنك اختيار أحد الأسئلة من القائمة أو كتابة \"موظف\" للتحدث مع الدعم.";
        }
        const { error: botMessageError } = await supabaseAdmin
          .from("support_messages")
          .insert({ chat_id: chat.id, sender: "bot", body: answer });
        if (botMessageError) throw new Error(botMessageError.message);
      }
    }
    return { ok: true };
  });

export const visitorEscalate = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string }) => z.object({ visitorToken: uuid }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: chat } = await supabaseAdmin.from("support_chats").select("id,status").eq("visitor_token", data.visitorToken).maybeSingle();
    if (!chat) throw new Error("جلسة الشات غير موجودة");
    if (chat.status === "escalated") return { ok: true };
    const settings = await loadBotSettings(supabaseAdmin);
    const within = isWithinWorkHours(settings);
    const allowEsc = settings?.allow_escalation !== false;
    if (!within || !allowEsc) {
      const offMsg = settings?.off_hours_message?.trim()
        || "نحن خارج ساعات العمل حالياً. سنرد عليك في أقرب وقت.";
      await supabaseAdmin.from("support_messages").insert({
        chat_id: chat.id, sender: "bot", body: offMsg,
      });
      return { ok: true, escalated: false };
    }
    await supabaseAdmin.from("support_chats").update({ status: "escalated", last_message_at: new Date().toISOString() }).eq("id", chat.id);
    await supabaseAdmin.from("support_messages").insert({
      chat_id: chat.id, sender: "system",
      body: "تم تحويل محادثتك لموظف الدعم. سيتم الرد عليك في أقرب وقت.",
    });
    return { ok: true, escalated: true };
  });

export const visitorEndSession = createServerFn({ method: "POST" })
  .inputValidator((d: { visitorToken: string }) => z.object({ visitorToken: uuid }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: chat } = await supabaseAdmin
      .from("support_chats").select("id").eq("visitor_token", data.visitorToken).maybeSingle();
    if (!chat) return { ok: true };
    await supabaseAdmin.from("support_messages").delete().eq("chat_id", chat.id);
    await supabaseAdmin.from("support_chats").delete().eq("id", chat.id);
    return { ok: true };
  });

// -------- Admin --------

async function assertStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.length) throw new Error("Forbidden");
}

export const adminListChats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("support_chats")
      .select("id,visitor_name,status,last_message_at,created_at")
      .order("last_message_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminListChatMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: msgs, error } = await supabaseAdmin
      .from("support_messages").select("id,sender,body,created_at")
      .eq("chat_id", data.chatId).order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return msgs ?? [];
  });

export const adminReplyChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chatId: string; body: string }) =>
    z.object({ chatId: uuid, body: z.string().trim().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("support_messages").insert({
      chat_id: data.chatId, sender: "admin", body: data.body,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("support_chats")
      .update({ status: "escalated", last_message_at: new Date().toISOString() }).eq("id", data.chatId);
    return { ok: true };
  });

export const adminCloseChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chatId: string }) => z.object({ chatId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("support_chats").update({ status: "closed" }).eq("id", data.chatId);
    return { ok: true };
  });

export const adminDeleteAllSupport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: mErr } = await supabaseAdmin
      .from("support_messages").delete().not("id", "is", null);
    if (mErr) throw new Error(mErr.message);
    const { error: cErr } = await supabaseAdmin
      .from("support_chats").delete().not("id", "is", null);
    if (cErr) throw new Error(cErr.message);
    return { ok: true };
  });

// -------- Bot training (admin) --------

export const adminListBotQa = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await isAdmin(context.supabase, context.userId);
    if (!admin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("bot_qa").select("*").order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpsertBotQa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string | null; question: string; answer: string; keywords: string[]; is_active: boolean; sort_order: number; action?: "none" | "escalate" }) =>
    z.object({
      id: z.string().uuid().nullable().optional(),
      question: z.string().trim().min(1).max(300),
      answer: z.string().trim().min(1).max(4000),
      keywords: z.array(z.string().trim().max(60)).max(30),
      is_active: z.boolean(),
      sort_order: z.number().int().min(0).max(9999),
      action: z.enum(["none", "escalate"]).default("none"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await isAdmin(context.supabase, context.userId);
    if (!admin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = { question: data.question, answer: data.answer, keywords: data.keywords, is_active: data.is_active, sort_order: data.sort_order, action: data.action ?? "none" };
    if (data.id) {
      const { error } = await supabaseAdmin.from("bot_qa").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("bot_qa").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteBotQa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await isAdmin(context.supabase, context.userId);
    if (!admin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("bot_qa").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCountOpenSupportChats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("support_chats").select("id", { count: "exact", head: true }).eq("status", "escalated");
    return { count: count ?? 0 };
  });
