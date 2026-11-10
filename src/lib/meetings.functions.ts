import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./auth-middleware.server";
import * as meetingsRepo from "./meetings.repo";

export const createMeeting = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z
      .object({
        owner_email: z.string().email().max(255),
        owner_name: z.string().trim().max(200),
        client_email: z.string().email().max(255),
        client_name: z.string().trim().max(200),
        meeting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        meeting_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    return meetingsRepo.insertMeeting(data);
  });
