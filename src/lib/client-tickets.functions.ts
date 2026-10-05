import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSessionClaims } from "./auth.server";
import * as clientRepo from "./client.repo";
import * as ticketsRepo from "./tickets.repo";
import { db } from "./db";

async function requireClientId(): Promise<string> {
  const claims = await getSessionClaims();
  if (!claims) throw new Error("يجب تسجيل الدخول");
  const profile = await clientRepo.getClientProfile(claims.sub) ?? await clientRepo.getClientProfileByEmail(claims.email);
  if (!profile) throw new Error("جلسة العميل غير صالحة");
  return claims.sub;
}

async function markClientTicketRead(ticketId: string, clientId: string): Promise<void> {
  await db.execute(
    `UPDATE tickets
     SET client_read_admin_count = (
       SELECT COUNT(*) FROM ticket_messages
       WHERE ticket_id = ? AND sender_type = 'admin'
     )
     WHERE id = ? AND user_id = ?`,
    [ticketId, ticketId, clientId],
  );
}

export const listMyClientTickets = createServerFn({ method: "GET" }).handler(async () => {
  const clientId = await requireClientId();
  return ticketsRepo.listTicketsByUser(clientId);
});

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.enum(["order", "payment", "technical", "general"]),
  message: z.string().trim().min(3).max(5000),
});

export const createClientTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createTicketSchema.parse(data))
  .handler(async ({ data }) => {
    const clientId = await requireClientId();
    const id = await ticketsRepo.createTicket({ user_id: clientId, subject: data.subject, category: data.category, priority: "medium", message: data.message });
    return { id };
  });

const ticketIdSchema = z.object({ id: z.string().uuid() });

export const markMyClientTicketRead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ticketIdSchema.parse(data))
  .handler(async ({ data }) => {
    const clientId = await requireClientId();
    const ticket = await ticketsRepo.getTicketById(data.id);
    if (!ticket || ticket.user_id !== clientId) throw new Error("التذكرة غير موجودة");
    await markClientTicketRead(data.id, clientId);
    return { ok: true };
  });

export const getMyClientTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ticketIdSchema.parse(data))
  .handler(async ({ data }) => {
    const clientId = await requireClientId();
    const ticket = await ticketsRepo.getTicketById(data.id);
    if (!ticket || ticket.user_id !== clientId) throw new Error("التذكرة غير موجودة");
    const messages = await ticketsRepo.listTicketMessages(data.id);
    await markClientTicketRead(data.id, clientId);
    const refreshedTicket = await ticketsRepo.getTicketById(data.id);
    return { ticket: refreshedTicket ?? ticket, messages };
  });

const replySchema = ticketIdSchema.extend({ message: z.string().trim().min(1).max(5000) });

export const replyToMyClientTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => replySchema.parse(data))
  .handler(async ({ data }) => {
    const clientId = await requireClientId();
    const ticket = await ticketsRepo.getTicketById(data.id);
    if (!ticket || ticket.user_id !== clientId) throw new Error("التذكرة غير موجودة");
    await ticketsRepo.addTicketMessage({ ticket_id: data.id, sender_type: "user", sender_id: clientId, message: data.message });
    return { ok: true };
  });

export const closeMyClientTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ticketIdSchema.parse(data))
  .handler(async ({ data }) => {
    const clientId = await requireClientId();
    const ticket = await ticketsRepo.getTicketById(data.id);
    if (!ticket || ticket.user_id !== clientId) throw new Error("التذكرة غير موجودة");
    await ticketsRepo.updateTicketStatus(data.id, "closed");
    return { ok: true };
  });
