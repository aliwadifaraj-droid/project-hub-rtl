import * as supportRepo from "./support.repo";

export const ALERT_MARKER = "__ALERT_SENT__";
export const PRIORITY_ALERT_MARKER = "__PRIORITY_ALERT_SENT__";

export const VIP_LOOP_MESSAGES = [
  "🔥 باقة VIP - 100 ريال / 30 يوم\nمشاريع خاصة توصلك مباشرة بدون منافسة + دعم فني VIP\nللاشتراك اكتب: اشتراك",
  "⏳ كل الموظفين مشغولين حالياً، يرجى الانتظار. سيتم الرد عليك قريباً",
  "💎 باقة VIP - 200 ريال / 60 يوم\nأولوية في الرد + مشاريع حصرية بدون منافس. الأكثر طلباً\nللاشتراك اكتب: اشتراك",
  "⏳ كل الموظفين مشغولين حالياً، يرجى الانتظار. سيتم الرد عليك قريباً",
  "👑 باقة VIP - 300 ريال / 90 يوم\nأطول مدة + دعم فني فوري + قيمة أفضل\nللاشتراك اكتب: اشتراك",
  "⏳ كل الموظفين مشغولين حالياً، يرجى الانتظار. سيتم الرد عليك قريباً",
] as const;

const APOLOGY_MESSAGES = [
  "نعتذر عن التأخير 🙏 فريقنا يستقبل أكبر عدد من الطلبات حالياً لضمان جودة الرد. تذكير: عند اشتراكك في VIP توصلك المشاريع مباشرة بدون انتظار",
  "تبغى نرسل لك نموذج الاشتراك الآن؟ اكتب: اشتراك او اكتب: موظف للحصول على أولوية",
] as const;

const LOOP_DELAY = "40s";

type EscalationJob = {
  type: "alert" | "loop";
  chatId: string;
  startIso: string;
  loopIndex?: number;
};

function workerUrl(): string {
  const baseUrl = process.env.VITE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) throw new Error("VITE_URL is required for escalation scheduling");
  return `${baseUrl}/api/escalation-worker`;
}

async function publish(job: EscalationJob, delay: string): Promise<void> {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error("QSTASH_TOKEN is required for escalation scheduling");

  const response = await fetch(`https://qstash.upstash.io/v2/publish/${encodeURIComponent(workerUrl())}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Upstash-Delay": delay,
      "Upstash-Forward-Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(job),
  });
  if (!response.ok) throw new Error(`QStash publish failed: ${response.status}`);
}

export function scheduleEscalationWatchers(chatId: string, startIso: string): Promise<void> {
  return Promise.all([
    publish({ type: "alert", chatId, startIso }, "20s"),
    publish({ type: "loop", chatId, startIso, loopIndex: 0 }, "40s"),
  ]).then(() => undefined);
}

export async function sendWaitingAlert(chatId: string, visitorName: string | null, priority: boolean = false): Promise<void> {
  const to = process.env.VITE_ALERT_EMAIL || process.env.ALERT_EMAIL;
  const key = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!to || !key) return;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: "Alamran <send@ali-alhaddad.com>",
        to: [to],
        subject: priority ? "🚨🚨 عميل ينتظر - أولوية قصوى" : "🚨 عميل ينتظر",
        html: `<p><strong>الاسم:</strong> ${visitorName ?? "زائر"}</p><p><strong>customer_id:</strong> ${chatId}</p>${priority ? "<p><strong>⚠️ العميل كتب موظف مرة أخرى - يرجى الرد بأسرع وقت</strong></p>" : ""}`,
      }),
    });
    if (!response.ok) console.error("waiting alert failed", response.status);
  } catch (error) {
    console.error("waiting alert exception", error);
  }
}

export async function agentRepliedSince(chatId: string, startIso: string): Promise<boolean> {
  const messages = await supportRepo.listMessages(chatId, startIso);
  return messages.some((message) => message.sender === "admin");
}

export async function recentAlertExists(chatId: string, marker: string = ALERT_MARKER): Promise<boolean> {
  const messages = await supportRepo.listMessages(chatId);
  return messages.some((message) => message.sender === "system" && message.body === marker && message.created_at > new Date(Date.now() - 10 * 60 * 1000).toISOString());
}

export async function runEscalationJob(job: EscalationJob): Promise<void> {
  const chat = await supportRepo.getChatById(job.chatId);
  if (!chat || chat.status !== "escalated") return;
  if (await agentRepliedSince(job.chatId, job.startIso)) return;

  if (job.type === "alert") {
    if (await recentAlertExists(job.chatId)) return;
    await sendWaitingAlert(job.chatId, chat.visitor_name);
    await supportRepo.addSupportMessage(job.chatId, "system", ALERT_MARKER);
    return;
  }

  const loopIndex = job.loopIndex ?? 0;
  const messageIndex = loopIndex % VIP_LOOP_MESSAGES.length;
  const completedLoops = Math.floor(loopIndex / VIP_LOOP_MESSAGES.length) + (messageIndex === VIP_LOOP_MESSAGES.length - 1 ? 1 : 0);
  if (messageIndex === VIP_LOOP_MESSAGES.length - 1 && completedLoops > 0 && completedLoops % 2 === 0) {
    await supportRepo.addSupportMessage(job.chatId, "bot", APOLOGY_MESSAGES.join("\n\n"));
  }
  await supportRepo.addSupportMessage(job.chatId, "bot", VIP_LOOP_MESSAGES[messageIndex]);
  await publish({ type: "loop", chatId: job.chatId, startIso: job.startIso, loopIndex: loopIndex + 1 }, LOOP_DELAY);
}
