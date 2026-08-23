import process from "node:process";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider, u as useQuery, a as useSuspenseQuery, q as queryOptions, b as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent, d as useRouterState, e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { V as redirect, W as notFound, I as isRedirect } from "../_libs/tanstack__router-core.mjs";
import { c as createSsrRpc } from "./createSsrRpc-DY9HpWEz.mjs";
import { c as createServerFn } from "./server-COznR7QB.mjs";
import { r as requireAuth, a as requireAdmin } from "./auth-middleware.server-B9hAjfqi.mjs";
import { markExpired, findExpiringSoon } from "./vip.repo-CycBrLVA.mjs";
import { S as SAUDI_CITIES } from "./saudi-cities-D2sGDQV3.mjs";
import { g as getSessionClaims, d as db, r as rowsToObjects } from "./db-D5OYORU-.mjs";
import { makeKey, uploadToR2, signGetUrl, getBucket } from "./r2-CJ2zxhhj.mjs";
import { v as verifyWebhookRequest, W as WebhookError } from "../_libs/lovable.dev__webhooks-js.mjs";
import { s as sendLovableEmail } from "../_libs/lovable.dev__email-js.mjs";
import { r as render } from "../_libs/react-email__render.mjs";
import { S as S3Client, L as ListObjectsV2Command } from "../_libs/aws-sdk__client-s3.mjs";
import { H as Html } from "../_libs/react-email__html.mjs";
import { H as Head } from "../_libs/react-email__head.mjs";
import { P as Preview } from "../_libs/react-email__preview.mjs";
import { B as Body } from "../_libs/react-email__body.mjs";
import { C as Container } from "../_libs/react-email__container.mjs";
import { H as Heading } from "../_libs/react-email__heading.mjs";
import { T as Text } from "../_libs/react-email__text.mjs";
import { X, M as MessageCircle, H as Headphones, F as FileUp, C as CircleCheck, P as PowerOff, S as Send } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, p as preprocessType, n as numberType, b as booleanType, e as enumType, a as arrayType } from "../_libs/zod.mjs";
import "../_libs/react-dom.mjs";

import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/unenv.mjs";


import "../_libs/seroval-plugins.mjs";


import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";




import "../_libs/bcryptjs.mjs";

import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/jose.mjs";
import "../_libs/aws4fetch.mjs";
import "../_libs/prettier.mjs";
import "../_libs/html-to-text.mjs";
import "../_libs/selderee__plugin-htmlparser2.mjs";
import "../_libs/selderee.mjs";
import "../_libs/parseley.mjs";
import "../_libs/leac.mjs";
import "../_libs/peberminta.mjs";
import "../_libs/domhandler.mjs";
import "../_libs/domelementtype.mjs";
import "../_libs/htmlparser2.mjs";
import "../_libs/entities.mjs";
import "../_libs/deepmerge.mjs";
import "../_libs/dom-serializer.mjs";
import "../_libs/smithy__core.mjs";
import "../_libs/smithy__types.mjs";





