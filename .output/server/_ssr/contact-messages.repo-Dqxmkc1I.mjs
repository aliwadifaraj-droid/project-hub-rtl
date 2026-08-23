import { d as db, r as rowsToObjects } from "./db-D5OYORU-.mjs";
function decode(row) {
  return {
    id: String(row.id),
    name: row.name ?? null,
    email: row.email ?? null,
    message: String(row.message ?? ""),
    reply: row.reply ?? null,
    replied_at: row.replied_at ?? null,
    created_at: String(row.created_at ?? "")
  };
}
async function insertContactMessage(input) {
  await db.execute(
    `INSERT INTO contact_messages (id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), input.name, input.email, input.message, (/* @__PURE__ */ new Date()).toISOString()]
  );
}
async function listContactMessages() {
  const r = await db.execute(
    `SELECT id,name,email,message,reply,replied_at,created_at FROM contact_messages ORDER BY created_at DESC`
  );
  return rowsToObjects(r).map(decode);
}
async function countContactMessagesSince(since) {
  const r = since ? await db.execute(`SELECT COUNT(*) AS c FROM contact_messages WHERE created_at > ?`, [since]) : await db.execute(`SELECT COUNT(*) AS c FROM contact_messages`);
  return Number(rowsToObjects(r)[0]?.c ?? 0);
}
async function deleteContactMessage(id) {
  await db.execute(`DELETE FROM contact_messages WHERE id = ?`, [id]);
}
async function setContactReply(id, reply) {
  await db.execute(
    `UPDATE contact_messages SET reply = ?, replied_at = ? WHERE id = ?`,
    [reply, (/* @__PURE__ */ new Date()).toISOString(), id]
  );
}
async function getContactMessageById(id) {
  const r = await db.execute(
    `SELECT id,name,email,message,reply,replied_at,created_at FROM contact_messages WHERE id = ? LIMIT 1`,
    [id]
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}
export {
  countContactMessagesSince as c,
  deleteContactMessage as d,
  getContactMessageById as g,
  insertContactMessage as i,
  listContactMessages as l,
  setContactReply as s
};
