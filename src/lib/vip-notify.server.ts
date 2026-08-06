// Server-only: notify active VIP subscribers when a new project is created in their city.
import * as vipRepo from "./vip.repo";
import { SAUDI_CITIES } from "./saudi-cities";
import { sendResendEmail } from "./resend-send.server";

function siteUrl(): string {
  return "https://ali-alhaddad.com".replace(/\/$/, "");
}

/** Extracts a known Saudi city from a free-text project location. */
export function detectCity(location: string | null | undefined): string | null {
  if (!location) return null;
  const text = String(location);
  const match = SAUDI_CITIES.find((c) => text.includes(c));
  return match ?? null;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export async function notifyVipSubscribersOfNewProject(project: {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  duration?: string | null;
}): Promise<void> {
  try {
    const city = detectCity(project.location);
    if (!city) return;
    const subs = await vipRepo.listActiveByCity(city);
    if (subs.length === 0) return;

    const link = `${siteUrl()}/project/${project.id}`;
    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;padding:24px;line-height:1.9;background:#fff">
        <h2 style="margin:0 0 12px">مشروع جديد في ${esc(city)} 🎉</h2>
        <p style="margin:0 0 16px">تم إضافة مشروع جديد في مدينتك، وهذه تفاصيله:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#666">اسم المشروع</td><td style="padding:8px 0;font-weight:bold">${esc(project.name)}</td></tr>
          <tr><td style="padding:8px 0;color:#666">الموقع</td><td style="padding:8px 0;font-weight:bold">${esc(project.location ?? city)}</td></tr>
          ${project.duration ? `<tr><td style="padding:8px 0;color:#666">المدة</td><td style="padding:8px 0;font-weight:bold">${esc(project.duration)}</td></tr>` : ""}
          ${project.description ? `<tr><td style="padding:8px 0;color:#666">الوصف</td><td style="padding:8px 0">${esc(project.description)}</td></tr>` : ""}
        </table>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">
            التقديم على المشروع
          </a>
        </p>
        <p style="margin:0;font-size:12px;color:#888">وصلتك هذه الرسالة لأنك مشترك VIP في مدينة ${esc(city)}.</p>
      </div>`;

    for (const s of subs) {
      if (!s.email) continue;
      await sendResendEmail({
        to: s.email,
        subject: `مشروع جديد في ${city}: ${project.name}`,
        html,
      });
    }
  } catch (e) {
    console.error("[vip-notify] failed", e);
  }
}
