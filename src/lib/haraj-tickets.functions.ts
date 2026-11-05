import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "./auth-middleware.server";
import { getSessionClaims } from "./auth.server";
import { db, rowsToObjects } from "./db";
import * as harajRepo from "./haraj.repo";
import * as ticketsRepo from "./tickets.repo";
import { appendClientTicketReply } from "./client-ticket-replies.repo";

const TEACHER_ROLE = "teacher";

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.enum(["order", "payment", "technical", "general"]),
  message: z.string().trim().min(3).max(5000),
});

const ticketIdSchema = z.object({ id: z.string().uuid() });

const replySchema = ticketIdSchema.extend({ message: z.string().trim().min(1).max(5000) });

async function requireOwnedTicket(id: string, userId: string): Promise<ticketsRepo.TicketRow> {
  const ticket = await ticketsRepo.getTicketById(id);
  if (!ticket || ticket.user_id !== userId) throw new Error("التذكرة غير موجودة");
  return ticket;
}

async function findTeacherForTicket(userId: string, email: string): Promise<harajRepo.TeacherMarketRow | null> {
  const teacherByEmail = await harajRepo.findTeacherByEmail(email);
  if (teacherByEmail) return teacherByEmail;

  const result = await db.execute(
    `SELECT market.*
     FROM teachers_market AS market
     INNER JOIN teachers AS login ON lower(market.email) = lower(login.email)
     WHERE login.id = ? LIMIT 1`,
    [userId],
  );
  const row = rowsToObjects<Record<string, unknown>>(result)[0];
  if (!row) return null;
  return {
    id: String(row.id ?? row.uuid ?? row.teacher_id ?? ""),
    full_name: String(row.full_name ?? row.name ?? row.teacher_name ?? row.fullName ?? ""),
    phone: String(row.phone ?? row.phone_number ?? row.mobile ?? row.mobile_number ?? ""),
    city: String(row.city ?? row.location ?? row.region ?? ""),
    profession: String(row.profession ?? row.job ?? row.occupation ?? row.specialty ?? ""),
    email: String(row.email ?? row.email_address ?? email),
    status: String(row.status ?? "active"),
    created_at: String(row.created_at ?? row.registered_at ?? row.createdAt ?? ""),
  };
}

export const listMyHarajTickets = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    return ticketsRepo.listTicketsByUser(context.userId);
  });

export const createHarajTicket = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => createTicketSchema.parse(data))
  .handler(async ({ data, context }) => {
    const claims = await getSessionClaims();
    const teacher = claims ? await findTeacherForTicket(context.userId, claims.email) : null;
    const id = await ticketsRepo.createTicket({
      user_id: context.userId,
      user_role: TEACHER_ROLE,
      client_company_name: teacher?.full_name || null,
      subject: data.subject,
      category: data.category,
      priority: "medium",
      message: data.message,
    });
    return { id };
  });

export const markMyHarajTicketRead = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ticketIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireOwnedTicket(data.id, context.userId);
    await ticketsRepo.markTicketMessagesRead(data.id, context.userId);
    return { ok: true };
  });

export const getMyHarajTicket = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ticketIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ticket = await requireOwnedTicket(data.id, context.userId);
    const messages = await ticketsRepo.listTicketMessages(data.id);
    await ticketsRepo.markTicketMessagesRead(data.id, context.userId);
    const refreshedTicket = await ticketsRepo.getTicketById(data.id);
    return { ticket: refreshedTicket ?? ticket, messages };
  });

export const replyToMyHarajTicket = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => replySchema.parse(data))
  .handler(async ({ data, context }) => {
    const appended = await appendClientTicketReply({ ticketId: data.id, clientId: context.userId, message: data.message });
    if (!appended) throw new Error("التذكرة غير موجودة أو لا تملك صلاحية الرد عليها");
    return { ok: true };
  });

export const closeMyHarajTicket = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ticketIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireOwnedTicket(data.id, context.userId);
    await ticketsRepo.updateTicketStatus(data.id, "closed");
    return { ok: true };
  });
