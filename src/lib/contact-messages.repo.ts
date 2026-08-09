import { db, rowsToObjects } from "./db";

export type ContactMessageRow = {
  id: string;
  name: string | null;
  email: string | null;
  message: string;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
};

function decode(row: any): ContactMessageRow {
  return {
    id: String(row.id),
    name: row.name ?? null,
    email: row.email ?? null,
    message: String(row.message ?? ""),
    reply: row.reply ?? null,
    replied_at: row.replied_at ?? null,
    created_at: String(row.created_at ?? ""),
  };
}

export async function insertContactMessage(input: { name: string; email: string; message: string }) {
  await db.execute(
    `INSERT INTO contact_messages (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), input.name, input.email, input.message, new Date().toISOString()],
  );
}

export async function listContactMessages(): Promise<ContactMessageRow[]> {
  const r = await db.execute(
    `SELECT id,name,email,message,reply,replied_at,created_at FROM contact_messages ORDER BY created_at DESC`,
  );
  return rowsToObjects(r).map(decode);
}

export async function countContactMessagesSince(since: string | null): Promise<number> {
  const r = since
    ? await db.execute(`SELECT COUNT(*) AS c FROM contact_messages WHERE created_at > ?`, [since])
    : await db.execute(`SELECT COUNT(*) AS c FROM contact_messages`);
  return Number((rowsToObjects<{ c: number }>(r)[0]?.c) ?? 0);
}

export async function deleteContactMessage(id: string): Promise<void> {
  await db.execute(`DELETE FROM contact_messages WHERE id = ?`, [id]);
}

export async function setContactReply(id: string, reply: string): Promise<void> {
  await db.execute(
    `UPDATE contact_messages SET reply = ?, replied_at = ? WHERE id = ?`,
    [reply, new Date().toISOString(), id],
  );
}

export async function getContactMessageById(id: string): Promise<ContactMessageRow | null> {
  const r = await db.execute(
    `SELECT id,name,email,message,reply,replied_at,created_at FROM contact_messages WHERE id = ? LIMIT 1`,
    [id],
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}