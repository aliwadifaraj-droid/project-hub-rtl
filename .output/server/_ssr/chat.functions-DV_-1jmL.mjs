import { c as createSsrRpc } from "./createSsrRpc-DY9HpWEz.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { r as requireAuth } from "./auth-middleware.server-B9hAjfqi.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
const listTeamMessages = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("5a07fa4a184d1a1748e919d1b3006b4633da0f254a8f503227346b1ef65ba315"));
const sendTeamMessage = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  body: stringType().trim().min(1).max(4e3)
}).parse(d)).handler(createSsrRpc("1e581f7b957892bf14d2c14805cfbcd65fe1ebbb19cc8e82b1ca5f34370b0e5f"));
const deleteTeamMessage = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("5a2d12acd651ca5b6782bc2b0bf306c82dcbdc1bea4ab7e8e78ce4337b26435a"));
const countUnreadTeamMessages = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  since: stringType().nullable()
}).parse(d)).handler(createSsrRpc("6ea05b622530e225578c99ae382ff2bc70d12ece0966bed2cf5f1544500a7e0f"));
const deleteAllTeamMessages = createServerFn({
  method: "POST"
}).middleware([requireAuth]).handler(createSsrRpc("5e6ffd149a609aad6ed438bc6e7f2ad0c1aebc73f564aff8f9181ab657792bd8"));
export {
  deleteAllTeamMessages as a,
  countUnreadTeamMessages as c,
  deleteTeamMessage as d,
  listTeamMessages as l,
  sendTeamMessage as s
};
