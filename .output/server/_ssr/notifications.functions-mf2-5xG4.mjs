import { c as createSsrRpc } from "./createSsrRpc-DY9HpWEz.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { r as requireAuth } from "./auth-middleware.server-B9hAjfqi.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
const listMyNotifications = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("acdc1590236f0839542f983a97a7193af437f8125c921a77e6feea3b73ccec73"));
const countMyUnreadNotifications = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("d68947038400881570fabe714c6e93a8c429bf423406e0dab3b538b816a4b1bf"));
const markNotificationRead = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("385e76cdf807dd53711b6f969d894db85cf9b0ca7a6373bb34c6352adedccb64"));
const markAllNotificationsRead = createServerFn({
  method: "POST"
}).middleware([requireAuth]).handler(createSsrRpc("9450c15293c0a6ae5fe14448bd9f3e0ad58f596f22af371b91f88b98002e414b"));
export {
  markAllNotificationsRead as a,
  countMyUnreadNotifications as c,
  listMyNotifications as l,
  markNotificationRead as m
};
