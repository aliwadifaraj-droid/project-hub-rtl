import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import * as supportRepo from "./support.repo";
import * as projectsRepo from "./projects.repo";
import { getBotSettingsRow } from "./bot-settings.repo";
import { cached, cacheKeys, TTL_CHAT, invalidateChat, invalidate } from "./cache";


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

function statusBadge(status: string): string {
  return `__STATUS_BADGE__:${status}__`;
}

const STOP_WORDS = new Set([
  "مشروع", "المشروع", "مشاريع", "المشاريع", "project", "projects",
  "حالة", "حاله", "وضع", "status", "معلومات", "تفاصيل", "عن", "بخصوص",
  "ايش", "ما", "هو", "هي", "كم", "عدد", "count", "how", "many",
  "ال", "في", "من", "على", "الى", "الى", "او", "و", "مع", "هذا", "هذه",
  "اللي", "حق", "تبون", "تبي", "ابي", "نبى", "نبي",
]);

function normalizeAr(s: string): string {
  return (s ?? "").toString().trim()
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/\u0623/g, "ا")
    .replace(/\u0625/g, "ا")
    .replace(/\u0622/g, "ا")
    .replace(/\u0629/g, "ه")
    .replace(/\u0649/g, "ي")
    .toLowerCase();
}

function tokens(s: string): string[] {
  return normalizeAr(s).split(" ").filter((w) => w && !STOP_WORDS.has(w));
}

function projectDetails(p: { name: string; status: string; location: string | null; description: string | null; duration: string | null }): string {
  const lines = [
    `📌 ${p.name}`,
    `الحالة: ${statusBadge(p.status)}`,
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