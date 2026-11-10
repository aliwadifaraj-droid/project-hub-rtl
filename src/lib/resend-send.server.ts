export type ResendSendResult = { ok: true } | { ok: false; error: string };

export async function sendResendEmailWithResult(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY missing — skipping email");
    return { ok: false, error: "مفتاح البريد (RESEND_API_KEY) غير مضبوط" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Alamran <send@ali-alhaddad.com>",
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend send failed", res.status, errText);
      return { ok: false, error: `Resend ${res.status}: ${errText.slice(0, 300)}` };
    }
    console.log("Resend email sent to", opts.to);
    return { ok: true };
  } catch (e) {
    console.error("Resend send exception", e);
    return { ok: false, error: e instanceof Error ? e.message : "فشل الاتصال بخدمة البريد" };
  }
}

export async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}): Promise<boolean> {
  return (await sendResendEmailWithResult(opts)).ok;
}
