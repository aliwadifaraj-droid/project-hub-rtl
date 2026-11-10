import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { render } from "@react-email/components";
import { requireAdmin } from "./auth-middleware.server";
import * as meetingsRepo from "./meetings.repo";
import { sendResendEmail } from "./resend-send.server";
import { MeetingInvitationEmail } from "./email-templates/meeting-invitation";

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
