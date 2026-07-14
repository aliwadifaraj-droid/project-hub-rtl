import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import {
  listForUser,
  countUnreadForUser,
  markRead,
  markAllRead,
} from "./notifications.repo";

export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const rows = await listForUser(context.userId, 50);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      link: r.link,
      read: r.read,
      created_at: r.created_at,
    }));
  });

export const countMyUnreadNotifications = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    return await countUnreadForUser(context.userId);
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await markRead(context.userId, data.id);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await markAllRead(context.userId);
    return { ok: true };
  });
