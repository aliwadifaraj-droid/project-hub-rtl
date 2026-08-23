import { c as createServerRpc } from "./createServerRpc-Dx-ThoJh.mjs";
import { c as createServerFn } from "./server-BNqJEEJz.mjs";
import { r as requireAuth } from "./auth-middleware.server-CWyFWbOs.mjs";
import { n as listByOwner, b as getById, d as deleteProject } from "./projects.repo-GgbtJXPt.mjs";
import { r as resolveStoredFileUrl } from "./storage-url-BOHLt4ef.mjs";
import { c as cached, T as TTL_PROJECTS, a as cacheKeys, i as invalidateProjectsAll, b as invalidateQuotes } from "./cache-sw4uQcOM.mjs";

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
import "./db-BSVZwhof.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

async function resolveImage(path) {
  return resolveStoredFileUrl(path, 60 * 60 * 24 * 7).catch(() => "");
}
const listMyProjects_createServerFn_handler = createServerRpc({
  id: "8e8c85a8060f36e05865e9044f5c5cc1619143659e6d9409c338fffb7140812c",
  name: "listMyProjects",
  filename: "src/lib/my-projects.functions.ts"
}, (opts) => listMyProjects.__executeServer(opts));
const listMyProjects = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(listMyProjects_createServerFn_handler, async ({
  context
}) => cached(cacheKeys.quotes(context.userId), TTL_PROJECTS, async () => {
  const rows = await listByOwner(context.userId);
  return Promise.all(rows.map(async (p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    location: p.location,
    duration: p.duration,
    cover_image: p.cover_image,
    ad_id: p.ad_id,
    domain: p.domain,
    created_at: p.created_at,
    cover_url: await resolveImage(p.cover_image).catch(() => "")
  })));
}));
const deleteMyProject_createServerFn_handler = createServerRpc({
  id: "0df183e363dc40446c9c4b902973b68f87defba6eec25be42d5d57651ff2ddba",
  name: "deleteMyProject",
  filename: "src/lib/my-projects.functions.ts"
}, (opts) => deleteMyProject.__executeServer(opts));
const deleteMyProject = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(deleteMyProject_createServerFn_handler, async ({
  data,
  context
}) => {
  const row = await getById(data.id);
  if (!row || row.created_by !== context.userId) throw new Error("غير مصرح");
  await deleteProject(data.id);
  await invalidateProjectsAll();
  await invalidateQuotes(context.userId);
  return {
    ok: true
  };
});
export {
  deleteMyProject_createServerFn_handler,
  listMyProjects_createServerFn_handler
};
