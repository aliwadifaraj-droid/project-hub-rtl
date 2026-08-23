import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import { getRolesForUser, findUserById } from "./users.repo";
import * as teamRepo from "./team-chat.repo";

export const listTeamMessages = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    void context;
    const msgs = await teamRepo.listTeamMessages(500);
    const ids = Array.from(new Set(msgs.map((m) => m.user_id)));
    const meta = new Map<string, { email: string; role: "admin" | "employee" | "user" }>();
    for (const id of ids) {
      const [u, roles] = await Promise.all([findUserById(id), getRolesForUser(id)]);
      meta.set(id, {
        email: u?.email ?? "?",
        role: (roles.includes("admin") ? "admin" : roles.includes("employee") ? "employee" : "user"),
      });
    }

    return msgs.map((m) => ({
      ...m,
      sender_email: meta.get(m.user_id)?.email ?? "?",
      sender_role: meta.get(m.user_id)?.role ?? "user",
    }));
  });

export const sendTeamMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { body: string }) =>
    z.object({ body: z.string().trim().min(1).max(4000) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await teamRepo.insertTeamMessage(context.userId, data.body);
    return { ok: true };
  });

export const deleteTeamMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await getRolesForUser(context.userId);
    const isAdmin = roles.includes("admin");
    await teamRepo.deleteTeamMessage(data.id, isAdmin ? undefined : context.userId);
    return { ok: true };
  });

export const countUnreadTeamMessages = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { since: string | null }) =>
    z.object({ since: z.string().nullable() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    return { count: await teamRepo.countUnreadTeamMessages(context.userId, data.since) };
  });

export const deleteAllTeamMessages = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const roles = await getRolesForUser(context.userId);
    if (!roles.includes("admin")) throw new Error("Forbidden");
    await teamRepo.deleteAllTeamMessages();
    return { ok: true };
  });

