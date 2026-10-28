import { db } from "./db";

let tablesReady: Promise<void> | null = null;

function ensureTicketTables(): Promise<void> {
  if (tablesReady) return tablesReady;
  tablesReady = db.execute(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch()),
      client_read_admin_count INTEGER NOT NULL DEFAULT 0,
      client_company_name TEXT
    )
  `).then(() => db.execute(`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      sender_type TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message TEXT NOT NULL,
      attachment_url TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `)).then(() => undefined);
  return tablesReady;
}

type AppendClientReplyInput = {
  ticketId: string;
  clientId: string;
  message: string;
};

export async function appendClientTicketReply(input: AppendClientReplyInput): Promise<boolean> {
  await ensureTicketTables();
  const messageId = crypto.randomUUID();
  const results = await db.batch([
    {
      sql: `INSERT INTO ticket_messages (id, ticket_id, sender_type, sender_id, message, attachment_url, created_at)
            SELECT ?, id, 'client', ?, ?, NULL, unixepoch()
            FROM tickets
            WHERE id = ? AND user_id = ?`,
      args: [messageId, input.clientId, input.message.trim(), input.ticketId, input.clientId],
    },
    {
      sql: `UPDATE tickets
            SET status = 'open', updated_at = unixepoch()
            WHERE id = ? AND user_id = ?`,
      args: [input.ticketId, input.clientId],
    },
  ]);

  return results[0].rowsAffected === 1;
}