import "../_libs/aws-sdk__core.mjs";
import "../_libs/aws__lambda-invoke-store.mjs";
import "../_libs/aws-sdk__xml-builder.mjs";
import "../_libs/smithy__signature-v4.mjs";
import "../_libs/@aws-sdk/signature-v4-multi-region+[...].mjs";
import "../_libs/aws-sdk__checksums.mjs";
import "../_libs/aws-sdk__middleware-sdk-s3.mjs";
import "../_libs/@aws-sdk/credential-provider-node+[...].mjs";
import "../_libs/@aws-sdk/credential-provider-env+[...].mjs";
import "../_libs/smithy__node-http-handler.mjs";
function useServerFn(serverFn) {
  const router2 = useRouter();
  return reactExports.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router2.stores.location.get();
        return router2.navigate(router2.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router2, serverFn]);
}
const appCss = "/assets/styles-Dn6NL99h.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
const getMaintenance = createServerFn({
  method: "GET"
}).handler(createSsrRpc("9986d6d39f0d4a4887403518971268a89e4410e9680fadf3d295b0965190da7e"));
const setMaintenance = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => ({
  enabled: !!d?.enabled,
  endAt: d?.endAt ? String(d.endAt) : null
})).handler(createSsrRpc("8eecf51b875ae01da1d331e75ca34137b033f64c39771bb7e3231bdcdefb506a"));
const credsSchema = objectType({
  email: stringType().email().max(255).transform((s) => s.trim().toLowerCase()),
  password: stringType().min(6).max(72)
});
const signUp = createServerFn({
  method: "POST"
}).inputValidator((d) => credsSchema.parse(d)).handler(createSsrRpc("bbd9915d8b85c65a3b3f8e8ee5957a3dfe60390cf4d3eb0e1e0afb89dda15aea"));
const signIn = createServerFn({
  method: "POST"
}).inputValidator((d) => credsSchema.parse(d)).handler(createSsrRpc("15946b07b54e0909aa27fa0f35669f0600b7c3f449e509501f5aec30c0ba00fd"));
const signOut = createServerFn({
  method: "POST"
}).handler(createSsrRpc("95f2cf03275bf7421044cb43581f390444f8462eb7ceef40d1fbcdaa0f979964"));
const getMe = createServerFn({
  method: "GET"
}).handler(createSsrRpc("05d540c91ea9147d57c434f81d698c2e3ff5d23ba136ebab060a4513339a2b8c"));
const changePassword = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  currentPassword: stringType().min(1).max(72),
  newPassword: stringType().min(6).max(72)
}).parse(d)).handler(createSsrRpc("99a6241c2e872ac588fb9e911f1c19e326e4ed158596fc59ad6d76613657d027"));
const emailSchema = objectType({
  email: stringType().email().max(255).transform((s) => s.trim().toLowerCase())
});
const requestPasswordReset = createServerFn({
  method: "POST"
}).inputValidator((d) => emailSchema.parse(d)).handler(createSsrRpc("e92855947cae016a13e8d6fa4b210ab347a059e2ad930c57303e3cd0fdac2134"));
const resetWithTokenSchema = objectType({
  token: stringType().min(1),
  newPassword: stringType().min(6).max(72)
});
const resetPasswordWithToken = createServerFn({
  method: "POST"
}).inputValidator((d) => resetWithTokenSchema.parse(d)).handler(createSsrRpc("eb4e3c706f872f0da3aaed5a5f23123c66e0b18caf30063f912ba5bcf5982885"));
function getRoleLabel(role) {
  if (role === "admin") return "أدمن";
  if (role === "employee" || role === "user") return "مستخدم";
  return "—";
}
function hasAdminRole(roles) {
  return (roles ?? []).includes("admin");
}
const ALLOW_PREFIXES = [
  "/maintenance",
  "/auth",
  "/reset-password",
  "/lovable/",
  "/api/"
];
function MaintenanceGate() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const fetchMaintenance = useServerFn(getMaintenance);
  const fetchMe = useServerFn(getMe);
  const [authReady, setAuthReady] = reactExports.useState(false);
  const [signedIn, setSignedIn] = reactExports.useState(false);
  const [roles, setRoles] = reactExports.useState([]);
  reactExports.useEffect(() => {
    let mounted = true;
    fetchMe().then((me) => {
      if (!mounted) return;
      setSignedIn(!!me);
      setRoles(me?.roles ?? []);
    }).catch(() => {
      if (!mounted) return;
      setSignedIn(false);
      setRoles([]);
    }).finally(() => {
      if (mounted) setAuthReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [fetchMe, path]);
  const { data: m } = useQuery({
    queryKey: ["maintenance-public"],
    queryFn: () => fetchMaintenance(),
    refetchInterval: 6e4,
    staleTime: 3e4
  });
  const isAdmin = signedIn && hasAdminRole(roles);
  const allowed = ALLOW_PREFIXES.some((p) => path === p || path.startsWith(p));
  reactExports.useEffect(() => {
    if (!m?.enabled) return;
    if (!authReady) return;
    if (isAdmin) return;
    if (allowed) return;
    navigate({ to: "/maintenance", replace: true });
  }, [m?.enabled, authReady, isAdmin, allowed, path, navigate]);
  return null;
}
const uuid = stringType().uuid();
const listBotQuestions = createServerFn({
  method: "GET"
}).handler(createSsrRpc("473edaaa49ffe54bc8f383fbdac7511392187f10acbab0c8c7449c1b7764ac54"));
const startVisitorChat = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  visitorToken: uuid,
  visitorName: stringType().trim().max(80).nullable().optional()
}).parse(d)).handler(createSsrRpc("d2395d71d5cf32fad3b7d198197abb2c2cf523dd2de7ce34028e5102040cfee9"));
const visitorGetMessages = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  visitorToken: uuid,
  sinceIso: stringType().nullable().optional()
}).parse(d)).handler(createSsrRpc("1b6c0c9c1c9f08324d604e475dc4c3c8a4b09a16f89c8dc654c7f5866c6474af"));
const visitorSendMessage = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  visitorToken: uuid,
  body: stringType().trim().min(1).max(2e3),
  qaId: preprocessType((v) => v == null || v === "" ? null : String(v), stringType().nullable()).optional()
}).parse(d)).handler(createSsrRpc("8d3baad434375fac495bca852705012d384f30fc6b3bb22190dd852beb6f28d8"));
createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  visitorToken: uuid
}).parse(d)).handler(createSsrRpc("d4c835351eb03e09ca123caa1c91f29dde6054eb1fec80c344ad1b27997c3fd0"));
const visitorEndSession = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  visitorToken: uuid
}).parse(d)).handler(createSsrRpc("ed6396123983567371e5efb71c9f60edd285e6d62bfab3a8c0a639e124ddbb8a"));
const adminListChats = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("e618c2143fa787d56d489687e0cce239f4041c5160149c846c9759048f21a75d"));
const adminListChatMessages = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  chatId: uuid
}).parse(d)).handler(createSsrRpc("270c1762d98a54703b818e3db3c9d3ff72890dcaf8162eb203025f6a4651b70a"));
const adminReplyChat = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  chatId: uuid,
  body: stringType().trim().min(1).max(4e3)
}).parse(d)).handler(createSsrRpc("29185ffc54de4a4d32349e930389d6f85ee789e2c01a8d6a3f84c022fa6f57e1"));
const adminCloseChat = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  chatId: uuid
}).parse(d)).handler(createSsrRpc("d737e3c35142fbf7cef6d3e25b70815a83a31ae693e8752175bca7ea3eaa9752"));
const adminDeleteAllSupport = createServerFn({
  method: "POST"
}).middleware([requireAuth]).handler(createSsrRpc("cc7b4410257e035601dc7f884ef7ba3df2cbacbc439903a1805806314de9bcc5"));
const adminListBotQa = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("29350f80d29a69d2e2195c7c03f4454ef10774b58808aa0149e6464d567e61d1"));
const adminUpsertBotQa = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid().nullable().optional(),
  question: stringType().trim().min(1).max(300),
  answer: stringType().trim().min(1).max(4e3),
  keywords: arrayType(stringType().trim().max(60)).max(30),
  is_active: booleanType(),
  sort_order: numberType().int().min(0).max(9999),
  action: enumType(["none", "escalate"]).default("none")
}).parse(d)).handler(createSsrRpc("8af3a0596161f6271665a3fe29acde3400e514840352ee5348d84d4a02310fad"));
const adminDeleteBotQa = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: uuid
}).parse(d)).handler(createSsrRpc("86797decd1cf50ed025b4a3c4c789fa623ea93fd3d645a56f1779a1cc6d3c125"));
const adminCountOpenSupportChats = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("5dd5cca12724248959e8a8504ab6d9a9d61c11c357ec9dedaf9b423a674b79a2"));
createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  email: stringType().trim().min(1),
  receiptFile: stringType().trim().min(1),
  packageAmount: numberType().positive()
}).parse(d)).handler(createSsrRpc("a846ccbb8e0324334f18c2344337c3d6370fd1557fd569e0d0f39a9e17f34183"));
const createPackageTrialSubscription = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  email: stringType().trim().min(1),
  receiptFile: stringType().trim().min(1),
  packageAmount: numberType().positive(),
  durationMinutes: numberType().int().positive()
}).parse(d)).handler(createSsrRpc("585f22b59b464df4b4843c564292572d6b66e16706f12ec871db320c1e45208f"));
const daysSchema = objectType({
  sun: booleanType(),
  mon: booleanType(),
  tue: booleanType(),
  wed: booleanType(),
  thu: booleanType(),
  fri: booleanType(),
  sat: booleanType()
});
const getBotSettings = createServerFn({
  method: "GET"
}).handler(createSsrRpc("0e113e277043fca586d7600364ab04300dab4100b6547e1d76f77517b24c6256"));
const updateBotSettings = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  work_days: daysSchema,
  work_start: stringType().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  work_end: stringType().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  off_hours_message: stringType().trim().min(1).max(1e3),
  fallback_message: stringType().trim().min(1).max(1e3),
  allow_escalation: booleanType(),
  show_suggested_questions: booleanType(),
  local_enabled: booleanType(),
  local_system_prompt: stringType().trim().max(4e3)
}).parse(d)).handler(createSsrRpc("4f8dc13b790c5f24f39e1a5cc0b8247f23005360e7a43f8aeddfe521ba17d07d"));
const getGroqSettings = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("c8a82179ef36b1b5cbb6f0269981709217c19604b4627b7c6d34db26c0a63f2d"));
const updateGroqSettings = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  systemInstruction: stringType().trim().max(4e3),
  dialect: stringType().trim().max(100),
  botName: stringType().trim().max(100),
  blockedReplies: arrayType(stringType().trim().max(200)).max(50),
  scope: stringType().trim().max(2e3),
  groqEnabled: booleanType()
}).parse(d)).handler(createSsrRpc("8816c8285bd6ce60443893f0f50a1aa744622b22fe2763515a8c9d4144b3ea33"));
const submitSchema = objectType({
  project_id: stringType().uuid(),
  projectName: stringType().trim().min(2).max(200),
  companyName: stringType().trim().min(2).max(200),
  email: stringType().trim().email().max(200),
  amount: stringType().trim().min(1).max(60),
  pdfKey: stringType().trim().min(1).max(500),
  pdfFilename: stringType().trim().min(1).max(200),
  visitorToken: stringType().uuid().optional().nullable()
});
const submitOffer = createServerFn({
  method: "POST"
}).inputValidator((d) => submitSchema.parse(d)).handler(createSsrRpc("44b86b436fe8582afd56c6b0eda471eb699a048021a38998ebcdfc0c9d9704f8"));
const addProjectSchema = objectType({
  company_name: stringType().trim().min(1).max(200),
  facility_location: stringType().trim().min(1).max(300),
  email: stringType().trim().email().max(255),
  file_name: stringType().trim().min(1).max(200),
  file_base64: stringType().min(8).max(15e6)
});
createServerFn({
  method: "POST"
}).inputValidator((d) => addProjectSchema.parse(d)).handler(createSsrRpc("ecdc73f97ae33d5257d739dbb17f737a77ab3872680ff91462798930243850fd"));
const adminListOffers = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("2b7d944e60b08bcdc1fa7a16dba44b1924f252c838ee796c60dd9c638a18e6d5"));
createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("185a1991094210b2d32efab49f8d7acd5513ff227faca5d4da0087bb88635515"));
const adminUpdateOfferStatus = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  status: enumType(["pending", "new", "reviewing", "accepted", "rejected"])
}).parse(d)).handler(createSsrRpc("008260bf3785ecc73620b20adfb599ce556159535a1c054533b212ab63a5b0fa"));
createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("054b265a94cc68fad8096cb913bc75d1468d45ef608c672eb224b988bcb6020c"));
const adminGetOfferPdfUrl = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  key: stringType().min(1).max(500)
}).parse(d)).handler(createSsrRpc("3c44a42ed774bf578a6b2548e0865d038dcc3dcb253782b3109b445d11569b3e"));
const listVipSubscribers = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("e337182b5923487d34c98e8e407f69fa815e9efcdf2c402e545c2cff02bf1358"));
const approveVipByProject = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => {
  if (!d?.project_id) throw new Error("project_id مطلوب");
  return d;
}).handler(createSsrRpc("f891f100da2378879fcd70938136c67e280423cae8700d3589510fa328eec3b2"));
const cancelVipByProject = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => {
  if (!d?.project_id) throw new Error("project_id مطلوب");
  return d;
}).handler(createSsrRpc("177b456e028ec263041006282f11f32836be03f38b846b7d927caf195c7a5f8d"));
const listAllProjectVipStatus = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("6319f7726de73fa9273d35ad6b8c33dd3575d1f8a6bc610d6688e7580f07d2f1"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => {
  if (!d?.city) throw new Error("city مطلوبة");
  return d;
}).handler(createSsrRpc("e5da0a8610e2604ca8e6194cfced547a3621601f20e383f10fa825e92e526a6f"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => {
  if (!d?.city) throw new Error("city مطلوبة");
  if (!Number.isFinite(d.hours) || d.hours <= 0) throw new Error("hours يجب أن يكون رقماً موجباً");
  return d;
}).handler(createSsrRpc("b192b513e35f0d2b51783cbde58b942245d43109a88d04aa3bdb2052a8c43af4"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => {
  if (!d?.city) throw new Error("city مطلوبة");
  if (!Number.isFinite(d.hours) || d.hours <= 0) throw new Error("hours يجب أن يكون رقماً موجباً");
  return d;
}).handler(createSsrRpc("778e376f08f5a466c5d0d2f160deb9c34f2cd4c35b8fc4a5e49228dc28cf6175"));
const getMyVipStatus = createServerFn({
  method: "GET"
}).middleware([requireAuth]).inputValidator((d) => {
  if (!d?.project_id) throw new Error("project_id مطلوب");
  return d;
}).handler(createSsrRpc("d4a5463d770cb7a3de60f99dac907f972b4526f5fcfe984ef7f58be9a90b39a4"));
createServerFn({
  method: "GET"
}).middleware([requireAdmin]).inputValidator((d) => {
  if (!d?.project_id) throw new Error("project_id مطلوب");
  return d;
}).handler(createSsrRpc("dd143bd7f19d33191eacfa211873d914aaadb0c9a4128aa79b89b3c3b41b4f77"));
const submitVipSubscription = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  if (!data?.name?.trim() || !data?.email?.trim()) throw new Error("الاسم والبريد مطلوبان");
  if (!data?.receipt_path?.trim()) throw new Error("إيصال التحويل مطلوب");
  if (!data?.plan?.trim()) throw new Error("اختر الباقة");
  if (!data?.city?.trim()) throw new Error("اختر المدينة");
  return {
    name: data.name.trim(),
    email: data.email.trim(),
    receipt_path: data.receipt_path.trim(),
    plan: data.plan.trim(),
    city: data.city.trim()
  };
}).handler(createSsrRpc("16df0d113af31fa0a7330a7b7426337f0dfbfbd1facc9a4426d0eb75efe4cc8b"));
createServerFn({
  method: "POST"
}).inputValidator((data) => {
  if (!data?.id || !data.receipt_path) throw new Error("بيانات ناقصة");
  return data;
}).handler(createSsrRpc("05df53a3a9cdbd8017df512a038428c80f447054678e91faa6a87562fc4c5cab"));
const approveVipSubscriber = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((data) => data).handler(createSsrRpc("6f67ec444785cb548e0eef51091b2b8814bd502dfc31d19f4b38b984fca8599c"));
const rejectVipSubscriber = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((data) => data).handler(createSsrRpc("152810f0035020059e45b5a70cb4c8db932fc33791b9447eb8aa92ef6ebb816f"));
const createTrialVipSubscription = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((data) => {
  if (!data?.email?.trim()) throw new Error("البريد الإلكتروني مطلوب");
  if (!Number.isFinite(data.duration_minutes) || data.duration_minutes <= 0) throw new Error("مدة التجربة يجب أن تكون رقماً موجباً");
  return {
    email: data.email.trim(),
    duration_minutes: data.duration_minutes
  };
}).handler(createSsrRpc("5dffbc3f06512d6fb9ac263e257db41cb7931a7afa75aaedf5eb2ca77adb4729"));
async function runVipExpiryCheckRaw() {
  const {
    expired,
    rows
  } = await markExpired();
  let expiredEmailed = 0;
  let expiredEmailFailed = 0;
  const {
    sendResendEmail
  } = await import("./resend-send.server-Cc6n_-h6.mjs");
  for (const row of rows) {
    if (!row.email) continue;
    const ok = await sendResendEmail({
      to: row.email,
      subject: "انتهى اشتراك VIP",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name ?? ""},</h2><p>نود إعلامك بأن <strong>اشتراكك في باقة VIP قد انتهى</strong>.</p><p>للتجديد أو الاستفسار، يرجى التواصل معنا.</p><p>شكراً لثقتك بمنصة العمران.</p></div>`
    });
    if (ok) expiredEmailed++;
    else expiredEmailFailed++;
  }
  const soon = await findExpiringSoon(24);
  let emailed = 0;
  let reminderEmailFailed = 0;
  for (const row of soon) {
    if (!row.email) continue;
    const ok = await sendResendEmail({
      to: row.email,
      subject: "تذكير: اشتراك VIP ينتهي قريباً",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px"><h2>مرحباً ${row.name ?? ""},</h2><p>ينتهي اشتراكك خلال 24 ساعة.</p></div>`
    });
    if (ok) emailed++;
    else reminderEmailFailed++;
  }
  return {
    processed: soon.length,
    expired,
    emailed,
    expiredEmailed,
    expiredEmailFailed,
    reminderEmailFailed
  };
}
const testVipExpiry = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).handler(createSsrRpc("4e31fed744f1502c4fd3a455de3b458646141693e4fb894e3244a524fa9e09f0"));
createServerFn({
  method: "GET"
}).handler(createSsrRpc("69d407fbdbcf3b34e77d9a628c0a3b99e32de0b96ed945a3cd4aa6eef2f6af40"));
const listProjects = createServerFn({
  method: "GET"
}).handler(createSsrRpc("108da303932a7a7d02c5b9ed633a3d44fdfcbb2191a7f3c4a577cefacb50c97a"));
const getProject = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("733fbcb8fb28a6c5b7cf31b3247744ba1b32162789273385c0ee4a6f1e7c8013"));
const searchRequests = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  q: stringType().trim().min(1).max(200)
}).parse(d)).handler(createSsrRpc("b86f98e7f0fcb133545a93fadb38ee922e3837fea4287a16fa6b77327ac96ffd"));
const getBidPdfUrl = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  path: stringType().min(1).max(500)
}).parse(d)).handler(createSsrRpc("d9f867b576065bd30138998985d6a0306998465cdb7b77e80817a06cfae1c4a6"));
createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("eda19de27b2c907e246e2bdb835df6d9a12148d41da92c8ef3c5bdfc5b014cd1"));
const getPlatformRequests = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("8f652ff9fa3632dea93a9983aed261705bcabde86949f17d879eb4b6425a6e4d"));
createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("3add45dd2017b4ee770445d6ef39bfbb1c8e55446695d0a84cf782b68e7e3c4b"));
const updateRequestStatus = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  status: enumType(["pending", "new", "reviewing", "accepted", "rejected"]),
  note: stringType().trim().max(2e3).optional()
}).parse(d)).handler(createSsrRpc("e5c0d6ea7dc3bc9867e1856a96d83ab10b1626673d3cabae446f712b148916ab"));
const sendTestEmail = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  to: stringType().email()
}).parse(d)).handler(createSsrRpc("cf361682af2d298d02de7c0ec6763b8ac233c3c2cada447d7edee0ac2ab23e41"));
const projectSchema = objectType({
  id: stringType().uuid().optional(),
  name: stringType().trim().min(1).max(200),
  description: stringType().trim().min(1).max(5e3),
  location: stringType().trim().min(1).max(300),
  duration: stringType().trim().min(1).max(100),
  cover_image: stringType().trim().min(1).max(500),
  images: arrayType(stringType().max(500)).max(20).default([]),
  pdf_file: stringType().trim().max(500).nullable().optional()
});
const upsertProject = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => projectSchema.parse(d)).handler(createSsrRpc("387e6b502d42689d22fd064d3335afa86e3c44f2fe491ded2d3150cb36a91126"));
const deleteProject = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("873fe191eaddd17502d9e0ee23b50e63603c08b6463e76d6d368c74a4299f923"));
const updateProjectStatus = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  status: enumType(["active", "delivered", "cancelled"])
}).parse(d)).handler(createSsrRpc("54c65bf3dd015c1926564ab68fd48f22d297a13c1f853f3f20f031b78727cb37"));
const listEmployees = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("8c565f38645e9e9c5973bb0f53137c61eab38648c1e478f7dc867988f9e5df35"));
const listRoles = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("fdc69a2b243b4323d4797604135af2fbf7cfea053d2450646bdfcda3fc281304"));
const createEmployee = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  email: stringType().email().max(255),
  password: stringType().min(6).max(72),
  role_id: stringType().min(1).max(80)
}).parse(d)).handler(createSsrRpc("e530ff6faca702227cb960216134cfc2c9112cec642e05e30b7387124440b1ac"));
const deleteEmployee = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  user_id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("e17dc487a0036ee336605030048045203e2a326c9b140489d9df450b34555ca9"));
const getMyRoles = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("bc043367e3258bc0750efadc2962d5983ded7a90f892e25e8da034f07aee469d"));
const getMyUserId = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("e713b8df1ef850d860e649e0be3826f2ae16f9211b6d494a158d6e6f22a645a1"));
const adminListMessages = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("a93dcca664db7845b2d7a9b6c8f0b0f7cb52a62972f962422ce68f8dd2e3fd1e"));
const countContactMessages = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  since: stringType().nullable()
}).parse(d)).handler(createSsrRpc("cb8cf01b590bf98771097cf69a35af15af6ad3c0b339c353031913abb86d88c0"));
const adminDeleteContactMessage = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("7f22a1795cf16f98b92e03c263c95f6dd64ca6dc1132ebeefbcc5b9f73d9b82b"));
const adminSendCustomEmail = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  to: stringType().trim().email().max(255),
  subject: stringType().trim().min(1).max(300),
  message: stringType().trim().min(1).max(1e4)
}).parse(d)).handler(createSsrRpc("02f48f0c640ff1b2fcf707b7db584473b8cd4a9e445a3f6c8dc0d2aa7b195b8c"));
const adminReplyContactMessage = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  reply: stringType().trim().min(1).max(5e3)
}).parse(d)).handler(createSsrRpc("611c241d7fb4bb14926a88872df26c49a49ceddd2c20ae072560cbb5b4f7f30b"));
createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  email: stringType().email().max(255),
  password: stringType().min(6).max(72)
}).parse(d)).handler(createSsrRpc("d9b106c849be0fd2f7ab18c8e15ec604b7dc5de4962751279938eef968292b51"));
const submitBidRequest = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  project_id: stringType().uuid().optional().nullable(),
  company_name: stringType().trim().min(1).max(200),
  facility_location: stringType().trim().min(1).max(300),
  email: stringType().trim().email().max(255),
  file_name: stringType().trim().min(1).max(200),
  file_base64: stringType().min(8).max(15e6),
  vip_token: stringType().optional().nullable(),
  project_name: stringType().trim().max(200).optional()
}).parse(d)).handler(createSsrRpc("49c390e7bc2471cb180475c3dfd0a2969eafc9d669d1f703838230d7f6d6e6d9"));
createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  company_name: stringType().trim().min(1).max(200),
  facility_location: stringType().trim().min(1).max(300),
  email: stringType().trim().email().max(255),
  submitter_type: enumType(["client", "visitor"]),
  file_name: stringType().trim().min(1).max(200),
  file_base64: stringType().min(8).max(15e6)
}).parse(d)).handler(createSsrRpc("fd5bc09fc8660adfdcd4616b6410796c52b1503d5e4ba402984129c34172ea41"));
const imageItemSchema = objectType({
  file_name: stringType().trim().min(1).max(200),
  file_base64: stringType().min(8).max(8e6),
  content_type: stringType().regex(/^image\/(png|jpe?g|webp|gif)$/)
});
createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  name: stringType().trim().min(1).max(200),
  description: stringType().trim().min(1).max(5e3),
  location: stringType().trim().min(1).max(300),
  contact_phone: stringType().trim().min(4).max(40).regex(/^[0-9+\-\s()]+$/),
  images: arrayType(imageItemSchema).max(8).default([])
}).parse(d)).handler(createSsrRpc("ab973bdd239dcdf060993b79d04685ed1e203bad5ea576703bca855610fbe619"));
createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(createSsrRpc("f7cb4f36ca6b1736293532e9375e5e0f66e9982dea905b88e87abdea4fe1dba0"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("e4885eaeb8ac9297e550ed13942ebcf044f892f4b68e4716a5c74f13b57b131e"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("7ad1a8c9b4759d7b2a2362dbde9568531fd386e179b272a7e4daca399eafbc69"));
createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  name: stringType().trim().min(1).max(200),
  description: stringType().trim().min(1).max(5e3),
  location: stringType().trim().min(1).max(300),
  contact_phone: stringType().trim().min(4).max(40).regex(/^[0-9+\-\s()]+$/),
  image_paths: arrayType(stringType().trim().min(1).max(500)).max(8).default([])
}).parse(d)).handler(createSsrRpc("ec33fce6512ac111f8be4cb4b7013872e5de7e589be41b2cae5a1d61eb469d8f"));
const sendRequestMessage = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  to: stringType().trim().email().max(255),
  message: stringType().trim().min(1).max(3e3)
}).parse(d)).handler(createSsrRpc("aff117b1e0b4be6dbba2be2060e23662a6cdac14409b025a8c42404d5161cd84"));
const adminListProjectOfferToggles = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("aceaa671ae0c02774591c3ab3a250fc497ecd82113315e64a670b81ffea6766e"));
const adminSetProjectBotOffersEnabled = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  enabled: booleanType()
}).parse(d)).handler(createSsrRpc("60f5263309fdc132607d93bca522cc36ccdd154de4adb18313665bdbaf8b9cb4"));
const adminSetAllProjectBotOffersEnabled = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  enabled: booleanType()
}).parse(d)).handler(createSsrRpc("2db74c92baeb5d843e274872db3d4ed5b5eb082b316f00ac263401003b5f2678"));
const adminSetProjectOffersEnabled = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  enabled: booleanType()
}).parse(d)).handler(createSsrRpc("4972077c58c3cae31fbfd59642caffaaff860ed682186b858700635f81bc3edd"));
const adminSetAllProjectOffersEnabled = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  enabled: booleanType()
}).parse(d)).handler(createSsrRpc("058fb37501b7ad4f017138ee348dafec62f582e641973f94bdaee5e792354d74"));
const getExclusiveStatus = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  projectId: stringType().min(1),
  vip_token: stringType().optional().nullable()
}).parse(d)).handler(createSsrRpc("49867c4d400851977f9eda18b4c471e7906e96a9b56d2e425a6644d4a76e7cf2"));
createServerFn({
  method: "GET"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid()
}).parse(d)).handler(createSsrRpc("77ff4eb7c6301529d5cd1b294e0d6988476df6bb1844f5c358260435deb1bfb1"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid(),
  durationHours: numberType().int().min(0).max(720)
}).parse(d)).handler(createSsrRpc("eb481968f5b65fae23a4b92192abbd939d41ee354876a29434172e6f22a9e5a8"));
const searchProjectByName = createServerFn({
  method: "GET"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  q: stringType().trim().min(1).max(200)
}).parse(d)).handler(createSsrRpc("1979a1e4f5d59cbaace842255e4b855ae012ccda75fe38f4250f5d0f795f9a80"));
const updateExclusivityHours = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid(),
  hours: numberType().int().min(1).max(720)
}).parse(d)).handler(createSsrRpc("29d8cf46b86526f4ed2e12e14db38fce20f673c434cc32bba64fd9df14d0d158"));
const toggleExclusivityOn = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid(),
  hours: numberType().int().min(1).max(720)
}).parse(d)).handler(createSsrRpc("66bf2c9f42071c86851f464f05150cc8b7062a838c064377680faa7baaf41f1e"));
const toggleExclusivityOff = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  projectId: stringType().uuid()
}).parse(d)).handler(createSsrRpc("d2db6b6f294d9a394e3406772dd37197a4cd4e971477c25f77a6607fe3f33d1d"));
const TOKEN_KEY = "support_visitor_token_v1";
const IDLE_MS = 5 * 60 * 1e3;
const OFFER_FLOW_MARKER = "__OFFER_FLOW__";
const VIP_FLOW_MARKER = "__VIP_FLOW__";
const VIP_PLANS = [
  { value: "100-30", label: "100 ريال — 30 يوم" },
  { value: "200-60", label: "200 ريال — 60 يوم" },
  { value: "300-90", label: "300 ريال — 90 يوم" }
];
function generateUuid() {
  const browserCrypto = globalThis.crypto;
  if (browserCrypto?.randomUUID) {
    return browserCrypto.randomUUID();
  }
  if (!browserCrypto?.getRandomValues) {
    return "10000000-1000-4000-8000-100000000000".replace(
      /[018]/g,
      (c) => (Number(c) ^ Math.random() * 16 >> Number(c) / 4).toString(16)
    );
  }
  const bytes = new Uint8Array(16);
  browserCrypto.getRandomValues(bytes);
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}
function SupportChatWidget() {
  const qc = useQueryClient();
  const [mounted, setMounted] = reactExports.useState(false);
  const [open, setOpen] = reactExports.useState(false);
  const [showBubble, setShowBubble] = reactExports.useState(false);
  const [bubbleDismissed, setBubbleDismissed] = reactExports.useState(false);
  const [token, setToken] = reactExports.useState("");
  const [input, setInput] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const [sendError, setSendError] = reactExports.useState(null);
  const scrollRef = reactExports.useRef(null);
  const idleTimer = reactExports.useRef(null);
  const bubbleTimer = reactExports.useRef(null);
  const [offerMsgId, setOfferMsgId] = reactExports.useState(null);
  const [offerStep, setOfferStep] = reactExports.useState(null);
  const [offerForm, setOfferForm] = reactExports.useState({ projectName: "", companyName: "", email: "", amount: "" });
  const [offerProjectId, setOfferProjectId] = reactExports.useState("");
  const [offerFile, setOfferFile] = reactExports.useState(null);
  const [offerBusy, setOfferBusy] = reactExports.useState(false);
  const [offerError, setOfferError] = reactExports.useState(null);
  const [vipMsgId, setVipMsgId] = reactExports.useState(null);
  const [vipStep, setVipStep] = reactExports.useState(null);
  const [vipForm, setVipForm] = reactExports.useState({ name: "", email: "", city: "", plan: "" });
  const [vipFile, setVipFile] = reactExports.useState(null);
  const [vipBusy, setVipBusy] = reactExports.useState(false);
  const [vipError, setVipError] = reactExports.useState(null);
  const listQa = useServerFn(listBotQuestions);
  const startFn = useServerFn(startVisitorChat);
  const getMsgs = useServerFn(visitorGetMessages);
  const sendFn = useServerFn(visitorSendMessage);
  const endFn = useServerFn(visitorEndSession);
  const getSettings = useServerFn(getBotSettings);
  const submitOfferFn = useServerFn(submitOffer);
  const submitVipFn = useServerFn(submitVipSubscription);
  const listProjectsFn = useServerFn(listProjects);
  reactExports.useEffect(() => {
    setMounted(true);
  }, []);
  reactExports.useEffect(() => {
    if (!mounted || bubbleDismissed) return;
    const showTimer = setTimeout(() => setShowBubble(true), 1500);
    const hideTimer = setTimeout(() => setShowBubble(false), 61500);
    bubbleTimer.current = hideTimer;
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [mounted, bubbleDismissed]);
  const dismissBubble = reactExports.useCallback(() => {
    setShowBubble(false);
    setBubbleDismissed(true);
    if (bubbleTimer.current) {
      clearTimeout(bubbleTimer.current);
      bubbleTimer.current = null;
    }
  }, []);
  const openFromBubble = reactExports.useCallback(() => {
    dismissBubble();
    setOpen(true);
  }, [dismissBubble]);
  reactExports.useEffect(() => {
    const handler = () => setOpen(true);
    if (typeof window !== "undefined") {
      window.addEventListener("open-support-chat", handler);
      return () => window.removeEventListener("open-support-chat", handler);
    }
  }, []);
  const endSession = reactExports.useCallback(async (opts) => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    const t = token;
    setToken("");
    setInput("");
    setSendError(null);
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    if (t) {
      try {
        await endFn({ data: { visitorToken: t } });
      } catch {
      }
      qc.removeQueries({ queryKey: ["support-visitor-chat", t] });
    }
    if (!opts?.silent) ;
  }, [token, endFn, qc]);
  const resetIdle = reactExports.useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!open || !token) return;
    idleTimer.current = setTimeout(() => {
      endSession({ silent: true });
    }, IDLE_MS);
  }, [open, token, endSession]);
  reactExports.useEffect(() => {
    if (!open || !mounted) return;
    if (token) return;
    const t = generateUuid();
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    startFn({ data: { visitorToken: t } }).catch(() => {
    });
  }, [open, mounted, token, startFn]);
  reactExports.useEffect(() => {
    if (!token) return;
    const onUnload = () => {
      try {
        if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        }
      } catch {
      }
      if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [token]);
  const { data: qaList = [] } = useQuery({
    queryKey: ["bot-qa-public"],
    queryFn: () => listQa(),
    enabled: open,
    staleTime: 6e4
  });
  const { data: botSettings } = useQuery({
    queryKey: ["bot-settings-public"],
    queryFn: () => getSettings(),
    enabled: open,
    staleTime: 6e4
  });
  const { data: projectsList = [] } = useQuery({
    queryKey: ["projects-public-list"],
    queryFn: () => listProjectsFn(),
    enabled: open,
    staleTime: 6e4
  });
  const { data: chatData } = useQuery({
    queryKey: ["support-visitor-chat", token],
    queryFn: () => getMsgs({ data: { visitorToken: token, sinceIso: null } }),
    enabled: open && !!token,
    refetchInterval: open && !!token ? 3e3 : false
  });
  const messages = chatData?.messages ?? [];
  const status = chatData?.chat?.status ?? "bot";
  const lastMsg = messages[messages.length - 1];
  const showEndAfterBot = !!lastMsg && (lastMsg.sender === "bot" || lastMsg.sender === "admin");
  const offerTriggerId = reactExports.useMemo(() => {
    const m = [...messages].reverse().find((x) => x.sender === "bot" && x.body.includes(OFFER_FLOW_MARKER));
    return m?.id ?? null;
  }, [messages]);
  reactExports.useEffect(() => {
    if (!offerTriggerId) return;
    if (offerMsgId === offerTriggerId) return;
    setOfferMsgId(offerTriggerId);
    setOfferStep("terms");
    setOfferError(null);
    setOfferFile(null);
    setOfferForm({ projectName: "", companyName: "", email: "", amount: "" });
    setOfferProjectId("");
  }, [offerTriggerId, offerMsgId]);
  const vipTriggerId = reactExports.useMemo(() => {
    const m = [...messages].reverse().find((x) => x.sender === "bot" && x.body.includes(VIP_FLOW_MARKER));
    return m?.id ?? null;
  }, [messages]);
  reactExports.useEffect(() => {
    if (!vipTriggerId) return;
    if (vipMsgId === vipTriggerId) return;
    setVipMsgId(vipTriggerId);
    setVipStep("terms");
    setVipError(null);
    setVipFile(null);
    setVipForm({ name: "", email: "", city: "", plan: "" });
  }, [vipTriggerId, vipMsgId]);
  async function handleVipSubmit() {
    if (vipBusy) return;
    const { name, email, city, plan } = vipForm;
    if (!name.trim() || !email.trim() || !city.trim() || !plan.trim()) {
      setVipError("يرجى إكمال جميع الحقول.");
      return;
    }
    if (!vipFile) {
      setVipError("يرجى رفع صورة الإيصال.");
      return;
    }
    setVipBusy(true);
    setVipError(null);
    try {
      const fd = new FormData();
      fd.append("file", vipFile);
      fd.append("purpose", "vip-receipt");
      const res = await fetch("/api/public/upload", { method: "POST", body: fd });
      const json2 = await res.json();
      if (!res.ok || !json2.key) throw new Error(json2.error || "تعذر رفع الملف");
      await submitVipFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          receipt_path: json2.key,
          plan: plan.trim(),
          city: city.trim()
        }
      });
      setVipStep("done");
      qc.invalidateQueries({ queryKey: ["support-visitor-chat", token] });
    } catch (e) {
      setVipError(e instanceof Error ? e.message : "تعذر إرسال الطلب، حاول مرة أخرى.");
    } finally {
      setVipBusy(false);
    }
  }
  async function handleOfferSubmit() {
    if (offerBusy) return;
    const { companyName, email, amount } = offerForm;
    if (!offerProjectId) {
      setOfferError("يرجى اختيار مشروع.");
      return;
    }
    if (!companyName.trim() || !email.trim() || !amount.trim()) {
      setOfferError("يرجى إكمال جميع الحقول.");
      return;
    }
    if (!offerFile) {
      setOfferError("يرجى رفع ملف العرض بصيغة PDF.");
      return;
    }
    const isPdf = offerFile.type === "application/pdf" || offerFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setOfferError("الملف يجب أن يكون PDF.");
      return;
    }
    setOfferBusy(true);
    setOfferError(null);
    try {
      const fd = new FormData();
      fd.append("file", offerFile);
      fd.append("purpose", "bid-pdf");
      const res = await fetch("/api/public/upload", { method: "POST", body: fd });
      const json2 = await res.json();
      if (!res.ok || !json2.key) throw new Error(json2.error || "تعذر رفع الملف");
      const vipToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("vip_token") : null;
      const result = await submitOfferFn({
        data: {
          project_id: offerProjectId,
          projectName: projectsList.find((p) => p.id === offerProjectId)?.name ?? "",
          companyName: companyName.trim(),
          email: email.trim(),
          amount: amount.trim(),
          pdfKey: json2.key,
          pdfFilename: offerFile.name,
          visitorToken: token || null,
          vipToken: vipToken || null
        }
      });
      if (!result?.ok) {
        setOfferError(result?.message ?? "المشروع غير موجود");
        return;
      }
      setOfferStep("done");
      qc.invalidateQueries({ queryKey: ["support-visitor-chat", token] });
    } catch (e) {
      setOfferError(e instanceof Error ? e.message : "تعذر إرسال العرض، حاول مرة أخرى.");
    } finally {
      setOfferBusy(false);
    }
  }
  reactExports.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, open]);
  reactExports.useEffect(() => {
    resetIdle();
  }, [messages.length, resetIdle]);
  reactExports.useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);
  async function handleSend(text, qaId) {
    if (!token || !text.trim() || sending) return;
    const body = text.trim();
    setSending(true);
    setSendError(null);
    try {
      await startFn({ data: { visitorToken: token } });
      await sendFn({ data: { visitorToken: token, body, qaId: qaId != null ? String(qaId) : null } });
      setInput("");
      qc.invalidateQueries({ queryKey: ["support-visitor-chat", token] });
      resetIdle();
    } catch {
      setSendError("تعذر إرسال الرسالة، حاول مرة أخرى.");
    } finally {
      setSending(false);
    }
  }
  const canShowQuickQuestions = reactExports.useMemo(
    () => status === "bot" && qaList.length > 0 && (botSettings?.show_suggested_questions ?? true),
    [status, qaList.length, botSettings?.show_suggested_questions]
  );
  if (!mounted) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    !open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2", children: [
      showBubble && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: openFromBubble,
          className: "relative mb-1 mr-1 max-w-[260px] rounded-2xl rounded-br-md bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-elegant)] ring-1 ring-border animate-in fade-in slide-in-from-bottom-2 duration-300",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block pr-5", children: "تحتاج مساعدة؟ 👋" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  dismissBubble();
                },
                className: "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
                "aria-label": "إغلاق",
                role: "button",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" })
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setOpen(true),
          "aria-label": "افتح شات الدعم",
          className: "grid h-14 w-14 place-items-center rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground shadow-[var(--shadow-elegant)] transition hover:scale-105",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-6 w-6" })
        }
      )
    ] }),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onMouseMove: resetIdle,
        onKeyDown: resetIdle,
        className: "fixed bottom-5 right-5 z-50 flex h-[560px] max-h-[85vh] w-[360px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-elegant)]",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border bg-[image:var(--gradient-hero)] px-4 py-3 text-primary-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-8 w-8 place-items-center rounded-full bg-white/15", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Headphones, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: "دعم العمران" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] opacity-80", children: status === "escalated" ? "متصل مع موظف" : status === "closed" ? "المحادثة مغلقة" : "المساعد الآلي" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setOpen(false), className: "rounded-md p-1 hover:bg-white/10", "aria-label": "إغلاق", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: scrollRef, className: "flex-1 space-y-2 overflow-y-auto bg-secondary/30 p-3", children: [
            messages.map((m) => {
              const mine = m.sender === "visitor";
              const isSystem = m.sender === "system";
              if (isSystem) {
                return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-[85%] rounded-md bg-accent/15 px-3 py-1.5 text-center text-[11px] text-foreground/70", children: m.body }, m.id);
              }
              return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${mine ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground" : m.sender === "admin" ? "bg-accent text-accent-foreground" : "bg-background border border-border"}`, children: [
                m.sender === "admin" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-0.5 text-[10px] font-semibold opacity-80", children: "موظف الدعم" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "whitespace-pre-wrap break-words", dangerouslySetInnerHTML: { __html: m.body.replace(OFFER_FLOW_MARKER, "").replace(VIP_FLOW_MARKER, "").trim() } })
              ] }) }, m.id);
            }),
            offerStep === "terms" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-background p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setOfferStep("form"),
                className: "w-full rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90",
                children: "أوافق على الشروط"
              }
            ) }),
            offerStep === "form" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-xl border border-border bg-background p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold text-muted-foreground", children: "بيانات عرض السعر:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: offerProjectId,
                  onChange: (e) => setOfferProjectId(e.target.value),
                  className: "w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "اختر المشروع" }),
                    projectsList.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.id, children: p.name }, p.id))
                  ]
                }
              ),
              [
                ["companyName", "اسم الشركة"],
                ["email", "البريد الإلكتروني"],
                ["amount", "قيمة العرض"]
              ].map(([field, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: offerForm[field],
                  onChange: (e) => setOfferForm((f) => ({ ...f, [field]: e.target.value })),
                  placeholder: label,
                  type: field === "email" ? "email" : "text",
                  className: "w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                },
                field
              )),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-[11px] font-medium hover:bg-secondary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileUp, { className: "h-3.5 w-3.5" }),
                offerFile ? offerFile.name : "رفع ملف العرض (PDF)",
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "file",
                    accept: "application/pdf",
                    className: "hidden",
                    onChange: (e) => setOfferFile(e.target.files?.[0] ?? null)
                  }
                )
              ] }),
              offerError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-destructive", children: offerError }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: handleOfferSubmit,
                    disabled: offerBusy,
                    className: "flex-1 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
                    children: offerBusy ? "جارٍ الإرسال…" : "إرسال العرض"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => {
                      setOfferStep(null);
                      setOfferError(null);
                    },
                    className: "rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary",
                    children: "إلغاء"
                  }
                )
              ] })
            ] }),
            offerStep === "done" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background p-3 text-[11px] font-semibold text-foreground/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-primary" }),
              "تم استلام عرضك بنجاح. سيتم اشعاركم بأي تحديث"
            ] }),
            vipStep === "terms" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-background p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 space-y-1 text-[11px] text-muted-foreground", children: [
                VIP_PLANS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: p.label }, p.value)),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-1", children: "تستقبل مشاريع خاصة عبر الإيميل بلا منافس + دعم فني VIP" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-1", children: "IBAN: SA35 1000 0065 5000 4711 0807" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setVipStep("form"),
                  className: "w-full rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90",
                  children: "أرغب بالاشتراك"
                }
              )
            ] }),
            vipStep === "form" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-xl border border-border bg-background p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold text-muted-foreground", children: "بيانات الاشتراك:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: vipForm.name,
                  onChange: (e) => setVipForm((f) => ({ ...f, name: e.target.value })),
                  placeholder: "الاسم",
                  className: "w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  value: vipForm.email,
                  onChange: (e) => setVipForm((f) => ({ ...f, email: e.target.value })),
                  placeholder: "البريد الإلكتروني",
                  type: "email",
                  className: "w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: vipForm.city,
                  onChange: (e) => setVipForm((f) => ({ ...f, city: e.target.value })),
                  className: "w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "اختر المدينة" }),
                    SAUDI_CITIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c))
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: vipForm.plan,
                  onChange: (e) => setVipForm((f) => ({ ...f, plan: e.target.value })),
                  className: "w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "اختر الباقة" }),
                    VIP_PLANS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.value, children: p.label }, p.value))
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-[11px] font-medium hover:bg-secondary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileUp, { className: "h-3.5 w-3.5" }),
                vipFile ? vipFile.name : "رفع صورة الإيصال",
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "file",
                    accept: "image/*,application/pdf",
                    className: "hidden",
                    onChange: (e) => setVipFile(e.target.files?.[0] ?? null)
                  }
                )
              ] }),
              vipError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-destructive", children: vipError }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: handleVipSubmit,
                    disabled: vipBusy,
                    className: "flex-1 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
                    children: vipBusy ? "جارٍ الإرسال…" : "إرسال الطلب"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => {
                      setVipStep(null);
                      setVipError(null);
                    },
                    className: "rounded-md border border-border px-3 py-2 text-xs hover:bg-secondary",
                    children: "إلغاء"
                  }
                )
              ] })
            ] }),
            vipStep === "done" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background p-3 text-[11px] font-semibold text-foreground/80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-primary" }),
              "تم استلام طلبك. سيتم إرسال تأكيد على إيميلك بعد الموافقة"
            ] }),
            showEndAfterBot && token && !offerStep && !vipStep && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-start pt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => endSession(),
                className: "inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-[11px] font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(PowerOff, { className: "h-3 w-3" }),
                  "إنهاء المحادثة"
                ]
              }
            ) })
          ] }),
          canShowQuickQuestions && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border bg-background/60 p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-[11px] font-semibold text-muted-foreground", children: "اختر سؤالًا:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: qaList.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => handleSend(q.question, q.id),
                disabled: sending,
                className: "rounded-full border border-border bg-secondary px-3 py-1 text-[11px] hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
                children: q.question
              },
              q.id
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border bg-background p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "form",
              {
                onSubmit: (e) => {
                  e.preventDefault();
                  handleSend(input);
                },
                className: "flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      value: input,
                      onChange: (e) => setInput(e.target.value),
                      maxLength: 2e3,
                      placeholder: "اكتب رسالتك…",
                      className: "flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "submit",
                      disabled: !input.trim() || sending,
                      className: "inline-flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background disabled:opacity-50",
                      "aria-label": "إرسال",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" })
                    }
                  )
                ]
              }
            ),
            sendError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[11px] text-destructive", children: sendError })
          ] })
        ]
      }
    )
  ] });
}
const getVipMaintenance = createServerFn({
  method: "GET"
}).handler(createSsrRpc("e37ef2463aa86b5e52ad7d1d5e3203b5ffbbc00e102276fa280036aae832a9ac"));
const setVipMaintenance = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  enabled: booleanType()
}).parse(d)).handler(createSsrRpc("aad3e9706e54bcd02055ffffe6f7665f755a69cd12594265650302f41ade5078"));
const getHideSupportChat = createServerFn({
  method: "GET"
}).handler(createSsrRpc("b5e36592858524cbe2f05bb9ab7731685df655bfb0b3baa905db2bee07360060"));
const setHideSupportChat = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  enabled: booleanType()
}).parse(d)).handler(createSsrRpc("160ebc02d3b498615964cc4f281517cce0c7e2c3044a62cac752d76cd3d34fa1"));
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  reactExports.useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const hideSupportChatQuery = { queryKey: ["hide-support-chat-public"], queryFn: () => getHideSupportChat() };
const Route$N = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "العمران — منصة مشاريع المقاولات" },
      { name: "description", content: "تصفح أحدث مشاريع المقاولات وقدّم عرض السعر الخاص بك مباشرة." },
      { property: "og:title", content: "العمران — منصة مشاريع المقاولات" },
      { property: "og:description", content: "تصفح أحدث مشاريع المقاولات وقدّم عرض السعر الخاص بك مباشرة." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "العمران — منصة مشاريع المقاولات" },
      { name: "twitter:description", content: "تصفح أحدث مشاريع المقاولات وقدّم عرض السعر الخاص بك مباشرة." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f3cf0c36-d7d5-4aee-8c13-493bd552b646/id-preview-02ae6275--14273433-916d-4fa8-a232-1ef6c9dabe2b.lovable.app-1780535238442.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f3cf0c36-d7d5-4aee-8c13-493bd552b646/id-preview-02ae6275--14273433-916d-4fa8-a232-1ef6c9dabe2b.lovable.app-1780535238442.png" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f3cf0c36-d7d5-4aee-8c13-493bd552b646/id-preview-02ae6275--14273433-916d-4fa8-a232-1ef6c9dabe2b.lovable.app-1780535238442.png" },
      { rel: "apple-touch-icon", href: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f3cf0c36-d7d5-4aee-8c13-493bd552b646/id-preview-02ae6275--14273433-916d-4fa8-a232-1ef6c9dabe2b.lovable.app-1780535238442.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" }
    ]
  }),
  beforeLoad: async ({ location }) => {
    const p = location.pathname;
    if (p.startsWith("/lovable/") || p === "/email/unsubscribe") return;
    if (p === "/index") {
      throw redirect({ to: "/" });
    }
    const ALLOW_PREFIXES2 = ["/maintenance", "/auth", "/reset-password", "/api/", "/admin"];
    const allowed = ALLOW_PREFIXES2.some((pre) => p === pre || p.startsWith(pre));
    if (allowed) return;
    const [m, me] = await Promise.all([
      getMaintenance(),
      getMe().catch(() => null)
    ]);
    if (m.enabled && !(me && hasAdminRole(me.roles))) {
      throw redirect({ to: "/maintenance", replace: true });
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(hideSupportChatQuery),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "ar", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$N.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(MaintenanceGate, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PublicSupportWidget, {})
  ] });
}
function PublicSupportWidget() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: hideChat } = useSuspenseQuery(hideSupportChatQuery);
  if (path.startsWith("/admin") || path.startsWith("/auth") || path.startsWith("/reset-password") || path.startsWith("/lovable/") || path.startsWith("/email/") || path === "/maintenance") return null;
  if (hideChat?.enabled) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SupportChatWidget, {});
}
const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => listProjects()
});
const $$splitComponentImporter$A = () => import("./index-CoHBLCUe.mjs");
const Route$M = createFileRoute()({
  head: () => ({
    meta: [{
      title: "العمران — منصة مشاريع المقاولات"
    }, {
      name: "description",
      content: "تصفح أحدث مشاريع المقاولات وقدّم عرض السعر الخاص بك مباشرة."
    }]
  }),
  loader: ({
    context
  }) => context.queryClient.ensureQueryData(projectsQuery),
  component: lazyRouteComponent($$splitComponentImporter$A, "component")
});
const $$splitComponentImporter$z = () => import("./route-BFsOu0JM.mjs");
const Route$L = createFileRoute()({
  ssr: false,
  beforeLoad: async () => {
    const me = await getMe();
    if (!me) throw redirect({
      to: "/auth"
    });
    return {
      user: me
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$z, "component")
});
const $$splitComponentImporter$y = () => import("./ads-kEBIZL7a.mjs");
const Route$K = createFileRoute()({
  head: () => ({
    meta: [{
      title: "الإعلانات — منصة المقاولات"
    }, {
      name: "description",
      content: "تصفح آخر الإعلانات المعتمدة على المنصة."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$y, "component")
});
const $$splitComponentImporter$x = () => import("./auth-CoL-b1Fv.mjs");
const Route$J = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$x, "component")
});
const $$splitComponentImporter$w = () => import("./contact-Cc9JOcrY.mjs");
const Route$I = createFileRoute()({
  head: () => ({
    meta: [{
      title: "تواصل بنا — العمران"
    }, {
      name: "description",
      content: "تواصل مع فريق منصة العمران لمشاريع المقاولات."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$w, "component")
});
const $$splitComponentImporter$v = () => import("./forgot-password-CkJDHMm7.mjs");
const Route$H = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$v, "component")
});
const $$splitComponentImporter$u = () => import("./maintenance-SSFEBgct.mjs");
const Route$G = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$u, "component"),
  head: () => ({
    meta: [{
      title: "الموقع تحت الصيانة"
    }, {
      name: "description",
      content: "الموقع في وضع الصيانة مؤقتًا. سنعود قريبًا."
    }, {
      name: "robots",
      content: "noindex"
    }]
  })
});
const $$splitComponentImporter$t = () => import("./my-requests-B7LzAKof.mjs");
const Route$F = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$t, "component")
});
const $$splitComponentImporter$s = () => import("./projects-FPGxDpVY.mjs");
const Route$E = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./reset-password-DFACgX69.mjs");
const Route$D = createFileRoute()({
  validateSearch: (search) => ({
    token: typeof search.token === "string" ? search.token : void 0
  }),
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./subscribe-success-D46myBHO.mjs");
const Route$C = createFileRoute()({
  head: () => ({
    meta: [{
      title: "تم الاشتراك بنجاح — العمران"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./thank-you-RtVEqYBZ.mjs");
const Route$B = createFileRoute()({
  head: () => ({
    meta: [{
      title: "شكراً لكم — تم استلام طلبكم"
    }, {
      name: "description",
      content: "تم استلام طلبكم بنجاح وسيتم التواصل بكم لاحقاً."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("./unsubscribe-CAo86eIt.mjs");
const Route$A = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const $$splitComponentImporter$n = () => import("./vip-BFsOu0JM.mjs");
const Route$z = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./admin-BezxMKEs.mjs");
const Route$y = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
const Route$x = createFileRoute()({
  beforeLoad: () => {
    throw redirect({ to: "/admin/chat" });
  }
});
const Route$w = createFileRoute()({
  beforeLoad: () => {
    throw redirect({ to: "/admin/requests" });
  }
});
const Route$v = createFileRoute()({
  beforeLoad: () => {
    throw redirect({ to: "/admin/employees" });
  }
});
const $$splitComponentImporter$l = () => import("./upload-CgTPINYJ.mjs");
const Route$u = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$l, "component"),
  head: () => ({
    meta: [{
      title: "رفع الملفات"
    }]
  })
});
const adSchema = objectType({
  title: stringType().trim().min(1).max(200),
  description: stringType().trim().max(2e3).optional().default(""),
  location: stringType().trim().max(300).optional().default(""),
  image_url: stringType().trim().max(1e3).optional().default("")
});
createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => adSchema.parse(d)).handler(createSsrRpc("a063de24e27e7066703bf4640340a5f98e56ac9e25a5324ae1896bd72f3339e9"));
const listPendingAds = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("9df46a5875b60883376ae5ded6ff62d2c029a5e63ceaee7a57d3d4387c07232a"));
const countPendingAds = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(createSsrRpc("3f82ba1060afbc012e7aa4eb899978a01af558ced2c471d584282a43987d701c"));
const approveAd = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("ba5e5d3e45d027763b3e6f83463fd24c55b59547ee2957357a0b658ee58c9729"));
const rejectAd = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  reason: stringType().trim().min(1).max(500)
}).parse(d)).handler(createSsrRpc("f49e090916aa28e89ee0ee0eaa1c2632215cadab9f9b670fe8121a6271c37f47"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  title: stringType().trim().min(1).max(200),
  description: stringType().trim().max(2e3).optional().default(""),
  location: stringType().trim().max(300).optional().default(""),
  image_url: stringType().trim().max(1e3).optional().default("")
}).parse(d)).handler(createSsrRpc("ba8201b60d030f84ad17817069c7fd101140ec025edaa95101eb79c705206605"));
createServerFn({
  method: "POST"
}).middleware([requireAdmin]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("165f6b5098b795c7472c0550a57f60e43dd18da3ce1c2f9509a61dff5b5b1836"));
const deleteMyAd = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("944bdf9b14036b6396cdff2ceede4468310a8caa97d79271cc547dd1bbd80d54"));
const listApprovedAds = createServerFn({
  method: "GET"
}).handler(createSsrRpc("2c215c91a90faef79da9d18b0eb92d1ef9fbb18f84106d533d5af37449a05903"));
const getApprovedAd = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("e65f1c7b2b5c36bbc7a7b847ae74a85fff6117377deccf4cd42c9a446ca3737a"));
createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  title: stringType().trim().min(1).max(200),
  description: stringType().trim().max(2e3).optional().default(""),
  location: stringType().trim().max(300).optional().default(""),
  image_path: stringType().trim().max(500).optional().default(""),
  pdf_key: stringType().trim().max(500).optional().default(""),
  contact_email: stringType().trim().max(255).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "بريد إلكتروني غير صحيح").optional().default("")
}).parse(d)).handler(createSsrRpc("8e18ebb7412094656070fe87bb4f75b5585d040dde6dc8879e5a04cdef734f7b"));
const listAdComments = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  adId: stringType().uuid()
}).parse(d)).handler(createSsrRpc("5b95ad651485d828d299837e8ae3aebcf2601ddb83a81bafd444e7c657d79eb8"));
const submitAdComment = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  adId: stringType().uuid(),
  author_name: stringType().trim().min(1).max(80),
  contact: stringType().trim().max(120).optional().default(""),
  body: stringType().trim().min(1).max(1e3)
}).parse(d)).handler(createSsrRpc("1ce867041959958fcb72da9a77d8774d8c5933420d2de303a25279903543e4fc"));
const $$splitComponentImporter$k = () => import("./ads._adId-Bk_o9r7P.mjs");
const $$splitNotFoundComponentImporter = () => import("./ads._adId-CVQVz34c.mjs");
const $$splitErrorComponentImporter = () => import("./ads._adId-DlCU7388.mjs");
const Route$t = createFileRoute()({
  loader: async ({
    params
  }) => {
    const ad = await getApprovedAd({
      data: {
        id: params.adId
      }
    });
    if (!ad) throw notFound();
    return ad;
  },
  head: ({
    loaderData
  }) => ({
    meta: [{
      title: loaderData ? `${loaderData.title} — إعلان` : "إعلان"
    }, {
      name: "description",
      content: loaderData?.description?.slice(0, 160) ?? ""
    }, {
      property: "og:title",
      content: loaderData?.title ?? "إعلان"
    }, {
      property: "og:description",
      content: loaderData?.description?.slice(0, 160) ?? ""
    }, ...loaderData?.image_signed_url ? [{
      property: "og:image",
      content: loaderData.image_signed_url
    }] : []]
  }),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
async function isEmailSuppressed(email) {
  const r = await db.execute(`SELECT id FROM suppressed_emails WHERE lower(email) = lower(?) LIMIT 1`, [email]);
  return rowsToObjects(r).length > 0;
}
async function suppressEmail(email, reason, source = "app") {
  await db.execute(
    `INSERT INTO suppressed_emails (id, email, reason, source, created_at)
     VALUES (?, lower(?), ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET reason = excluded.reason, source = excluded.source`,
    [crypto.randomUUID(), email, reason, source, (/* @__PURE__ */ new Date()).toISOString()]
  );
}
async function getUnsubscribeToken(token) {
  const r = await db.execute(`SELECT id,email,token,used FROM email_unsubscribe_tokens WHERE token = ? LIMIT 1`, [token]);
  const row = rowsToObjects(r)[0];
  if (!row) return null;
  return { id: String(row.id), email: String(row.email), token: String(row.token), used: Number(row.used ?? 0) === 1 };
}
async function getOrCreateUnsubscribeToken(email, tokenFactory) {
  const existing = await db.execute(`SELECT token,used FROM email_unsubscribe_tokens WHERE lower(email) = lower(?) LIMIT 1`, [email]);
  const row = rowsToObjects(existing)[0];
  if (row && Number(row.used ?? 0) !== 1) return String(row.token);
  const token = tokenFactory();
  await db.execute(
    `INSERT INTO email_unsubscribe_tokens (id, email, token, used, created_at) VALUES (?, lower(?), ?, 0, ?)`,
    [crypto.randomUUID(), email, token, (/* @__PURE__ */ new Date()).toISOString()]
  );
  return token;
}
async function markUnsubscribeTokenUsed(token) {
  const row = await getUnsubscribeToken(token);
  if (!row || row.used) return null;
  await db.execute(`UPDATE email_unsubscribe_tokens SET used = 1 WHERE token = ? AND used = 0`, [token]);
  return { email: row.email };
}
async function insertEmailLog(input) {
  await db.execute(
    `INSERT INTO email_send_log (id, to_email, subject, template, status, error, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), input.to_email ?? null, input.subject ?? null, input.template ?? null, input.status, input.error ?? null, input.metadata ? JSON.stringify(input.metadata) : null, (/* @__PURE__ */ new Date()).toISOString()]
  );
}
const Route$s = createFileRoute()({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        if (!token) {
          return Response.json({ error: "Token is required" }, { status: 400 });
        }
        const tokenRecord = await getUnsubscribeToken(token);
        if (!tokenRecord) {
          return Response.json({ error: "Invalid or expired token" }, { status: 404 });
        }
        if (tokenRecord.used) {
          return Response.json({ valid: false, reason: "already_unsubscribed" });
        }
        return Response.json({ valid: true, email: tokenRecord.email });
      },
      POST: async ({ request }) => {
        const url = new URL(request.url);
        let token = url.searchParams.get("token");
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const formText = await request.text();
          const params = new URLSearchParams(formText);
          if (!params.get("List-Unsubscribe")) {
            const formToken = params.get("token");
            if (formToken) {
              token = formToken;
            }
          }
        } else {
          try {
            const body = await request.json();
            if (body.token) {
              token = body.token;
            }
          } catch {
          }
        }
        if (!token) {
          return Response.json({ error: "Token is required" }, { status: 400 });
        }
        const tokenRecord = await getUnsubscribeToken(token);
        if (!tokenRecord) {
          return Response.json({ error: "Invalid or expired token" }, { status: 404 });
        }
        if (tokenRecord.used) {
          return Response.json({ success: false, reason: "already_unsubscribed" });
        }
        const updated = await markUnsubscribeTokenUsed(token);
        if (!updated) {
          return Response.json({ success: false, reason: "already_unsubscribed" });
        }
        await suppressEmail(updated.email, "unsubscribe", "unsubscribe");
        return Response.json({ success: true });
      }
    }
  }
});
const projectQuery = (id) => queryOptions({
  queryKey: ["project", id],
  queryFn: async () => {
    const data = await getProject({
      data: {
        id
      }
    });
    if (!data) throw notFound();
    return data;
  }
});
const $$splitComponentImporter$j = () => import("./project._id-CosGpjmk.mjs");
const Route$r = createFileRoute()({
  validateSearch: (search) => ({
    vip_token: typeof search.vip_token === "string" ? search.vip_token : void 0
  }),
  loader: ({
    context,
    params
  }) => context.queryClient.ensureQueryData(projectQuery(params.id)),
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./vip.index-CnlUK5iu.mjs");
const Route$q = createFileRoute()({
  head: () => ({
    meta: [{
      title: "العملاء المميزون — باقات الاشتراك"
    }, {
      name: "description",
      content: "اختر باقة الاشتراك المناسبة وحول المبلغ بنكي، ثم ارفع إيصال الدفع."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const Route$p = createFileRoute()({
  beforeLoad: () => {
    throw redirect({ to: "/admin/projects" });
  }
});
const $$splitComponentImporter$h = () => import("./admin.ads-DD8EnjSm.mjs");
const Route$o = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./admin.bot-settings-lGEztzts.mjs");
const Route$n = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./admin.bot-test-BlRI_5yP.mjs");
const Route$m = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./admin.bot-training-8LCA14Sc.mjs");
const Route$l = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./admin.chat-DcVUoNgY.mjs");
const Route$k = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./admin.employees-CTE-cMVN.mjs");
const Route$j = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./admin.exclusivity-CpgHnH_f.mjs");
const Route$i = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./admin.groq-settings-BkmPI05z.mjs");
const Route$h = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./admin.messages-BxsLAN3r.mjs");
const Route$g = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./admin.my-projects-BLuQrTo2.mjs");
const Route$f = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./admin.offers-BYCSyR6A.mjs");
const Route$e = createFileRoute()({
  head: () => ({
    meta: [{
      title: "عروض الأسعار | لوحة العمران"
    }, {
      name: "description",
      content: "إدارة عروض الأسعار المقدمة من الشركات على مشاريع العمران."
    }, {
      property: "og:title",
      content: "عروض الأسعار | لوحة العمران"
    }, {
      property: "og:description",
      content: "إدارة عروض الأسعار المقدمة من الشركات على مشاريع العمران."
    }, {
      property: "og:type",
      content: "website"
    }, {
      name: "twitter:card",
      content: "summary"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./admin.pending-projects-CT3DLD0k.mjs");
const Route$d = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./admin.projects-uFsBk4P0.mjs");
const Route$c = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./admin.requests-Dcxbsrtp.mjs");
const Route$b = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./admin.settings-Da8K9Xfp.mjs");
const Route$a = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./admin.support-B_v5NRt1.mjs");
const Route$9 = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./admin.users-CQORcohv.mjs");
const Route$8 = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./admin.vip-BQKqiLPx.mjs");
const Route$7 = createFileRoute()({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const CORS_HEADERS$1 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
const QUOTA_MB = 10240;
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS$1 }
  });
}
const Route$6 = createFileRoute()({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS$1 }),
      GET: async () => {
        const claims = await getSessionClaims();
        if (!claims) return json({ error: "Unauthorized" }, 401);
        if (!claims.roles?.includes("admin")) return json({ error: "Forbidden" }, 403);
        const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY || process.env.VITE_R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY || process.env.R2_SECRET || process.env.VITE_R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_KEY;
        if (!accessKeyId || !secretAccessKey) {
          return json({ connected: false, usedMB: 0, quotaMB: QUOTA_MB, fileCount: 0 });
        }
        const bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET || "turso";
        const endpoint = process.env.R2_ENDPOINT || process.env.VITE_R2_ENDPOINT || process.env.R2_S3_ENDPOINT || process.env.VITE_R2_S3_ENDPOINT || (process.env.R2_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID || process.env.CF_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID || process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com` : null);
        if (!endpoint) {
          return json({ connected: false, usedMB: 0, quotaMB: QUOTA_MB, fileCount: 0 });
        }
        const client = new S3Client({
          region: "auto",
          endpoint: endpoint.replace(/\/+$/, ""),
          credentials: { accessKeyId, secretAccessKey },
          forcePathStyle: true
        });
        let totalBytes = 0;
        let fileCount = 0;
        let continuationToken;
        try {
          do {
            const res = await client.send(
              new ListObjectsV2Command({
                Bucket: bucket,
                MaxKeys: 1e3,
                ContinuationToken: continuationToken
              })
            );
            for (const obj of res.Contents ?? []) {
              totalBytes += obj.Size ?? 0;
              fileCount += 1;
            }
            continuationToken = res.IsTruncated ? res.NextContinuationToken : void 0;
          } while (continuationToken);
        } catch {
          return json({ connected: false, usedMB: 0, quotaMB: QUOTA_MB, fileCount: 0 });
        }
        const usedMB = totalBytes / (1024 * 1024);
        return json({
          connected: true,
          usedMB: Math.round(usedMB * 100) / 100,
          quotaMB: QUOTA_MB,
          fileCount
        });
      }
    }
  }
});
const Route$5 = createFileRoute()({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env.CRON_SECRET ?? "";
        if (expected) {
          const auth = request.headers.get("authorization") ?? "";
          if (auth !== `Bearer ${expected}`) {
            return new Response(JSON.stringify({ error: "unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
        try {
          const result = await runVipExpiryCheckRaw();
          return new Response(JSON.stringify({ ok: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "cron failed";
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  }
});
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};
const ALLOWED_MIME = /* @__PURE__ */ new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf"
]);
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
const Route$4 = createFileRoute()({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const file = form.get("file");
          const purpose = String(form.get("purpose") ?? "other");
          if (!(file instanceof File)) return jsonResponse({ error: "file is required" }, 400);
          const mime = file.type || "application/octet-stream";
          const isImage = mime.startsWith("image/");
          const isPdf = mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
          if (!ALLOWED_MIME.has(mime) && !isImage && !isPdf) {
            return jsonResponse({ error: "نوع الملف غير مدعوم" }, 415);
          }
          const maxBytes = isPdf ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
          if (file.size > maxBytes) return jsonResponse({ error: "حجم الملف كبير جداً" }, 413);
          const prefix = purpose === "bid-pdf" ? "bids" : purpose === "vip-receipt" ? "vip-receipts" : purpose === "project-image" ? "project-image" : "uploads";
          const key = makeKey(prefix, file.name || "file");
          const bytes = new Uint8Array(await file.arrayBuffer());
          await uploadToR2({ key, body: bytes, contentType: mime });
          const publicBase = process.env.R2_PUBLIC_URL || "";
          const publicUrl = publicBase ? `${publicBase.replace(/\/+$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}` : "";
          const signedUrl = await signGetUrl(key, 60 * 60 * 24);
          return jsonResponse({
            ok: true,
            key,
            bucket: getBucket(),
            url: publicUrl || signedUrl,
            publicUrl,
            signedUrl,
            mime,
            size: file.size,
            filename: file.name
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "upload failed";
          return jsonResponse({ error: msg }, 500);
        }
      }
    }
  }
});
function parseSuppressionPayload(body) {
  const parsed = JSON.parse(body);
  if (!parsed.data) {
    throw new Error("Missing data field in payload");
  }
  const data = parsed.data;
  if (!data.email || !data.reason) {
    throw new Error("Missing required fields: email, reason");
  }
  return data;
}
function mapReasonToStatus(reason) {
  switch (reason) {
    case "bounce":
      return "bounced";
    case "complaint":
      return "complained";
    default:
      return "suppressed";
  }
}
function mapReasonToMessage(reason) {
  switch (reason) {
    case "bounce":
      return "Permanent bounce — email address is invalid or rejected";
    case "complaint":
      return "Spam complaint — recipient marked email as spam";
    case "unsubscribe":
      return "Recipient unsubscribed";
    default:
      return "Email suppressed";
  }
}
const Route$3 = createFileRoute()({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          console.error("Missing required environment variables");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        let payload;
        try {
          const verified = await verifyWebhookRequest({
            req: request,
            secret: apiKey,
            parser: parseSuppressionPayload
          });
          payload = verified.payload;
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case "invalid_signature":
                console.error("Invalid webhook signature");
                return Response.json({ error: "Invalid signature" }, { status: 401 });
              case "stale_timestamp":
                console.error("Stale webhook timestamp");
                return Response.json({ error: "Stale timestamp" }, { status: 401 });
              case "invalid_payload":
              case "invalid_json":
                console.error("Invalid payload", { code: error.code });
                return Response.json({ error: "Invalid payload" }, { status: 400 });
              default:
                console.error("Webhook verification failed", {
                  code: error.code,
                  message: error.message
                });
                return Response.json({ error: "Verification failed" }, { status: 401 });
            }
          }
          console.error("Unexpected error during verification", { error });
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
        const normalizedEmail = payload.email.toLowerCase();
        await suppressEmail(normalizedEmail, payload.reason, "lovable-email");
        const sendLogStatus = mapReasonToStatus(payload.reason);
        const sendLogMessage = mapReasonToMessage(payload.reason);
        await insertEmailLog({ to_email: normalizedEmail, template: "system", status: sendLogStatus, error: sendLogMessage, metadata: payload.metadata ?? null });
        console.log("Suppression processed", {
          email_redacted: normalizedEmail[0] + "***@" + normalizedEmail.split("@")[1],
          reason: payload.reason,
          is_retry: payload.is_retry,
          retry_count: payload.retry_count,
          has_message_id: !!payload.message_id
        });
        return Response.json({ success: true });
      }
    }
  }
});
const Route$2 = createFileRoute()({
  server: {
    handlers: {
      POST: async () => Response.json({ processed: 0, skipped: true, reason: "direct-send-enabled" })
    }
  }
});
function RequestAcceptedEmail({ requestId = "", companyName = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Html, { lang: "ar", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Head, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Preview, { children: "طلبك مقبول" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Body, { style: { fontFamily: "Cairo, Arial, sans-serif", background: "#f6f7f9", padding: "24px" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { style: { background: "#fff", borderRadius: 8, padding: 24, maxWidth: 560 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Heading, { style: { fontSize: 20, margin: 0, color: "#111" }, children: "طلبك مقبول" }),
      companyName ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: { color: "#444", marginTop: 12 }, children: [
        "مرحباً ",
        companyName,
        "،"
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { style: { color: "#222", fontSize: 16 }, children: [
        "طلبك رقم ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: requestId }),
        " تم قبوله."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { style: { color: "#666", fontSize: 13, marginTop: 24 }, children: "سيتم التواصل معكم قريباً لاستكمال الإجراءات." })
    ] }) })
  ] });
}
const template = {
  component: RequestAcceptedEmail,
  subject: "طلبك مقبول",
  displayName: "Request Accepted",
  previewData: { requestId: "00000000-0000-0000-0000-000000000000", companyName: "شركة تجريبية" }
};
const TEMPLATES = {
  "request-accepted": template
};
const Route$1 = createFileRoute()({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace(/^Bearer\s+/i, "");
        if (token !== apiKey) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const templateNames = Object.keys(TEMPLATES);
        const results = [];
        for (const name of templateNames) {
          const entry = TEMPLATES[name];
          const displayName = entry.displayName || name;
          if (!entry.previewData) {
            results.push({
              templateName: name,
              displayName,
              subject: "",
              html: "",
              status: "preview_data_required"
            });
            continue;
          }
          try {
            const html = await render(
              reactExports.createElement(entry.component, entry.previewData)
            );
            const resolvedSubject = typeof entry.subject === "function" ? entry.subject(entry.previewData) : entry.subject;
            results.push({
              templateName: name,
              displayName,
              subject: resolvedSubject,
              html,
              status: "ready"
            });
          } catch (err) {
            console.error("Failed to render template for preview", {
              template: name,
              error: err
            });
            results.push({
              templateName: name,
              displayName,
              subject: "",
              html: "",
              status: "render_failed",
              errorMessage: err instanceof Error ? err.message : String(err)
            });
          }
        }
        return Response.json({ templates: results });
      }
    }
  }
});
const SITE_NAME = "project-hub-rtl";
const SENDER_DOMAIN = "ali-alhaddad.com";
const FROM_DOMAIN = "ali-alhaddad.com";
function redactEmail(email) {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}
function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const Route = createFileRoute()({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          console.error("Missing required environment variables");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        let templateName;
        let recipientEmail;
        let idempotencyKey;
        let messageId;
        let templateData = {};
        try {
          const body = await request.json();
          templateName = body.templateName || body.template_name;
          recipientEmail = body.recipientEmail || body.recipient_email;
          messageId = crypto.randomUUID();
          idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId;
          if (body.templateData && typeof body.templateData === "object") {
            templateData = body.templateData;
          }
        } catch {
          return Response.json(
            { error: "Invalid JSON in request body" },
            { status: 400 }
          );
        }
        if (!templateName) {
          return Response.json(
            { error: "templateName is required" },
            { status: 400 }
          );
        }
        const template2 = TEMPLATES[templateName];
        if (!template2) {
          console.error("Template not found in registry", { templateName });
          return Response.json(
            {
              error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`
            },
            { status: 404 }
          );
        }
        const effectiveRecipient = template2.to || recipientEmail;
        if (!effectiveRecipient) {
          return Response.json(
            {
              error: "recipientEmail is required (unless the template defines a fixed recipient)"
            },
            { status: 400 }
          );
        }
        if (await isEmailSuppressed(effectiveRecipient.toLowerCase())) {
          await insertEmailLog({ to_email: effectiveRecipient, template: templateName, status: "suppressed" });
          console.log("Email suppressed", {
            templateName,
            recipient_redacted: redactEmail(effectiveRecipient)
          });
          return Response.json({ success: false, reason: "email_suppressed" });
        }
        const normalizedEmail = effectiveRecipient.toLowerCase();
        const unsubscribeToken = await getOrCreateUnsubscribeToken(normalizedEmail, generateToken);
        const element = reactExports.createElement(template2.component, templateData);
        const html = await render(element);
        const plainText = await render(element, { plainText: true });
        const resolvedSubject = typeof template2.subject === "function" ? template2.subject(templateData) : template2.subject;
        await sendLovableEmail({
          to: effectiveRecipient,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject: resolvedSubject,
          html,
          text: plainText,
          purpose: "transactional",
          label: templateName,
          idempotency_key: idempotencyKey,
          unsubscribe_token: unsubscribeToken,
          message_id: messageId
        }, { apiKey, sendUrl: process.env.LOVABLE_SEND_URL });
        await insertEmailLog({ to_email: effectiveRecipient, subject: resolvedSubject, template: templateName, status: "sent" });
        console.log("Transactional email enqueued", {
          templateName,
          recipient_redacted: redactEmail(effectiveRecipient)
        });
        return Response.json({ success: true, queued: false });
      }
    }
  }
});
const IndexRoute = Route$M.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$N
});
const AuthenticatedRouteRoute = Route$L.update({
  id: "/_authenticated",
  getParentRoute: () => Route$N
});
const AdsRoute = Route$K.update({
  id: "/ads",
  path: "/ads",
  getParentRoute: () => Route$N
});
const AuthRoute = Route$J.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$N
});
const ContactRoute = Route$I.update({
  id: "/contact",
  path: "/contact",
  getParentRoute: () => Route$N
});
const ForgotPasswordRoute = Route$H.update({
  id: "/forgot-password",
  path: "/forgot-password",
  getParentRoute: () => Route$N
});
const MaintenanceRoute = Route$G.update({
  id: "/maintenance",
  path: "/maintenance",
  getParentRoute: () => Route$N
});
const MyRequestsRoute = Route$F.update({
  id: "/my-requests",
  path: "/my-requests",
  getParentRoute: () => Route$N
});
const ProjectsRoute = Route$E.update({
  id: "/projects",
  path: "/projects",
  getParentRoute: () => Route$N
});
const ResetPasswordRoute = Route$D.update({
  id: "/reset-password",
  path: "/reset-password",
  getParentRoute: () => Route$N
});
const SubscribeSuccessRoute = Route$C.update({
  id: "/subscribe-success",
  path: "/subscribe-success",
  getParentRoute: () => Route$N
});
const ThankYouRoute = Route$B.update({
  id: "/thank-you",
  path: "/thank-you",
  getParentRoute: () => Route$N
});
const UnsubscribeRoute = Route$A.update({
  id: "/unsubscribe",
  path: "/unsubscribe",
  getParentRoute: () => Route$N
});
const VipRoute = Route$z.update({
  id: "/vip",
  path: "/vip",
  getParentRoute: () => Route$N
});
const AuthenticatedAdminRoute = Route$y.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedChatRoute = Route$x.update({
  id: "/chat",
  path: "/chat",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedDashboardRoute = Route$w.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedEmployeesRoute = Route$v.update({
  id: "/employees",
  path: "/employees",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedUploadRoute = Route$u.update({
  id: "/upload",
  path: "/upload",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AdsAdIdRoute = Route$t.update({
  id: "/$adId",
  path: "/$adId",
  getParentRoute: () => AdsRoute
});
const EmailUnsubscribeRoute = Route$s.update({
  id: "/email/unsubscribe",
  path: "/email/unsubscribe",
  getParentRoute: () => Route$N
});
const ProjectIdRoute = Route$r.update({
  id: "/project/$id",
  path: "/project/$id",
  getParentRoute: () => Route$N
});
const VipIndexRoute = Route$q.update({
  id: "/",
  path: "/",
  getParentRoute: () => VipRoute
});
const AuthenticatedAdminIndexRoute = Route$p.update({
  id: "/",
  path: "/",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminAdsRoute = Route$o.update({
  id: "/ads",
  path: "/ads",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminBotSettingsRoute = Route$n.update({
  id: "/bot-settings",
  path: "/bot-settings",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminBotTestRoute = Route$m.update({
  id: "/bot-test",
  path: "/bot-test",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminBotTrainingRoute = Route$l.update({
  id: "/bot-training",
  path: "/bot-training",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminChatRoute = Route$k.update({
  id: "/chat",
  path: "/chat",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminEmployeesRoute = Route$j.update({
  id: "/employees",
  path: "/employees",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminExclusivityRoute = Route$i.update({
  id: "/exclusivity",
  path: "/exclusivity",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminGroqSettingsRoute = Route$h.update({
  id: "/groq-settings",
  path: "/groq-settings",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminMessagesRoute = Route$g.update({
  id: "/messages",
  path: "/messages",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminMyProjectsRoute = Route$f.update({
  id: "/my-projects",
  path: "/my-projects",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminOffersRoute = Route$e.update({
  id: "/offers",
  path: "/offers",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminPendingProjectsRoute = Route$d.update({
  id: "/pending-projects",
  path: "/pending-projects",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminProjectsRoute = Route$c.update({
  id: "/projects",
  path: "/projects",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminRequestsRoute = Route$b.update({
  id: "/requests",
  path: "/requests",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminSettingsRoute = Route$a.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminSupportRoute = Route$9.update({
  id: "/support",
  path: "/support",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminUsersRoute = Route$8.update({
  id: "/users",
  path: "/users",
  getParentRoute: () => AuthenticatedAdminRoute
});
const AuthenticatedAdminVipRoute = Route$7.update({
  id: "/vip",
  path: "/vip",
  getParentRoute: () => AuthenticatedAdminRoute
});
const ApiAdminR2Route = Route$6.update({
  id: "/api/admin/r2",
  path: "/api/admin/r2",
  getParentRoute: () => Route$N
});
const ApiCronVipExpiryRoute = Route$5.update({
  id: "/api/cron/vip-expiry",
  path: "/api/cron/vip-expiry",
  getParentRoute: () => Route$N
});
const ApiPublicUploadRoute = Route$4.update({
  id: "/api/public/upload",
  path: "/api/public/upload",
  getParentRoute: () => Route$N
});
const LovableEmailSuppressionRoute = Route$3.update({
  id: "/lovable/email/suppression",
  path: "/lovable/email/suppression",
  getParentRoute: () => Route$N
});
const LovableEmailQueueProcessRoute = Route$2.update({
  id: "/lovable/email/queue/process",
  path: "/lovable/email/queue/process",
  getParentRoute: () => Route$N
});
const LovableEmailTransactionalPreviewRoute = Route$1.update({
  id: "/lovable/email/transactional/preview",
  path: "/lovable/email/transactional/preview",
  getParentRoute: () => Route$N
});
const LovableEmailTransactionalSendRoute = Route.update({
  id: "/lovable/email/transactional/send",
  path: "/lovable/email/transactional/send",
  getParentRoute: () => Route$N
});
const AuthenticatedAdminRouteChildren = {
  AuthenticatedAdminAdsRoute,
  AuthenticatedAdminBotSettingsRoute,
  AuthenticatedAdminBotTestRoute,
  AuthenticatedAdminBotTrainingRoute,
  AuthenticatedAdminChatRoute,
  AuthenticatedAdminEmployeesRoute,
  AuthenticatedAdminExclusivityRoute,
  AuthenticatedAdminGroqSettingsRoute,
  AuthenticatedAdminMessagesRoute,
  AuthenticatedAdminMyProjectsRoute,
  AuthenticatedAdminOffersRoute,
  AuthenticatedAdminPendingProjectsRoute,
  AuthenticatedAdminProjectsRoute,
  AuthenticatedAdminRequestsRoute,
  AuthenticatedAdminSettingsRoute,
  AuthenticatedAdminSupportRoute,
  AuthenticatedAdminUsersRoute,
  AuthenticatedAdminVipRoute,
  AuthenticatedAdminIndexRoute
};
const AuthenticatedAdminRouteWithChildren = AuthenticatedAdminRoute._addFileChildren(AuthenticatedAdminRouteChildren);
const AuthenticatedRouteRouteChildren = {
  AuthenticatedAdminRoute: AuthenticatedAdminRouteWithChildren,
  AuthenticatedChatRoute,
  AuthenticatedDashboardRoute,
  AuthenticatedEmployeesRoute,
  AuthenticatedUploadRoute
};
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren);
const AdsRouteChildren = {
  AdsAdIdRoute
};
const AdsRouteWithChildren = AdsRoute._addFileChildren(AdsRouteChildren);
const VipRouteChildren = {
  VipIndexRoute
};
const VipRouteWithChildren = VipRoute._addFileChildren(VipRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AdsRoute: AdsRouteWithChildren,
  AuthRoute,
  ContactRoute,
  ForgotPasswordRoute,
  MaintenanceRoute,
  MyRequestsRoute,
  ProjectsRoute,
  ResetPasswordRoute,
  SubscribeSuccessRoute,
  ThankYouRoute,
  UnsubscribeRoute,
  VipRoute: VipRouteWithChildren,
  EmailUnsubscribeRoute,
  ProjectIdRoute,
  ApiAdminR2Route,
  ApiCronVipExpiryRoute,
  ApiPublicUploadRoute,
  LovableEmailSuppressionRoute,
  LovableEmailQueueProcessRoute,
  LovableEmailTransactionalPreviewRoute,
  LovableEmailTransactionalSendRoute
};
const routeTree = Route$N._addFileChildren(rootRouteChildren)._addFileTypes();
function DefaultErrorComponent({ error, reset }) {
  console.error(error);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", dir: "rtl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "تعذر تحميل الصفحة" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "حدث خطأ مؤقت. جرّب تحديث الصفحة أو العودة للرئيسية." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: reset,
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "حاول مرة أخرى"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "الرئيسية"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  toggleExclusivityOn as $,
  projectQuery as A,
  getExclusiveStatus as B,
  getMyVipStatus as C,
  submitBidRequest as D,
  updateProjectStatus as E,
  submitVipSubscription as F,
  getVipMaintenance as G,
  listPendingAds as H,
  approveAd as I,
  rejectAd as J,
  getBotSettings as K,
  updateBotSettings as L,
  startVisitorChat as M,
  visitorSendMessage as N,
  visitorGetMessages as O,
  listBotQuestions as P,
  adminListBotQa as Q,
  Route$D as R,
  adminUpsertBotQa as S,
  adminDeleteBotQa as T,
  getMyUserId as U,
  listEmployees as V,
  createEmployee as W,
  deleteEmployee as X,
  listRoles as Y,
  searchProjectByName as Z,
  updateExclusivityHours as _,
  signUp as a,
  toggleExclusivityOff as a0,
  getGroqSettings as a1,
  updateGroqSettings as a2,
  adminListMessages as a3,
  adminDeleteContactMessage as a4,
  adminReplyContactMessage as a5,
  adminSendCustomEmail as a6,
  deleteMyAd as a7,
  adminListOffers as a8,
  adminUpdateOfferStatus as a9,
  createTrialVipSubscription as aA,
  createPackageTrialSubscription as aB,
  router as aC,
  adminGetOfferPdfUrl as aa,
  listAllProjectVipStatus as ab,
  getPlatformRequests as ac,
  updateRequestStatus as ad,
  getBidPdfUrl as ae,
  adminListProjectOfferToggles as af,
  adminSetProjectOffersEnabled as ag,
  adminSetAllProjectOffersEnabled as ah,
  adminSetProjectBotOffersEnabled as ai,
  adminSetAllProjectBotOffersEnabled as aj,
  sendRequestMessage as ak,
  setMaintenance as al,
  getHideSupportChat as am,
  setHideSupportChat as an,
  setVipMaintenance as ao,
  adminListChats as ap,
  adminListChatMessages as aq,
  adminReplyChat as ar,
  adminCloseChat as as,
  adminDeleteAllSupport as at,
  listVipSubscribers as au,
  approveVipByProject as av,
  cancelVipByProject as aw,
  approveVipSubscriber as ax,
  rejectVipSubscriber as ay,
  testVipExpiry as az,
  getMaintenance as b,
  searchRequests as c,
  listProjects as d,
  upsertProject as e,
  deleteProject as f,
  getMe as g,
  hasAdminRole as h,
  resetPasswordWithToken as i,
  changePassword as j,
  getMyRoles as k,
  listApprovedAds as l,
  countPendingAds as m,
  adminCountOpenSupportChats as n,
  signOut as o,
  projectsQuery as p,
  countContactMessages as q,
  requestPasswordReset as r,
  signIn as s,
  sendTestEmail as t,
  useServerFn as u,
  getRoleLabel as v,
  Route$t as w,
  listAdComments as x,
  submitAdComment as y,
  Route$r as z
};
