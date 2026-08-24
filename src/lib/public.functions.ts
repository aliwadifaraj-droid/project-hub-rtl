import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { insertContactMessage } from "./contact-messages.repo";
import * as blockedRepo from "./blocked.repo";
import { BLOCKED_MESSAGE } from "./blocked.functions";

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(200),
    message: z.string().trim().min(1).max(2000),
  }).parse(d))
  .handler(async ({ data }) => {
    if (await blockedRepo.isBlocked(data.name, data.email)) throw new Error(BLOCKED_MESSAGE);
    await insertContactMessage(data);
    try {
      const { listUsersWithRoles } = await import("./users.repo");
      const { insertMany } = await import("./notifications.repo");
      const staff = (await listUsersWithRoles(500)).filter((u) => u.roles.includes("admin") || u.roles.includes("employee"));
      if (staff.length > 0) {
        await insertMany(
          staff.map((s) => ({
            user_id: s.id,
            title: "رسالة تواصل جديدة",
            body: `${data.name} — ${data.email}`,
            link: "/admin/messages",
          })),
        );
      }
    } catch (e) {
      console.error("contact notification failed", e);
    }
    return { ok: true };
  });
