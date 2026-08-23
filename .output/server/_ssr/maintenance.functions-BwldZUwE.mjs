import { c as createServerRpc } from "./createServerRpc-Dx-ThoJh.mjs";
import { c as createServerFn } from "./server-BNqJEEJz.mjs";
import { a as requireAdmin } from "./auth-middleware.server-CWyFWbOs.mjs";
import { d as db, r as rowsToObjects } from "./db-BSVZwhof.mjs";

import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";

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

const getMaintenance_createServerFn_handler = createServerRpc({
  id: "9986d6d39f0d4a4887403518971268a89e4410e9680fadf3d295b0965190da7e",
  name: "getMaintenance",
  filename: "src/lib/maintenance.functions.ts"
}, (opts) => getMaintenance.__executeServer(opts));
const getMaintenance = createServerFn({
  method: "GET"
}).handler(getMaintenance_createServerFn_handler, async () => {
  const key = "maintenance_mode";
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", [key]);
  const row = rowsToObjects(result)[0];
  const v = row?.value ? JSON.parse(row.value) : {};
  let enabled = !!v.enabled;
  const endAt = v.endAt ?? null;
  if (enabled && endAt) {
    const endMs = new Date(endAt).getTime();
    if (!Number.isNaN(endMs) && endMs <= Date.now()) {
      enabled = false;
      try {
        await db.execute(`INSERT INTO site_settings (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`, [key, JSON.stringify({
          enabled: false,
          endAt
        }), (/* @__PURE__ */ new Date()).toISOString()]);
      } catch {
      }
    }
  }
  return {
    enabled,
    endAt
  };
});
const setMaintenance_createServerFn_handler = createServerRpc({
  id: "8eecf51b875ae01da1d331e75ca34137b033f64c39771bb7e3231bdcdefb506a",
  name: "setMaintenance",
  filename: "src/lib/maintenance.functions.ts"
}, (opts) => setMaintenance.__executeServer(opts));
const setMaintenance = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => ({
  enabled: !!d?.enabled,
  endAt: d?.endAt ? String(d.endAt) : null
})).handler(setMaintenance_createServerFn_handler, async ({
  data
}) => {
  const key = "maintenance_mode";
  const normalizedEndAt = data.enabled && data.endAt && new Date(data.endAt).getTime() <= Date.now() ? null : data.endAt;
  await db.execute(`INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`, [key, JSON.stringify({
    enabled: data.enabled,
    endAt: normalizedEndAt
  }), (/* @__PURE__ */ new Date()).toISOString()]);
  return {
    ok: true,
    enabled: data.enabled,
    endAt: normalizedEndAt
  };
});
export {
  getMaintenance_createServerFn_handler,
  setMaintenance_createServerFn_handler
};
