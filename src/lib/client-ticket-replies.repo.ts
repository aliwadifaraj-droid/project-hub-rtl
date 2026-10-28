import { db } from "./db";

type AppendClientReplyInput = {
  ticketId: string;
  clientId: string;
  message: string;
};

export async function appendClientTicketReply(input: AppendClientReplyInput): Promise<boolean> {
  const messageId = crypto.randomUUID();
  const result = await db.execute(
    `INSERT INTO ticket_messages (id, ticket_id, sender_type, sender_id, message, attachment_url, created_at)
     SELECT ?, id, 'client', ?, ?, NULL, unixepoch()
     FROM tickets
     WHERE id = ? AND user_id = ?`,
    [messageId, input.clientId, input.message.trim(), input.ticketId, input.clientId],
  );

  if (result.rowsAffected !== 1) return false;

  await db.execute(
    `UPDATE tickets
     SET status = 'open', updated_at = unixepoch()
     WHERE id = ? AND user_id = ?`,
    [input.ticketId, input.clientId],
  );

  return true;
}
