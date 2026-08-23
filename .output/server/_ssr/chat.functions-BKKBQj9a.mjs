import { c as createServerRpc } from "./createServerRpc-DYLDSQ_Q.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { r as requireAuth } from "./auth-middleware.server-B9hAjfqi.mjs";
import { h as findUserById, b as getRolesForUser } from "./users.repo-HvqqZq_-.mjs";
import { d as db, r as rowsToObjects } from "./db-D5OYORU-.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";

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

function decode(row) {
  return {
    id: String(row.id),
    user_id: String(row.user_id ?? row.author_id ?? ""),
    body: String(row.body ?? ""),
    created_at: String(row.created_at ?? "")
  };
}
async function listTeamMessages$1(limit = 500) {
  const r = await db.execute(
    `SELECT id, author_id AS user_id, body, created_at FROM team_messages ORDER BY created_at ASC LIMIT ?`,
    [limit]
  );
  return rowsToObjects(r).map(decode);
}
async function insertTeamMessage(userId, body) {
  await db.execute(
    `INSERT INTO team_messages (id, author_id, body, created_at) VALUES (?, ?, ?, ?)`,
    [crypto.randomUUID(), userId, body, (/* @__PURE__ */ new Date()).toISOString()]
  );
}
async function deleteTeamMessage$1(id, userId) {
  if (userId) await db.execute(`DELETE FROM team_messages WHERE id = ? AND author_id = ?`, [id, userId]);
  else await db.execute(`DELETE FROM team_messages WHERE id = ?`, [id]);
}
async function countUnreadTeamMessages$1(userId, since) {
  const where = since ? `WHERE author_id <> ? AND created_at > ?` : `WHERE author_id <> ?`;
  const args = since ? [userId, since] : [userId];
  const r = await db.execute(`SELECT COUNT(*) AS c FROM team_messages ${where}`, args);
  return Number(rowsToObjects(r)[0]?.c ?? 0);
}
async function deleteAllTeamMessages$1() {
  await db.execute(`DELETE FROM team_messages`);
}
const listTeamMessages_createServerFn_handler = createServerRpc({
  id: "5a07fa4a184d1a1748e919d1b3006b4633da0f254a8f503227346b1ef65ba315",
  name: "listTeamMessages",
  filename: "src/lib/chat.functions.ts"
}, (opts) => listTeamMessages.__executeServer(opts));
const listTeamMessages = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(listTeamMessages_createServerFn_handler, async ({
  context
}) => {
  const msgs = await listTeamMessages$1(500);
  const ids = Array.from(new Set(msgs.map((m) => m.user_id)));
  const meta = /* @__PURE__ */ new Map();
  for (const id of ids) {
    const [u, roles] = await Promise.all([findUserById(id), getRolesForUser(id)]);
    meta.set(id, {
      email: u?.email ?? "?",
      role: roles.includes("admin") ? "admin" : roles.includes("employee") ? "employee" : "user"
    });
  }
  return msgs.map((m) => ({
    ...m,
    sender_email: meta.get(m.user_id)?.email ?? "?",
    sender_role: meta.get(m.user_id)?.role ?? "user"
  }));
});
const sendTeamMessage_createServerFn_handler = createServerRpc({
  id: "1e581f7b957892bf14d2c14805cfbcd65fe1ebbb19cc8e82b1ca5f34370b0e5f",
  name: "sendTeamMessage",
  filename: "src/lib/chat.functions.ts"
}, (opts) => sendTeamMessage.__executeServer(opts));
const sendTeamMessage = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  body: stringType().trim().min(1).max(4e3)
}).parse(d)).handler(sendTeamMessage_createServerFn_handler, async ({
  data,
  context
}) => {
  await insertTeamMessage(context.userId, data.body);
  return {
    ok: true
  };
});
const deleteTeamMessage_createServerFn_handler = createServerRpc({
  id: "5a2d12acd651ca5b6782bc2b0bf306c82dcbdc1bea4ab7e8e78ce4337b26435a",
  name: "deleteTeamMessage",
  filename: "src/lib/chat.functions.ts"
}, (opts) => deleteTeamMessage.__executeServer(opts));
const deleteTeamMessage = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(deleteTeamMessage_createServerFn_handler, async ({
  data,
  context
}) => {
  const roles = await getRolesForUser(context.userId);
  const isAdmin = roles.includes("admin");
  await deleteTeamMessage$1(data.id, isAdmin ? void 0 : context.userId);
  return {
    ok: true
  };
});
const countUnreadTeamMessages_createServerFn_handler = createServerRpc({
  id: "6ea05b622530e225578c99ae382ff2bc70d12ece0966bed2cf5f1544500a7e0f",
  name: "countUnreadTeamMessages",
  filename: "src/lib/chat.functions.ts"
}, (opts) => countUnreadTeamMessages.__executeServer(opts));
const countUnreadTeamMessages = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  since: stringType().nullable()
}).parse(d)).handler(countUnreadTeamMessages_createServerFn_handler, async ({
  data,
  context
}) => {
  return {
    count: await countUnreadTeamMessages$1(context.userId, data.since)
  };
});
const deleteAllTeamMessages_createServerFn_handler = createServerRpc({
  id: "5e6ffd149a609aad6ed438bc6e7f2ad0c1aebc73f564aff8f9181ab657792bd8",
  name: "deleteAllTeamMessages",
  filename: "src/lib/chat.functions.ts"
}, (opts) => deleteAllTeamMessages.__executeServer(opts));
const deleteAllTeamMessages = createServerFn({
  method: "POST"
}).middleware([requireAuth]).handler(deleteAllTeamMessages_createServerFn_handler, async ({
  context
}) => {
  const roles = await getRolesForUser(context.userId);
  if (!roles.includes("admin")) throw new Error("Forbidden");
  await deleteAllTeamMessages$1();
  return {
    ok: true
  };
});
export {
  countUnreadTeamMessages_createServerFn_handler,
  deleteAllTeamMessages_createServerFn_handler,
  deleteTeamMessage_createServerFn_handler,
  listTeamMessages_createServerFn_handler,
  sendTeamMessage_createServerFn_handler
};
