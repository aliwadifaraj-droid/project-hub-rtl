import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSessionClaims } from "./auth.server";
import { db, rowsToObjects } from "./db";
import * as ticketsRepo from "./tickets.repo";
import { appendOwnerTicketReply } from "./owner-ticket-replies.repo";

async function getRequiredOwnerId(): Promise<string> {
  const claims = await getSessionClaims();
  if (!claims?.roles.includes("project_owner")) throw new Error("يجب تسجيل الدخول كصاحب مشروع");
  const result = await db.execute(
    "SELECT 1 FROM project_owner_sessions WHERE owner_id = ? AND revoked_at IS NULL LIMIT 1",
    [claims.sub],
  );
  if (rowsToObjects(result).length === 0) throw new Error("جلسة صاحب المشروع غير صالحة");
  return claims.sub;
}

export const listMyOwnerTickets = createServerFn({ method: "GET" }).handler(async () => {
  const ownerId = await getRequiredOwnerId();
  return ticketsRepo.listTicketsByUserAndRole(ownerId, "owner");
});

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.enum(["order", "payment", "technical", "general"]),
  message: z.string().trim().min(3).max(5000),
});

export const createOwnerTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createTicketSchema.parse(data))
  .handler(async ({ data }) => {
    const ownerId = await getRequiredOwnerId();
    const id = await ticketsRepo.createTicket({
      user_id: ownerId,
      user_role: "owner",
      subject: data.subject,
      category: data.category,
      priority: "medium",
      message: data.message,
    });
    return { id };
  });

const ticketIdSchema = z.object({ id: z.string().uuid() });

export const markMyOwnerTicketRead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ticketIdSchema.parse(data))
  .handler(async ({ data }) => {
    const ownerId = await getRequiredOwnerId();
    await ticketsRepo.markTicketMessagesRead(data.id, ownerId);
    return { ok: true };
  });

export const getMyOwnerTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ticketIdSchema.parse(data))
  .handler(async ({ data }) => {
    const ownerId = await getRequiredOwnerId();
    const ticket = await ticketsRepo.getTicketForOwner(data.id, ownerId);
    if (!ticket) throw new Error("التذكرة غير موجودة");
    const messages = await ticketsRepo.listTicketMessages(data.id);
    await ticketsRepo.markTicketMessagesRead(data.id, ownerId);
    const refreshedTicket = await ticketsRepo.getTicketForOwner(data.id, ownerId);
    return { ticket: refreshedTicket ?? ticket, messages };
  });

const replySchema = ticketIdSchema.extend({ message: z.string().trim().min(1).max(5000) });

export const replyToMyOwnerTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => replySchema.parse(data))
  .handler(async ({ data }) => {
    const ownerId = await getRequiredOwnerId();
    const appended = await appendOwnerTicketReply({ ticketId: data.id, ownerId, message: data.message });
    if (!appended) throw new Error("التذكرة غير موجودة أو لا تملك صلاحية الرد عليها");
    return { ok: true };
  });

export const closeMyOwnerTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ticketIdSchema.parse(data))
  .handler(async ({ data }) => {
    const ownerId = await getRequiredOwnerId();
    const ticket = await ticketsRepo.getTicketForOwner(data.id, ownerId);
    if (!ticket) throw new Error("التذكرة غير موجودة");
    await ticketsRepo.updateTicketStatus(data.id, "closed");
    return { ok: true };
  });
