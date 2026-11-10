import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { render } from "@react-email/components";
import { requireAdmin, requireAuth } from "./auth-middleware.server";
import * as meetingsRepo from "./meetings.repo";
import { sendResendEmailWithResult } from "./resend-send.server";
import { MeetingInvitationEmail } from "./email-templates/meeting-invitation";
import { MeetingNoShowEmail } from "./email-templates/meeting-no-show";
import { buildAgoraRtcToken } from "./agora-token.server";
import { readAgoraSettings } from "./site-settings.functions";

const clientSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().trim().max(200),
});

const MEETING_TOKEN_TTL_SECONDS = 2 * 60 * 60;

function canAccessMeeting(
  meeting: { client_email: string; owner_email: string },
  context: { email: string; roles?: readonly string[] },
) {
  if (context.roles?.includes("admin")) return true;
  const email = context.email.toLowerCase();
  return meeting.client_email.toLowerCase() === email || meeting.owner_email.toLowerCase() === email;
}

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
    const results: Array<{ client_email: string; client_name: string; emailed: boolean; emailError: string | null }> = [];

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
      let emailError: string | null = null;
      try {
        const html = await render(
          MeetingInvitationEmail({
            clientName: client.name,
            ownerName: data.owner_name,
            meetingDate: data.meeting_date,
            meetingTime: data.meeting_time,
          }),
        );
        const sent = await sendResendEmailWithResult({
          to: client.email,
          subject: `دعوة لحضور اجتماع — ${data.meeting_date} ${data.meeting_time}`,
          html,
        });
        emailed = sent.ok;
        if (!sent.ok) emailError = sent.error;
      } catch (e) {
        console.error("Failed to send meeting email to", client.email, e);
        emailError = e instanceof Error ? e.message : "تعذّر تجهيز الإيميل";
      }

      results.push({
        client_email: row.client_email,
        client_name: row.client_name,
        emailed,
        emailError,
      });
    }

    return { created: results.length, results };
  });

export const adminListUpcomingMeetings = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return meetingsRepo.listUpcomingForAdmin();
  });

export const listMyUpcomingMeetings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    if (context.roles?.includes("admin")) return meetingsRepo.listUpcomingForAdmin();
    const email = context.email;
    return meetingsRepo.listUpcomingByEmail(email);
  });

export const getMeetingDetails = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const meeting = await meetingsRepo.getMeetingById(data.id);
    if (!meeting) throw new Error("الاجتماع غير موجود");
    if (!canAccessMeeting(meeting, context)) {
      throw new Error("غير مصرح لهذا الاجتماع");
    }
    return meeting;
  });

export const joinMeeting = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const meeting = await meetingsRepo.getMeetingById(data.id);
    if (!meeting) throw new Error("الاجتماع غير موجود");
    if (!canAccessMeeting(meeting, context)) {
      throw new Error("غير مصرح لهذا الاجتماع");
    }
    if (meeting.status === "closed" || meeting.status === "no_show") {
      throw new Error("الاجتماع منتهي");
    }
    const agoraSettings = await readAgoraSettings();
    const appId = agoraSettings.appId || process.env.AGORA_APP_ID?.trim() || null;
    if (!appId) {
      throw new Error("إعدادات غرفة الاجتماع غير مكتملة. الحقل الناقص: Agora App ID.");
    }
    const appCertificate =
      agoraSettings.appCertificate || process.env.AGORA_APP_CERTIFICATE?.trim() || null;
    const channelName = `meeting_${meeting.id}`;
    const token = buildAgoraRtcToken({
      appId,
      appCertificate,
      channelName,
      ttlSeconds: MEETING_TOKEN_TTL_SECONDS,
    });
    await meetingsRepo.markMeetingJoined(data.id);
    return { appId, token: token ?? null, channelName };
  });

export const closeMeeting = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const meeting = await meetingsRepo.getMeetingById(data.id);
    if (!meeting) throw new Error("الاجتماع غير موجود");
    if (!canAccessMeeting(meeting, context)) {
      throw new Error("غير مصرح لهذا الاجتماع");
    }
    await meetingsRepo.markMeetingClosed(data.id);
    return { ok: true };
  });

export const reportMeetingNoShow = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
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
      const sent = await sendResendEmailWithResult({
        to: meeting.client_email,
        subject: `لم يتم الحضور في الموعد — ${meeting.meeting_date} ${meeting.meeting_time}`,
        html,
      });
      emailed = sent.ok;
    } catch (e) {
      console.error("Failed to send no-show email", e);
    }

    return { ok: true, emailed };
  });
