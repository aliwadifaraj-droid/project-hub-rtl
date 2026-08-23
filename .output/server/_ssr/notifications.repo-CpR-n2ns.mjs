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
    user_id: String(row.user_id),
    title: String(row.title ?? ""),
    body: row.body ?? null,
    link: row.link ?? null,
    read: Number(row.read) === 1,
    created_at: String(row.created_at ?? ""),
    project_id: row.project_id ?? null,
    project_name: row.project_name ?? null,
    company_name: row.company_name ?? null,
    email: row.email ?? null,
    facility_location: row.facility_location ?? null,
    pdf_key: row.pdf_key ?? null,
    pdf_filename: row.pdf_filename ?? null,
    amount: row.amount ?? null,
    source: row.source ?? null,
    submitter_type: row.submitter_type ?? null,
    offer_status: row.offer_status ?? null
  };
}
const OFFER_COLS = "project_id,project_name,company_name,email,facility_location,pdf_key,pdf_filename,amount,source,submitter_type,offer_status";
let _offerColsReady = null;
function ensureOfferColumns() {
  if (!_offerColsReady) {
    _offerColsReady = (async () => {
      const cols = [
        "project_id TEXT",
        "project_name TEXT",
        "company_name TEXT",
        "email TEXT",
        "facility_location TEXT",
        "pdf_key TEXT",
        "pdf_filename TEXT",
        "amount TEXT",
        "source TEXT",
        "submitter_type TEXT",
        "offer_status TEXT"
      ];
      for (const c of cols) {
        c.split(" ")[0];
        try {
          await db.execute(`ALTER TABLE notifications ADD COLUMN ${c}`);
        } catch {
        }
      }
    })().catch((e) => {
      _offerColsReady = null;
      throw e;
    });
  }
  return _offerColsReady;
}
async function listForUser(userId, limit = 50) {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
  return rowsToObjects(r).map(decode);
}
async function countUnreadForUser(userId) {
  const r = await db.execute(
    "SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read = 0",
    [userId]
  );
  const rows = rowsToObjects(r);
  return Number(rows[0]?.c ?? 0);
}
async function markRead(userId, id) {
  await db.execute(
    "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?",
    [id, userId]
  );
}
async function markAllRead(userId) {
  await db.execute(
    "UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0",
    [userId]
  );
}
async function insertOne(n) {
  await db.execute(
    `INSERT INTO notifications (id, user_id, title, body, link, read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      crypto.randomUUID(),
      n.user_id,
      n.title,
      n.body ?? null,
      n.link ?? null,
      (/* @__PURE__ */ new Date()).toISOString()
    ]
  );
}
async function insertMany(items) {
  if (!items.length) return;
  await db.batch(
    items.map((n) => ({
      sql: `INSERT INTO notifications (id, user_id, title, body, link, read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?)`,
      args: [
        crypto.randomUUID(),
        n.user_id,
        n.title,
        n.body ?? null,
        n.link ?? null,
        (/* @__PURE__ */ new Date()).toISOString()
      ]
    }))
  );
}
async function insertOfferNotification(n) {
  await ensureOfferColumns();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO notifications (id, user_id, title, body, link, read, created_at, ${OFFER_COLS})
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      n.user_id,
      n.title,
      n.body ?? null,
      n.link ?? null,
      (/* @__PURE__ */ new Date()).toISOString(),
      n.project_id ?? null,
      n.project_name ?? null,
      n.company_name ?? null,
      n.email ?? null,
      n.facility_location ?? null,
      n.pdf_key ?? null,
      n.pdf_filename ?? null,
      n.amount ?? null,
      n.source ?? null,
      n.submitter_type ?? null,
      n.offer_status ?? "new"
    ]
  );
  return id;
}
async function insertOfferNotificationMany(items) {
  if (!items.length) return [];
  await ensureOfferColumns();
  const ids = items.map(() => crypto.randomUUID());
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.batch(
    items.map((n, i) => ({
      sql: `INSERT INTO notifications (id, user_id, title, body, link, read, created_at, ${OFFER_COLS})
            VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        ids[i],
        n.user_id,
        n.title,
        n.body ?? null,
        n.link ?? null,
        now,
        n.project_id ?? null,
        n.project_name ?? null,
        n.company_name ?? null,
        n.email ?? null,
        n.facility_location ?? null,
        n.pdf_key ?? null,
        n.pdf_filename ?? null,
        n.amount ?? null,
        n.source ?? null,
        n.submitter_type ?? null,
        n.offer_status ?? "new"
      ]
    }))
  );
  return ids;
}
async function listOfferNotificationsBySource(source, limit = 500) {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications
     WHERE source = ? AND offer_status IS NOT NULL
     ORDER BY created_at DESC LIMIT ?`,
    [source, limit]
  );
  return rowsToObjects(r).map(decode);
}
async function listAllOfferNotifications(limit = 500) {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications
     WHERE offer_status IS NOT NULL
     ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return rowsToObjects(r).map(decode);
}
async function getOfferNotificationById(id) {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications WHERE id = ? LIMIT 1`,
    [id]
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}
async function getOfferNotificationByPdfPath(path) {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications WHERE pdf_key = ? LIMIT 1`,
    [path]
  );
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}
async function updateOfferNotificationStatus(id, status) {
  await ensureOfferColumns();
  await db.execute(`UPDATE notifications SET offer_status = ? WHERE id = ?`, [status, id]);
}
async function deleteOfferNotification(id) {
  await db.execute(`DELETE FROM notifications WHERE id = ?`, [id]);
}
async function countNewOfferNotifications() {
  await ensureOfferColumns();
  const r = await db.execute(
    `SELECT COUNT(*) AS c FROM notifications WHERE offer_status IN ('new','pending')`
  );
  return Number(rowsToObjects(r)[0]?.c ?? 0);
}
async function existsDuplicateOfferNotification(projectName, email, companyName) {
  await ensureOfferColumns();
  const p = (projectName ?? "").trim().toLowerCase();
  const e = (email ?? "").trim().toLowerCase();
  const c = (companyName ?? "").trim().toLowerCase();
  const r = await db.execute(
    `SELECT 1 FROM notifications
     WHERE offer_status IS NOT NULL
       AND LOWER(TRIM(COALESCE(project_name,''))) = ?
       AND (LOWER(TRIM(COALESCE(email,''))) = ? OR LOWER(TRIM(COALESCE(company_name,''))) = ?)
     LIMIT 1`,
    [p, e, c]
  );
  return rowsToObjects(r).length > 0;
}
async function existsDuplicateAddProjectNotification(email, companyName) {
  await ensureOfferColumns();
  const e = (email ?? "").trim().toLowerCase();
  const c = (companyName ?? "").trim().toLowerCase();
  const r = await db.execute(
    `SELECT 1 FROM notifications
     WHERE source = 'add_project'
       AND offer_status IS NOT NULL
       AND (LOWER(TRIM(COALESCE(email,''))) = ? OR LOWER(TRIM(COALESCE(company_name,''))) = ?)
     LIMIT 1`,
    [e, c]
  );
  return rowsToObjects(r).length > 0;
}
async function searchOfferNotificationsByEmail(email, limit = 50) {
  await ensureOfferColumns();
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return [];
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications
     WHERE offer_status IS NOT NULL AND LOWER(TRIM(COALESCE(email,''))) = ?
     ORDER BY created_at DESC LIMIT ?`,
    [e, limit]
  );
  return rowsToObjects(r).map(decode);
}
async function searchOfferNotificationsByCompany(name, limit = 50) {
  await ensureOfferColumns();
  const n = (name ?? "").trim().toLowerCase();
  if (!n) return [];
  const r = await db.execute(
    `SELECT id,user_id,title,body,link,read,created_at,${OFFER_COLS} FROM notifications
     WHERE offer_status IS NOT NULL AND LOWER(TRIM(COALESCE(company_name,''))) LIKE ?
     ORDER BY created_at DESC LIMIT ?`,
    [`%${n}%`, limit]
  );
  return rowsToObjects(r).map(decode);
}
export {
  countNewOfferNotifications,
  countUnreadForUser,
  deleteOfferNotification,
  ensureOfferColumns,
  existsDuplicateAddProjectNotification,
  existsDuplicateOfferNotification,
  getOfferNotificationById,
  getOfferNotificationByPdfPath,
  insertMany,
  insertOfferNotification,
  insertOfferNotificationMany,
  insertOne,
  listAllOfferNotifications,
  listForUser,
  listOfferNotificationsBySource,
  markAllRead,
  markRead,
  searchOfferNotificationsByCompany,
  searchOfferNotificationsByEmail,
  updateOfferNotificationStatus
};
