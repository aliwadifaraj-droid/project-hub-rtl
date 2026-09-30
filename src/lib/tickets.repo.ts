import { db, rowsToObjects } from "./db";

db.execute(`
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    order_id TEXT,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )
`).catch(() => undefined);

db.execute(`
  CREATE TABLE IF NOT EXISTS ticket_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  )
`).catch(() => undefined);

export type TicketRow = {
  id: string;
  user_id: string;
  order_id: string | null;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: number;
  updated_at: number;
};

export type TicketMessageRow = {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  created_at: number;
};

function decodeTicket(row: any): TicketRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    order_id: row.order_id ?? null,
    subject: String(row.subject ?? ""),
    category: String(row.category ?? ""),
    status: String(row.status ?? "open"),
    priority: String(row.priority ?? "medium"),
    created_at: Number(row.created_at ?? 0),
    updated_at: Number(row.updated_at ?? 0),
  };
}

function decodeMessage(row: any): TicketMessageRow {
  return {
    id: String(row.id),
    ticket_id: String(row.ticket_id),
    sender_type: String(row.sender_type ?? "user"),
    sender_id: String(row.sender_id ?? ""),
    message: String(row.message ?? ""),
    attachment_url: row.attachment_url ?? null,
    created_at: Number(row.created_at ?? 0),
  };
}

export async function createTicket(input: {
  user_id: string;
  order_id?: string | null;
  subject: string;
  category: string;
  priority?: string;
  message: string;
  attachment_url?: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  const msgId = crypto.randomUUID();
  await db.batch([
    {
      sql: `INSERT INTO tickets (id, user_id, order_id, subject, category, status, priority, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'open', ?, unixepoch(), unixepoch())`,
      args: [id, input.user_id, input.order_id ?? null, input.subject, input.category, input.priority ?? "medium"],
    },
    {
      sql: `INSERT INTO ticket_messages (id, ticket_id, sender_type, sender_id, message, attachment_url, created_at)
            VALUES (?, ?, 'user', ?, ?, ?, unixepoch())`,
      args: [msgId, id, input.user_id, input.message, input.attachment_url ?? null],
    },
  ]);
  return id;
}

export async function listTicketsByUser(userId: string): Promise<TicketRow[]> {
  const r = await db.execute(
    `SELECT * FROM tickets WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId],
  );
  return rowsToObjects(r).map(decodeTicket);
}

export async function listAllTickets(): Promise<TicketRow[]> {
  const r = await db.execute(
    `SELECT * FROM tickets ORDER BY updated_at DESC LIMIT 500`,
  );
  return rowsToObjects(r).map(decodeTicket);
}

export async function getTicketById(id: string): Promise<TicketRow | null> {
  const r = await db.execute(`SELECT * FROM tickets WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects(r)[0];
  return row ? decodeTicket(row) : null;
}

export async function listTicketMessages(ticketId: string): Promise<TicketMessageRow[]> {
  const r = await db.execute(
    `SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
    [ticketId],
  );
  return rowsToObjects(r).map(decodeMessage);
}

export async function addTicketMessage(input: {
  ticket_id: string;
  sender_type: string;
  sender_id: string;
  message: string;
  attachment_url?: string | null;
}): Promise<void> {
  await db.batch([
    {
      sql: `INSERT INTO ticket_messages (id, ticket_id, sender_type, sender_id, message, attachment_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, unixepoch())`,
      args: [crypto.randomUUID(), input.ticket_id, input.sender_type, input.sender_id, input.message, input.attachment_url ?? null],
    },
    {
      sql: `UPDATE tickets SET updated_at = unixepoch() WHERE id = ?`,
      args: [input.ticket_id],
    },
  ]);
}

export async function updateTicketStatus(id: string, status: string): Promise<void> {
  await db.execute(
    `UPDATE tickets SET status = ?, updated_at = unixepoch() WHERE id = ?`,
    [status, id],
  );
}

export async function updateTicketPriority(id: string, priority: string): Promise<void> {
  await db.execute(
    `UPDATE tickets SET priority = ?, updated_at = unixepoch() WHERE id = ?`,
    [priority, id],
  );
}

export async function countOpenTickets(): Promise<number> {
  const r = await db.execute(`SELECT COUNT(*) AS c FROM tickets WHERE status = 'open'`);
  return Number(rowsToObjects<{ c: number }>(r)[0]?.c ?? 0);
}

export async function countOpenTicketsByUser(userId: string): Promise<number> {
  const r = await db.execute(
    `SELECT COUNT(*) AS c FROM tickets WHERE user_id = ? AND status = 'open'`,
    [userId],
  );
  return Number(rowsToObjects<{ c: number }>(r)[0]?.c ?? 0);
}
