import { d as db, r as rowsToObjects } from "./db-BSVZwhof.mjs";
import "../_libs/bcryptjs.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";

import "./server-BNqJEEJz.mjs";
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
    question: String(row.question ?? ""),
    answer: String(row.answer ?? ""),
    keywords: parseKeywords(row.keywords),
    is_active: Number(row.is_active) === 1,
    sort_order: Number(row.sort_order ?? 0),
    action: row.action ?? "none",
    created_at: row.created_at ?? void 0,
    updated_at: row.updated_at ?? void 0
  };
}
function parseKeywords(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}
async function searchActiveQa(tokens, limit = 6) {
  if (!tokens.length) {
    const r2 = await db.execute(
      "SELECT * FROM bot_qa WHERE is_active = 1 ORDER BY sort_order ASC LIMIT ?",
      [limit]
    );
    return rowsToObjects(r2).map(decode);
  }
  const ors = tokens.map(() => "(question LIKE ? OR answer LIKE ?)").join(" OR ");
  const args = [];
  for (const t of tokens) {
    args.push(`%${t}%`, `%${t}%`);
  }
  args.push(limit);
  const r = await db.execute(
    `SELECT * FROM bot_qa WHERE is_active = 1 AND (${ors}) ORDER BY sort_order ASC LIMIT ?`,
    args
  );
  return rowsToObjects(r).map(decode);
}
async function listActiveQa() {
  const r = await db.execute(
    "SELECT * FROM bot_qa WHERE is_active = 1 ORDER BY sort_order ASC",
    []
  );
  return rowsToObjects(r).map(decode);
}
async function listActiveForVisitors() {
  const r = await db.execute(
    "SELECT id,question,answer,keywords,sort_order,action FROM bot_qa WHERE is_active = 1 ORDER BY sort_order ASC",
    []
  );
  return rowsToObjects(r).map(decode).map(({ id, question, answer, keywords, sort_order, action }) => ({
    id,
    question,
    answer,
    keywords,
    sort_order,
    action
  }));
}
async function getQaById(id) {
  const r = await db.execute(
    "SELECT answer, action FROM bot_qa WHERE id = ? AND is_active = 1 LIMIT 1",
    [id]
  );
  const rows = rowsToObjects(r);
  if (!rows.length) return null;
  return { answer: String(rows[0].answer ?? ""), action: rows[0].action ?? "none" };
}
async function listAllQa() {
  const r = await db.execute(
    "SELECT * FROM bot_qa ORDER BY sort_order ASC",
    []
  );
  return rowsToObjects(r).map(decode);
}
async function upsertQa(input) {
  const kw = JSON.stringify(input.keywords ?? []);
  const active = input.is_active ? 1 : 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (input.id) {
    await db.execute(
      `UPDATE bot_qa SET question=?, answer=?, keywords=?, is_active=?, sort_order=?, action=?, updated_at=? WHERE id=?`,
      [input.question, input.answer, kw, active, input.sort_order, input.action, now, input.id]
    );
  } else {
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO bot_qa (id, question, answer, keywords, is_active, sort_order, action, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.question, input.answer, kw, active, input.sort_order, input.action, now, now]
    );
  }
}
async function deleteQa(id) {
  await db.execute("DELETE FROM bot_qa WHERE id = ?", [id]);
}
export {
  deleteQa,
  getQaById,
  listActiveForVisitors,
  listActiveQa,
  listAllQa,
  searchActiveQa,
  upsertQa
};
