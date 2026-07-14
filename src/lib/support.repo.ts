import { db, rowsToObjects } from "./db";

export type SupportChatRow = {
  id: string;
  visitor_token: string | null;
  visitor_name: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
};

export type SupportMessageRow = {
  id: string;
  chat_id: string;
  sender: string;
  body: string;
  created_at: string;
};

function chat(row: any): SupportChatRow {
  return {
    id: String(row.id),
    visitor_token: row.visitor_token ?? row.visitor_id ?? null,
    visitor_name: row.visitor_name ?? null,
    status: String(row.status ?? "bot"),
    last_message_at: String(row.last_message_at ?? row.updated_at ?? row.created_at ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

function msg(row: any): SupportMessageRow {
  return {
    id: String(row.id),
    chat_id: String(row.chat_id),
    sender: String(row.sender ?? "visitor"),
    body: String(row.body ?? ""),
    created_at: String(row.created_at ?? ""),
  };
}

export async function getChatByVisitorToken(visitorToken: string): Promise<SupportChatRow | null> {
  const r = await db.execute(`SELECT * FROM support_chats WHERE visitor_id = ? LIMIT 1`, [visitorToken]);
  const row = rowsToObjects(r)[0];
  return row ? chat(row) : null;
}

export async function createVisitorChat(visitorToken: string, visitorName?: string | null): Promise<SupportChatRow> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO support_chats (id, visitor_id, status, created_at, updated_at)
     VALUES (?, ?, 'bot', ?, ?)`,
    [id, visitorToken, now, now],
  );
  return (await getChatByVisitorToken(visitorToken))!;
}

export async function addSupportMessage(chatId: string, sender: string, body: string): Promise<void> {
  const now = new Date().toISOString();
  await db.batch([
    { sql: `INSERT INTO support_messages (id, chat_id, sender, body, created_at) VALUES (?, ?, ?, ?, ?)`, args: [crypto.randomUUID(), chatId, sender, body, now] },
    { sql: `UPDATE support_chats SET updated_at = ? WHERE id = ?`, args: [now, chatId] },
  ]);
}

export async function listMessages(chatId: string, sinceIso?: string | null): Promise<SupportMessageRow[]> {
  const r = sinceIso
    ? await db.execute(`SELECT id,chat_id,sender,body,created_at FROM support_messages WHERE chat_id = ? AND created_at > ? ORDER BY created_at ASC`, [chatId, sinceIso])
    : await db.execute(`SELECT id,chat_id,sender,body,created_at FROM support_messages WHERE chat_id = ? ORDER BY created_at ASC`, [chatId]);
  return rowsToObjects(r).map(msg);
}

export async function botAlreadyAsked(chatId: string, body: string): Promise<boolean> {
  const r = await db.execute(`SELECT id FROM support_messages WHERE chat_id = ? AND sender = 'bot' AND body = ? LIMIT 1`, [chatId, body]);
  return rowsToObjects(r).length > 0;
}

export async function updateChatStatus(chatId: string, status: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute(`UPDATE support_chats SET status = ?, updated_at = ? WHERE id = ?`, [status, now, chatId]);
}

export async function deleteVisitorChat(visitorToken: string): Promise<void> {
  const c = await getChatByVisitorToken(visitorToken);
  if (!c) return;
  await db.batch([
    { sql: `DELETE FROM support_messages WHERE chat_id = ?`, args: [c.id] },
    { sql: `DELETE FROM support_chats WHERE id = ?`, args: [c.id] },
  ]);
}

export async function listSupportChats(): Promise<SupportChatRow[]> {
  const r = await db.execute(`SELECT * FROM support_chats ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 200`);
  return rowsToObjects(r).map(chat);
}

export async function getChatById(id: string): Promise<SupportChatRow | null> {
  const r = await db.execute(`SELECT * FROM support_chats WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects(r)[0];
  return row ? chat(row) : null;
}

export async function deleteAllSupport(): Promise<void> {
  await db.batch([{ sql: `DELETE FROM support_messages` }, { sql: `DELETE FROM support_chats` }]);
}

export async function countEscalatedChats(): Promise<number> {
  const r = await db.execute(`SELECT COUNT(*) AS c FROM support_chats WHERE status = 'escalated'`);
  return Number(rowsToObjects<{ c: number }>(r)[0]?.c ?? 0);
}