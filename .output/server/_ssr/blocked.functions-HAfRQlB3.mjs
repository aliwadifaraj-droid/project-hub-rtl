import { c as createServerRpc } from "./createServerRpc-Dx-ThoJh.mjs";
import { c as createServerFn } from "./server-BNqJEEJz.mjs";
import { a as requireAdmin } from "./auth-middleware.server-CWyFWbOs.mjs";
import { l as listBlocked, a as addBlockedUser, r as removeBlockedUser } from "./blocked.repo-C-JF9Ik-.mjs";

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

const adminListBlocked_createServerFn_handler = createServerRpc({
  id: "54e04a37a12218f385257a062bb266c9d185aa68b353d1b195d77988c7461243",
  name: "adminListBlocked",
  filename: "src/lib/blocked.functions.ts"
}, (opts) => adminListBlocked.__executeServer(opts));
const adminListBlocked = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListBlocked_createServerFn_handler, async () => listBlocked());
const adminBlockCompany_createServerFn_handler = createServerRpc({
  id: "927f121ad4d8b1ea2976cd54068aad516e7090bd248f8cbd323c7f1c78357719",
  name: "adminBlockCompany",
  filename: "src/lib/blocked.functions.ts"
}, (opts) => adminBlockCompany.__executeServer(opts));
const adminBlockCompany = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  email: stringType().trim().max(255).optional().default(""),
  company_name: stringType().trim().max(200).optional().default(""),
  block_type: stringType().trim().max(100).optional().default("حظر بالبريد والمؤسسة")
}).parse(d)).handler(adminBlockCompany_createServerFn_handler, async ({
  data
}) => {
  const email = data.email || "";
  const companyName = data.company_name || "";
  if (!email) throw new Error("البريد الإلكتروني مطلوب");
  if (!companyName) throw new Error("اسم المؤسسة مطلوب");
  const id = await addBlockedUser({
    email,
    company_name: companyName,
    block_type: data.block_type
  });
  return {
    ok: true,
    id
  };
});
const adminUnblockCompany_createServerFn_handler = createServerRpc({
  id: "ac7aa1f9a63f321f68315638952e4c97cff2e5c25128228644651aabeddd037c",
  name: "adminUnblockCompany",
  filename: "src/lib/blocked.functions.ts"
}, (opts) => adminUnblockCompany.__executeServer(opts));
const adminUnblockCompany = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  email: stringType().trim().min(1)
}).parse(d)).handler(adminUnblockCompany_createServerFn_handler, async ({
  data
}) => {
  await removeBlockedUser({
    email: data.email
  });
  return {
    ok: true
  };
});
export {
  adminBlockCompany_createServerFn_handler,
  adminListBlocked_createServerFn_handler,
  adminUnblockCompany_createServerFn_handler
};
