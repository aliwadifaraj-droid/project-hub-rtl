import { c as createSsrRpc } from "./createSsrRpc-DY9HpWEz.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { r as requireAuth, a as requireAdmin } from "./auth-middleware.server-B9hAjfqi.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
const listPendingProjects = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("4566ade9bb98508870423efaadce8b560262f2655fdd5b8ba7e23267e21d5668"));
const countPendingProjects = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("fabf83d09b4f50e361d550bb061e43007736f2c7f192b3b91fc90bcd215b8247"));
const approveProject = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("ce5211c91c96ea83d2bf1a2de856e6d5af5baf6508fb8401d3bc8e4a1a278a99"));
const rejectProject = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  reason: stringType().max(500).optional()
}).parse(d)).handler(createSsrRpc("c1b423a7dbe5ef78b5653345dc2eee2dfa32cc1c6bfedd947532453fe5d87606"));
export {
  approveProject as a,
  countPendingProjects as c,
  listPendingProjects as l,
  rejectProject as r
};
