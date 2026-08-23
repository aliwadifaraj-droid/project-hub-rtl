import { d as db, r as rowsToObjects } from "./db-D5OYORU-.mjs";
import "../_libs/bcryptjs.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";

import "./server-COznR7QB.mjs";
import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";





import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";

import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

function chat(row) {
  return {
    id: String(row.id),
    visitor_token: row.visitor_token ?? row.visitor_id ?? null,
    visitor_name: row.visitor_name ?? null,
    status: String(row.status ?? "bot"),
    last_message_at: String(row.last_message_at ?? row.updated_at ?? row.created_at ?? ""),
    created_at: String(row.created_at ?? "")
  };
}
function msg(row) {
  return {
    id: String(row.id),
    chat_id: String(row.chat_id),
    sender: String(row.sender ?? "visitor"),
    body: String(row.body ?? ""),
    created_at: String(row.created_at ?? "")
  };
}
async function getChatByVisitorToken(visitorToken) {
  const r = await db.execute(`SELECT * FROM support_chats WHERE visitor_id = ? LIMIT 1`, [visitorToken]);
  const row = rowsToObjects(r)[0];
  return row ? chat(row) : null;
}
async function createVisitorChat(visitorToken, visitorName) {
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute(
    `INSERT INTO support_chats (id, visitor_id, status, created_at, updated_at)
     VALUES (?, ?, 'bot', ?, ?)`,
    [id, visitorToken, now, now]
  );
  return await getChatByVisitorToken(visitorToken);
}
async function addSupportMessage(chatId, sender, body) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.batch([
    { sql: `INSERT INTO support_messages (id, chat_id, sender, body, created_at) VALUES (?, ?, ?, ?, ?)`, args: [crypto.randomUUID(), chatId, sender, body, now] },
    { sql: `UPDATE support_chats SET updated_at = ? WHERE id = ?`, args: [now, chatId] }
  ]);
}
async function listMessages(chatId, sinceIso) {
  const r = sinceIso ? await db.execute(`SELECT id,chat_id,sender,body,created_at FROM support_messages WHERE chat_id = ? AND created_at > ? ORDER BY created_at ASC`, [chatId, sinceIso]) : await db.execute(`SELECT id,chat_id,sender,body,created_at FROM support_messages WHERE chat_id = ? ORDER BY created_at ASC`, [chatId]);
  return rowsToObjects(r).map(msg);
}
async function botAlreadyAsked(chatId, body) {
  const r = await db.execute(`SELECT id FROM support_messages WHERE chat_id = ? AND sender = 'bot' AND body = ? LIMIT 1`, [chatId, body]);
  return rowsToObjects(r).length > 0;
}
async function updateChatStatus(chatId, status) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.execute(`UPDATE support_chats SET status = ?, updated_at = ? WHERE id = ?`, [status, now, chatId]);
}
async function deleteVisitorChat(visitorToken) {
  const c = await getChatByVisitorToken(visitorToken);
  if (!c) return;
  await db.batch([
    { sql: `DELETE FROM support_messages WHERE chat_id = ?`, args: [c.id] },
    { sql: `DELETE FROM support_chats WHERE id = ?`, args: [c.id] }
  ]);
}
async function listSupportChats() {
  const r = await db.execute(`SELECT * FROM support_chats ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 200`);
  return rowsToObjects(r).map(chat);
}
async function getChatById(id) {
  const r = await db.execute(`SELECT * FROM support_chats WHERE id = ? LIMIT 1`, [id]);
  const row = rowsToObjects(r)[0];
  return row ? chat(row) : null;
}
async function deleteAllSupport() {
  await db.batch([{ sql: `DELETE FROM support_messages` }, { sql: `DELETE FROM support_chats` }]);
}
async function countEscalatedChats() {
  const r = await db.execute(`SELECT COUNT(*) AS c FROM support_chats WHERE status = 'escalated'`);
  return Number(rowsToObjects(r)[0]?.c ?? 0);
}
export {
  addSupportMessage,
  botAlreadyAsked,
  countEscalatedChats,
  createVisitorChat,
  deleteAllSupport,
  deleteVisitorChat,
  getChatById,
  getChatByVisitorToken,
  listMessages,
  listSupportChats,
  updateChatStatus
};
