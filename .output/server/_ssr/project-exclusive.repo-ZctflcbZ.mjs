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

async function setExclusiveWindow(input) {
  await db.execute(
    `INSERT INTO project_exclusive
      (id, project_id, vip_start_at, vip_end_at, created_at, duration_hours, is_exclusive, remaining_hours, exclusive_until)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(project_id) DO UPDATE SET
       vip_start_at = excluded.vip_start_at,
       vip_end_at = excluded.vip_end_at,
       duration_hours = excluded.duration_hours,
       is_exclusive = 1,
       remaining_hours = excluded.remaining_hours,
       exclusive_until = excluded.exclusive_until`,
    [
      crypto.randomUUID(),
      input.project_id,
      input.vip_start_at,
      input.vip_end_at,
      (/* @__PURE__ */ new Date()).toISOString(),
      input.duration_hours,
      input.duration_hours,
      input.vip_end_at
    ]
  );
}
async function getExclusiveWindow(projectId) {
  const r = await db.execute(
    `SELECT vip_start_at, vip_end_at, duration_hours, is_exclusive, remaining_hours, exclusive_until
       FROM project_exclusive
      WHERE project_id = ? AND is_exclusive = 1
      LIMIT 1`,
    [projectId]
  );
  const row = rowsToObjects(r)[0];
  if (!row || !row.vip_end_at || Number(row.is_exclusive) === 0) return null;
  const remaining = Math.max(0, (new Date(String(row.vip_end_at)).getTime() - Date.now()) / 36e5);
  if (remaining <= 0) return null;
  return {
    vip_start_at: String(row.vip_start_at ?? ""),
    vip_end_at: String(row.vip_end_at),
    duration_hours: Number(row.duration_hours ?? 0),
    is_exclusive: true,
    remaining_hours: remaining,
    exclusive_until: String(row.exclusive_until ?? row.vip_end_at)
  };
}
export {
  getExclusiveWindow,
  setExclusiveWindow
};
