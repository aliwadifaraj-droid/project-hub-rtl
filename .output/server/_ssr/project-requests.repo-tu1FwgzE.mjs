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

function decode(r) {
  return {
    id: String(r.id),
    project_id: r.project_id ?? null,
    company_name: r.company_name ?? null,
    facility_location: r.facility_location ?? null,
    email: r.email ?? null,
    pdf_url: r.pdf_url ?? null,
    status: String(r.status ?? "new"),
    submitter_type: r.submitter_type ?? null,
    project_type: r.project_type ?? null,
    note: r.note ?? null,
    created_at: String(r.created_at ?? "")
  };
}
const COLS = "id,project_id,company_name,facility_location,email,pdf_url,status,submitter_type,project_type,note,created_at";
let _noteColReady = null;
function ensureNoteColumn() {
  if (!_noteColReady) {
    _noteColReady = db.execute(`ALTER TABLE project_requests ADD COLUMN note TEXT`).then(() => void 0).catch(() => void 0);
  }
  return _noteColReady;
}
let _updatedAtColReady = null;
function ensureUpdatedAtColumn() {
  if (!_updatedAtColReady) {
    _updatedAtColReady = db.execute(`ALTER TABLE project_requests ADD COLUMN updated_at TEXT`).then(() => void 0).catch(() => void 0);
  }
  return _updatedAtColReady;
}
let _projectTypeColReady = null;
function ensureProjectTypeColumn() {
  if (!_projectTypeColReady) {
    _projectTypeColReady = db.execute(`ALTER TABLE project_requests ADD COLUMN project_type TEXT DEFAULT 'platform'`).then(() => db.execute(`UPDATE project_requests SET project_type = 'platform' WHERE project_type IS NULL`).then(() => void 0).catch(() => void 0)).catch(() => void 0);
  }
  return _projectTypeColReady;
}
async function listAllRequests() {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(`SELECT ${COLS} FROM project_requests ORDER BY created_at DESC`);
  return rowsToObjects(r).map(decode);
}
async function listRequestsBySource(source) {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE submitter_type = ? ORDER BY created_at DESC`,
    [source]
  );
  return rowsToObjects(r).map(decode);
}
async function listPlatformRequests() {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE project_type = 'platform' OR project_type IS NULL ORDER BY created_at DESC`
  );
  return rowsToObjects(r).map(decode);
}
async function searchRequestsByCompany(q) {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE company_name LIKE ? ORDER BY created_at DESC LIMIT 50`,
    [`%${q}%`]
  );
  return rowsToObjects(r).map(decode);
}
async function searchRequestsByEmail(email) {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(
    `SELECT ${COLS} FROM project_requests WHERE lower(email) = lower(?) ORDER BY created_at DESC LIMIT 10`,
    [email.trim()]
  );
  return rowsToObjects(r).map(decode);
}
async function getRequestById(id) {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(`SELECT ${COLS} FROM project_requests WHERE id = ? LIMIT 1`, [id]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}
async function getRequestByPdfPath(path) {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  const r = await db.execute(`SELECT ${COLS} FROM project_requests WHERE pdf_url = ? LIMIT 1`, [path]);
  const rows = rowsToObjects(r);
  return rows[0] ? decode(rows[0]) : null;
}
async function insertRequest(input) {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  await ensureUpdatedAtColumn();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO project_requests (id,project_id,company_name,facility_location,email,pdf_url,status,submitter_type,project_type,created_at,updated_at)
     VALUES (?,?,?,?,?,?, 'new', ?, ?, ?, ?)`,
    [
      id,
      input.project_id,
      input.company_name,
      input.facility_location,
      input.email,
      input.pdf_url,
      input.submitter_type,
      input.project_type ?? "platform",
      (/* @__PURE__ */ new Date()).toISOString(),
      (/* @__PURE__ */ new Date()).toISOString()
    ]
  );
  return id;
}
async function updateRequestStatus(id, status, note) {
  await ensureNoteColumn();
  await ensureProjectTypeColumn();
  await ensureUpdatedAtColumn();
  if (note === void 0) {
    await db.execute(`UPDATE project_requests SET status = ?, updated_at = ? WHERE id = ?`, [
      status,
      (/* @__PURE__ */ new Date()).toISOString(),
      id
    ]);
    return;
  }
  await db.execute(`UPDATE project_requests SET status = ?, note = ?, updated_at = ? WHERE id = ?`, [
    status,
    note,
    (/* @__PURE__ */ new Date()).toISOString(),
    id
  ]);
}
export {
  ensureNoteColumn,
  ensureProjectTypeColumn,
  ensureUpdatedAtColumn,
  getRequestById,
  getRequestByPdfPath,
  insertRequest,
  listAllRequests,
  listPlatformRequests,
  listRequestsBySource,
  searchRequestsByCompany,
  searchRequestsByEmail,
  updateRequestStatus
};
