import * as supportRepo from "./support.repo";

export const ALERT_MARKER = "__ALERT_SENT__";
export const PRIORITY_ALERT_MARKER = "__PRIORITY_ALERT_SENT__";
export const ESCALATION_START_MARKER = "__ESCALATION_START__";

export async function sendWaitingAlert(chatId: string, visitorName: string | null, priority: boolean = false): Promise<void> {
  const to = process.env.VITE_ALERT_EMAIL || process.env.ALERT_EMAIL;
  const key = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!to || !key) {
    console.error("[escalation] alert email/key missing");
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: "Alamran <send@ali-alhaddad.com>",
        to: [to],
        subject: priority ? "🚨🚨 عميل ينتظر - أولوية قصوى" : "🚨 عميل ينتظر",
        html: `<p><strong>الاسم:</strong> ${visitorName ?? "زائر"}</p><p><strong>customer_id:</strong> ${chatId}</p>${priority ? "<p><strong>⚠️ العميل كرر طلب الموظف - يرجى الرد بأسرع وقت</strong></p>" : ""}`,
      }),
    });
    if (!response.ok) console.error("[escalation] waiting alert failed", response.status);
  } catch (error) {
    console.error("[escalation] waiting alert exception", error);
  }
}

export async function agentRepliedSince(chatId: string, startIso: string): Promise<boolean> {
  const messages = await supportRepo.listMessages(chatId, startIso);
  return messages.some((message) => message.sender === "admin");
}

export async function recentAlertExists(chatId: string, marker: string = ALERT_MARKER): Promise<boolean> {
  const messages = await supportRepo.listMessages(chatId);
  return messages.some(
    (message) =>
      message.sender === "system" &&
      message.body === marker &&
      message.created_at > new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  );
}

const BUSY_REPLY = "كل الموظفين مشغولين حالياً. كيف أقدر أساعدك؟";

export async function checkEscalationTimers(chatId: string): Promise<void> {
  const chat = await supportRepo.getChatById(chatId);
  if (!chat || chat.status !== "escalated") return;

  const messages = await supportRepo.listMessages(chatId);
  const startMsg = messages.find((m) => m.sender === "system" && m.body === ESCALATION_START_MARKER);
  if (!startMsg) return;

  const startTime = new Date(startMsg.created_at).getTime();
  const elapsedMs = Date.now() - startTime;

  if (await agentRepliedSince(chatId, startMsg.created_at)) return;

  if (elapsedMs >= 30_000 && !(await recentAlertExists(chatId, ALERT_MARKER))) {
    console.log("[escalation] 30s reached — sending Resend alert for chat", chatId);
    await sendWaitingAlert(chatId, chat.visitor_name);
    await supportRepo.addSupportMessage(chatId, "system", ALERT_MARKER);
  }

  const hasBusyReply = messages.some(
    (m) => m.sender === "bot" && m.body === BUSY_REPLY && m.created_at > startMsg.created_at,
  );
  if (elapsedMs >= 60_000 && !hasBusyReply) {
    console.log("[escalation] 60s reached — sending busy reply for chat", chatId);
    await supportRepo.addSupportMessage(chatId, "bot", BUSY_REPLY);
  }
}
