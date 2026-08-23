import { c as createSsrRpc } from "./createSsrRpc-C50NoQin.mjs";
import { c as createServerFn } from "./server-BNqJEEJz.mjs";
import { a as requireAdmin } from "./auth-middleware.server-CWyFWbOs.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
const BLOCKED_MESSAGE = "تم حظرك من تقديم الطلبات بسبب مخالفة سياسة استخدام المنصة";
const adminListBlocked = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("54e04a37a12218f385257a062bb266c9d185aa68b353d1b195d77988c7461243"));
const adminBlockCompany = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  email: stringType().trim().max(255).optional().default(""),
  company_name: stringType().trim().max(200).optional().default(""),
  block_type: stringType().trim().max(100).optional().default("حظر بالبريد والمؤسسة")
}).parse(d)).handler(createSsrRpc("927f121ad4d8b1ea2976cd54068aad516e7090bd248f8cbd323c7f1c78357719"));
const adminUnblockCompany = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  email: stringType().trim().min(1)
}).parse(d)).handler(createSsrRpc("ac7aa1f9a63f321f68315638952e4c97cff2e5c25128228644651aabeddd037c"));
export {
  BLOCKED_MESSAGE as B,
  adminBlockCompany as a,
  adminListBlocked as b,
  adminUnblockCompany as c
};
