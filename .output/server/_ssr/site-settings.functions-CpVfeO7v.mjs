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
import { o as objectType, b as booleanType } from "../_libs/zod.mjs";

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

const getVipMaintenance_createServerFn_handler = createServerRpc({
  id: "e37ef2463aa86b5e52ad7d1d5e3203b5ffbbc00e102276fa280036aae832a9ac",
  name: "getVipMaintenance",
  filename: "src/lib/site-settings.functions.ts"
}, (opts) => getVipMaintenance.__executeServer(opts));
const getVipMaintenance = createServerFn({
  method: "GET"
}).handler(getVipMaintenance_createServerFn_handler, async () => {
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", ["vip_maintenance"]);
  const row = rowsToObjects(result)[0];
  const v = row?.value ? JSON.parse(row.value) : {};
  return {
    enabled: !!v.enabled
  };
});
const setVipMaintenance_createServerFn_handler = createServerRpc({
  id: "aad3e9706e54bcd02055ffffe6f7665f755a69cd12594265650302f41ade5078",
  name: "setVipMaintenance",
  filename: "src/lib/site-settings.functions.ts"
}, (opts) => setVipMaintenance.__executeServer(opts));
const setVipMaintenance = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  enabled: booleanType()
}).parse(d)).handler(setVipMaintenance_createServerFn_handler, async ({
  data
}) => {
  await db.execute(`INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`, ["vip_maintenance", JSON.stringify({
    enabled: data.enabled
  }), (/* @__PURE__ */ new Date()).toISOString()]);
  return {
    ok: true,
    enabled: data.enabled
  };
});
const getHideSupportChat_createServerFn_handler = createServerRpc({
  id: "b5e36592858524cbe2f05bb9ab7731685df655bfb0b3baa905db2bee07360060",
  name: "getHideSupportChat",
  filename: "src/lib/site-settings.functions.ts"
}, (opts) => getHideSupportChat.__executeServer(opts));
const getHideSupportChat = createServerFn({
  method: "GET"
}).handler(getHideSupportChat_createServerFn_handler, async () => {
  const result = await db.execute("SELECT value FROM site_settings WHERE key = ? LIMIT 1", ["hide_support_chat"]);
  const row = rowsToObjects(result)[0];
  const v = row?.value ? JSON.parse(row.value) : {};
  return {
    enabled: !!v.enabled
  };
});
const setHideSupportChat_createServerFn_handler = createServerRpc({
  id: "160ebc02d3b498615964cc4f281517cce0c7e2c3044a62cac752d76cd3d34fa1",
  name: "setHideSupportChat",
  filename: "src/lib/site-settings.functions.ts"
}, (opts) => setHideSupportChat.__executeServer(opts));
const setHideSupportChat = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  enabled: booleanType()
}).parse(d)).handler(setHideSupportChat_createServerFn_handler, async ({
  data
}) => {
  await db.execute(`INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`, ["hide_support_chat", JSON.stringify({
    enabled: data.enabled
  }), (/* @__PURE__ */ new Date()).toISOString()]);
  return {
    ok: true,
    enabled: data.enabled
  };
});
export {
  getHideSupportChat_createServerFn_handler,
  getVipMaintenance_createServerFn_handler,
  setHideSupportChat_createServerFn_handler,
  setVipMaintenance_createServerFn_handler
};
