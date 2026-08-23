import { c as createServerRpc } from "./createServerRpc-Dx-ThoJh.mjs";
import { c as createServerFn } from "./server-BNqJEEJz.mjs";
import { i as insertContactMessage } from "./contact-messages.repo-CA70kHjz.mjs";
import { i as isBlocked } from "./blocked.repo-C-JF9Ik-.mjs";
import { B as BLOCKED_MESSAGE } from "./blocked.functions-B0hy_Vq2.mjs";

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

import "./createSsrRpc-C50NoQin.mjs";
import "./auth-middleware.server-CWyFWbOs.mjs";
const submitContactMessage_createServerFn_handler = createServerRpc({
  id: "cbbecc3eeba7f0f9946f0d511c1b0036cea0dbc5cf53b42135834da4bae44479",
  name: "submitContactMessage",
  filename: "src/lib/public.functions.ts"
}, (opts) => submitContactMessage.__executeServer(opts));
const submitContactMessage = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  name: stringType().trim().min(1).max(100),
  email: stringType().trim().email().max(200),
  message: stringType().trim().min(1).max(2e3)
}).parse(d)).handler(submitContactMessage_createServerFn_handler, async ({
  data
}) => {
  if (await isBlocked(data.name, data.email)) throw new Error(BLOCKED_MESSAGE);
  await insertContactMessage(data);
  return {
    ok: true
  };
});
export {
  submitContactMessage_createServerFn_handler
};
