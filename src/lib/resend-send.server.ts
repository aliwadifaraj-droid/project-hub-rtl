export async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY missing — skipping email");
    return false;
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
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend send failed", res.status, errText);
      return false;
    }
    console.log("Resend email sent to", opts.to);
    return true;
  } catch (e) {
    console.error("Resend send exception", e);
    return false;
  }
}
