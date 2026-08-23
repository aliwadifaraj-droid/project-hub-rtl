import { c as createSsrRpc } from "./createSsrRpc-C50NoQin.mjs";
import { c as createServerFn } from "./server-BNqJEEJz.mjs";
import { r as requireAuth } from "./auth-middleware.server-CWyFWbOs.mjs";
import { o as objectType, s as stringType, e as enumType, n as numberType } from "../_libs/zod.mjs";
const uploadSchema = objectType({
  filename: stringType().min(1).max(200),
  mime: stringType().max(200).optional(),
  purpose: enumType(["project-image", "bid-pdf", "vip-receipt", "other"]).default("other"),
  /** Base64-encoded file bytes. */
  data: stringType().min(1)
});
const uploadFile = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => uploadSchema.parse(d)).handler(createSsrRpc("b7ad89e53514fe40ef0575f2b782f1c24db826433880314689ac022007321e61"));
const uploadPublicFile = createServerFn({
  method: "POST"
}).inputValidator((d) => uploadSchema.extend({
  purpose: enumType(["project-image", "vip-receipt", "bid-pdf"])
}).parse(d)).handler(createSsrRpc("898f3de7600e9b256fad8120a215a38853a66a40aaa08f931800d551e65cbfc8"));
createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  id: stringType().uuid().optional(),
  key: stringType().min(1).max(500).optional(),
  expiresIn: numberType().int().min(60).max(60 * 60 * 24 * 7).default(60 * 60)
}).refine((v) => v.id || v.key, "id or key required").parse(d)).handler(createSsrRpc("f4493e302c8cb79e5184cf95711c932355480a4bedfd8639d6c72c5d22f28a66"));
createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("d47a983b48d5777a0269b3547219e13b80d7ce898c4db912618c93d350f34325"));
const registerUploadedFile = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  key: stringType().min(1).max(500),
  filename: stringType().min(1).max(200),
  mime: stringType().max(200).optional(),
  size: numberType().int().min(0).max(200 * 1024 * 1024),
  purpose: enumType(["project-image", "bid-pdf", "vip-receipt", "other"]).default("other"),
  publicUrl: stringType().url().optional()
}).parse(d)).handler(createSsrRpc("f302bfa9cba9e5efd3e6105eeb58b2edb4d316641b462d70f7f797dc99f49e61"));
createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  key: stringType().min(1).max(500),
  filename: stringType().min(1).max(200),
  mime: stringType().max(200).optional(),
  size: numberType().int().min(0).max(20 * 1024 * 1024),
  purpose: enumType(["project-image", "vip-receipt", "bid-pdf"]),
  publicUrl: stringType().url().optional()
}).parse(d)).handler(createSsrRpc("6b0873ce468403135fb5a48c9caa07c351725e7f9df20c439b51cdcea4750bbc"));
export {
  uploadPublicFile as a,
  registerUploadedFile as r,
  uploadFile as u
};
