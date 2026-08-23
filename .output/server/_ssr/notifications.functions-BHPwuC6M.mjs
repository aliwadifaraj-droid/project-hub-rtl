import { c as createServerRpc } from "./createServerRpc-DYLDSQ_Q.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { r as requireAuth } from "./auth-middleware.server-B9hAjfqi.mjs";
import { listForUser, countUnreadForUser, markRead, markAllRead } from "./notifications.repo-vog42ua4.mjs";

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
import "./db-D5OYORU-.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

const listMyNotifications_createServerFn_handler = createServerRpc({
  id: "acdc1590236f0839542f983a97a7193af437f8125c921a77e6feea3b73ccec73",
  name: "listMyNotifications",
  filename: "src/lib/notifications.functions.ts"
}, (opts) => listMyNotifications.__executeServer(opts));
const listMyNotifications = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(listMyNotifications_createServerFn_handler, async ({
  context
}) => {
  const rows = await listForUser(context.userId, 50);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    link: r.link,
    read: r.read,
    created_at: r.created_at
  }));
});
const countMyUnreadNotifications_createServerFn_handler = createServerRpc({
  id: "d68947038400881570fabe714c6e93a8c429bf423406e0dab3b538b816a4b1bf",
  name: "countMyUnreadNotifications",
  filename: "src/lib/notifications.functions.ts"
}, (opts) => countMyUnreadNotifications.__executeServer(opts));
const countMyUnreadNotifications = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(countMyUnreadNotifications_createServerFn_handler, async ({
  context
}) => {
  return await countUnreadForUser(context.userId);
});
const markNotificationRead_createServerFn_handler = createServerRpc({
  id: "385e76cdf807dd53711b6f969d894db85cf9b0ca7a6373bb34c6352adedccb64",
  name: "markNotificationRead",
  filename: "src/lib/notifications.functions.ts"
}, (opts) => markNotificationRead.__executeServer(opts));
const markNotificationRead = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(markNotificationRead_createServerFn_handler, async ({
  data,
  context
}) => {
  await markRead(context.userId, data.id);
  return {
    ok: true
  };
});
const markAllNotificationsRead_createServerFn_handler = createServerRpc({
  id: "9450c15293c0a6ae5fe14448bd9f3e0ad58f596f22af371b91f88b98002e414b",
  name: "markAllNotificationsRead",
  filename: "src/lib/notifications.functions.ts"
}, (opts) => markAllNotificationsRead.__executeServer(opts));
const markAllNotificationsRead = createServerFn({
  method: "POST"
}).middleware([requireAuth]).handler(markAllNotificationsRead_createServerFn_handler, async ({
  context
}) => {
  await markAllRead(context.userId);
  return {
    ok: true
  };
});
export {
  countMyUnreadNotifications_createServerFn_handler,
  listMyNotifications_createServerFn_handler,
  markAllNotificationsRead_createServerFn_handler,
  markNotificationRead_createServerFn_handler
};
