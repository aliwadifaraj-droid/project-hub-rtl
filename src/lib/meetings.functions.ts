import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { render } from "@react-email/components";
import { requireAdmin, requireAuth } from "./auth-middleware.server";
import * as meetingsRepo from "./meetings.repo";
import { sendResendEmail } from "./resend-send.server";
import { MeetingInvitationEmail } from "./email-templates/meeting-invitation";
import { MeetingNoShowEmail } from "./email-templates/meeting-no-show";
import { getSessionClaims } from "./auth.server";

const clientSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().trim().max(200),
});

export const createMeeting = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        owner_email: z.string().email().max(255),
        owner_name: z.string().trim().max(200),
        clients: z.array(clientSchema).min(1).max(50),
        meeting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        meeting_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const results: Array<{ client_email: string; client_name: string; emailed: boolean }> = [];

    for (const client of data.clients) {
      const row = await meetingsRepo.insertMeeting({
        owner_email: data.owner_email,
        owner_name: data.owner_name,
        client_email: client.email,
        client_name: client.name,
        meeting_date: data.meeting_date,
        meeting_time: data.meeting_time,
      });

      let emailed = false;
      try {
        const html = await render(
          MeetingInvitationEmail({
            clientName: client.name,
            ownerName: data.owner_name,
            meetingDate: data.meeting_date,
            meetingTime: data.meeting_time,
          }),
        );
        emailed = await sendResendEmail({
          to: client.email,
          subject: `دعوة لحضور اجتماع — ${data.meeting_date} ${data.meeting_time}`,
          html,
        });
      } catch (e) {
        console.error("Failed to send meeting email to", client.email, e);
      }

      results.push({
        client_email: row.client_email,
        client_name: row.client_name,
        emailed,
      });
    }

    return { created: results.length, results };
  });

export const listMyUpcomingMeetings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const email = context.email;
    return meetingsRepo.listUpcomingByEmail(email);
  });

export const getMeetingDetails = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const meeting = await meetingsRepo.getMeetingById(data.id);
    if (!meeting) throw new Error("الاجتماع غير موجود");
    const claims = await getSessionClaims();
    if (!claims) throw new Error("غير مصرح");
    const email = claims.email;
    if (meeting.client_email.toLowerCase() !== email.toLowerCase() && meeting.owner_email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("غير مصرح لهذا الاجتماع");
    }
    return meeting;
  });

export const joinMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const meeting = await meetingsRepo.getMeetingById(data.id);
    if (!meeting) throw new Error("الاجتماع غير موجود");
    const claims = await getSessionClaims();
    if (!claims) throw new Error("غير مصرح");
    const email = claims.email;
    if (meeting.client_email.toLowerCase() !== email.toLowerCase() && meeting.owner_email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("غير مصرح لهذا الاجتماع");
    }
    if (meeting.status === "closed" || meeting.status === "no_show") {
      throw new Error("الاجتماع منتهي");
    }
    await meetingsRepo.markMeetingJoined(data.id);
    const appId = process.env.AGORA_APP_ID || "";
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || "";
    const channelName = `meeting_${meeting.id}`;
    const token = await generateAgoraToken(appId, appCertificate, channelName, claims.sub);
    return { appId, token, channelName, uid: claims.sub };
  });

export const closeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const meeting = await meetingsRepo.getMeetingById(data.id);
    if (!meeting) throw new Error("الاجتماع غير موجود");
    const claims = await getSessionClaims();
    if (!claims) throw new Error("غير مصرح");
    if (meeting.client_email.toLowerCase() !== claims.email.toLowerCase() && meeting.owner_email.toLowerCase() !== claims.email.toLowerCase()) {
      throw new Error("غير مصرح لهذا الاجتماع");
    }
    await meetingsRepo.markMeetingClosed(data.id);
    return { ok: true };
  });

export const reportMeetingNoShow = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const meeting = await meetingsRepo.getMeetingById(data.id);
    if (!meeting) throw new Error("الاجتماع غير موجود");
    if (meeting.status === "closed" || meeting.status === "no_show") {
      return { ok: true, alreadyClosed: true };
    }
    await meetingsRepo.markMeetingNoShow(data.id);

    let emailed = false;
    try {
      const html = await render(
        MeetingNoShowEmail({
          clientName: meeting.client_name,
          ownerName: meeting.owner_name,
          meetingDate: meeting.meeting_date,
          meetingTime: meeting.meeting_time,
        }),
      );
      emailed = await sendResendEmail({
        to: meeting.client_email,
        subject: `لم يتم الحضور في الموعد — ${meeting.meeting_date} ${meeting.meeting_time}`,
        html,
      });
    } catch (e) {
      console.error("Failed to send no-show email", e);
    }

    return { ok: true, emailed };
  });

async function generateAgoraToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  account: string,
): Promise<string> {
  if (!appId || !appCertificate) {
    return "";
  }
  const now = Math.floor(Date.now() / 1000);
  const expireTime = now + 3600;
  const payload = {
    appid: appId,
    channelName,
    account,
    privilege: 262145,
    expireTime,
    nonce: crypto.randomUUID(),
  };
  const { createRemoteJWKSet, jwtVerify, SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(appCertificate);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(expireTime)
    .sign(secret);
  return token;
}
