import process from "node:process";
import { AsyncLocalStorage } from "node:async_hooks";
import { H as H3Event, t as toResponse } from "../_libs/h3-v2.mjs";
import { w as defineHandlerCallback, x as resolveManifestAssetLink, s as resolveManifestCssLink, k as rootRouteId, y as getNormalizedURL, z as getOrigin, A as waitForRequest, C as bindSsrResponseToRequest, D as normalizeSsrResponse, E as attachRouterServerSsrUtils, F as _getRenderedMatches, G as createSerializationAdapter, H as createRawStreamRPCPlugin, i as invariant, g as isNotFound, I as isRedirect, J as isResolvedRedirect, K as replaceSsrResponse, L as mergeHeaders, M as isSsrResponse, N as disposeSsrResponseDetached, O as executeRewriteInput, P as stripSsrResponseBody, Q as defaultSerovalPlugins, S as makeSerovalPlugin, p as getScriptPreloadAttrs, T as getStylesheetHref, U as parseRedirect } from "../_libs/tanstack__router-core.mjs";
import { t as toCrossJSONStream, f as fromJSON, d as toCrossJSONAsync } from "../_libs/seroval.mjs";
import { c as createMemoryHistory } from "../_libs/tanstack__history.mjs";
import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { r as renderRouterToStream, R as RouterProvider } from "../_libs/tanstack__react-router.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";





import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";

import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
function StartServer(props) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RouterProvider, { router: props.router });
}
var defaultStreamHandler = defineHandlerCallback(({ request, router, responseHeaders }) => renderRouterToStream({
  request,
  router,
  responseHeaders,
  children: /* @__PURE__ */ jsxRuntimeExports.jsx(StartServer, { router })
}));
var GLOBAL_EVENT_STORAGE_KEY = /* @__PURE__ */ Symbol.for("tanstack-start:event-storage");
var globalObj$1 = globalThis;
if (!globalObj$1[GLOBAL_EVENT_STORAGE_KEY]) globalObj$1[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
var eventStorage = globalObj$1[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
  return typeof value.then === "function";
}
function getSetCookieValues(headers) {
  const headersWithSetCookie = headers;
  if (typeof headersWithSetCookie.getSetCookie === "function") return headersWithSetCookie.getSetCookie();
  const value = headers.get("set-cookie");
  return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
  if (response.ok) return;
  const eventSetCookies = getSetCookieValues(event.res.headers);
  if (eventSetCookies.length === 0) return;
  const responseSetCookies = getSetCookieValues(response.headers);
  response.headers.delete("set-cookie");
  for (const cookie of responseSetCookies) response.headers.append("set-cookie", cookie);
  for (const cookie of eventSetCookies) response.headers.append("set-cookie", cookie);
}
function attachResponseHeaders(value, event) {
  if (isPromiseLike(value)) return value.then((resolved) => {
    if (resolved instanceof Response) mergeEventResponseHeaders(resolved, event);
    return resolved;
  });
  if (value instanceof Response) mergeEventResponseHeaders(value, event);
  return value;
}
function requestHandler(handler) {
  return (request, requestOpts) => {
    let h3Event;
    try {
      h3Event = new H3Event(request);
    } catch (error) {
      if (error instanceof URIError) return new Response(null, {
        status: 400,
        statusText: "Bad Request"
      });
      throw error;
    }
    return toResponse(attachResponseHeaders(eventStorage.run({ h3Event }, () => handler(request, requestOpts)), h3Event), h3Event);
  };
}
function getH3Event() {
  const event = eventStorage.getStore();
  if (!event) throw new Error(`No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
  return event.h3Event;
}
function getRequest() {
  return getH3Event().req;
}
function setResponseHeader(name, value) {
  const event = getH3Event();
  if (Array.isArray(value)) {
    event.res.headers.delete(name);
    for (const valueItem of value) event.res.headers.append(name, valueItem);
  } else event.res.headers.set(name, value);
}
function getResponse() {
  return getH3Event().res;
}
var HEADERS = { TSS_SHELL: "X-TSS_SHELL" };
async function getStartManifest(matchedRoutes) {
  const { tsrStartManifest } = await import("../_tanstack-start-manifest_v-D5Czi_vu.mjs");
  const startManifest = tsrStartManifest();
  let routes = startManifest.routes;
  routes[rootRouteId];
  const manifestRoutes = {};
  for (const k in routes) {
    const v = routes[k];
    const result = {};
    if (v.preloads && v.preloads.length > 0) result.preloads = v.preloads;
    if (v.scripts && v.scripts.length > 0) result.scripts = v.scripts;
    if (v.css?.length) result.css = v.css;
    if (result.preloads || result.scripts || result.css) manifestRoutes[k] = result;
  }
  return {
    ...startManifest.scriptFormat ? { scriptFormat: startManifest.scriptFormat } : {},
    ...startManifest.inlineCss ? { inlineCss: startManifest.inlineCss } : {},
    routes: manifestRoutes
  };
}
const manifest = {
  "008260bf3785ecc73620b20adfb599ce556159535a1c054533b212ab63a5b0fa": {
    functionName: "adminUpdateOfferStatus_createServerFn_handler",
    importer: () => import("./offers.functions-0K2M4hu_.mjs")
  },
  "02f48f0c640ff1b2fcf707b7db584473b8cd4a9e445a3f6c8dc0d2aa7b195b8c": {
    functionName: "adminSendCustomEmail_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "054b265a94cc68fad8096cb913bc75d1468d45ef608c672eb224b988bcb6020c": {
    functionName: "adminDeleteOffer_createServerFn_handler",
    importer: () => import("./offers.functions-0K2M4hu_.mjs")
  },
  "058fb37501b7ad4f017138ee348dafec62f582e641973f94bdaee5e792354d74": {
    functionName: "adminSetAllProjectOffersEnabled_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "05d540c91ea9147d57c434f81d698c2e3ff5d23ba136ebab060a4513339a2b8c": {
    functionName: "getMe_createServerFn_handler",
    importer: () => import("./auth.functions-V-uIB41o.mjs")
  },
  "05df53a3a9cdbd8017df512a038428c80f447054678e91faa6a87562fc4c5cab": {
    functionName: "attachVipReceipt_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "0df183e363dc40446c9c4b902973b68f87defba6eec25be42d5d57651ff2ddba": {
    functionName: "deleteMyProject_createServerFn_handler",
    importer: () => import("./my-projects.functions-DTKfRkrb.mjs")
  },
  "0e113e277043fca586d7600364ab04300dab4100b6547e1d76f77517b24c6256": {
    functionName: "getBotSettings_createServerFn_handler",
    importer: () => import("./bot-settings.functions-BiNW8W2_.mjs")
  },
  "108da303932a7a7d02c5b9ed633a3d44fdfcbb2191a7f3c4a577cefacb50c97a": {
    functionName: "listProjects_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "152810f0035020059e45b5a70cb4c8db932fc33791b9447eb8aa92ef6ebb816f": {
    functionName: "rejectVipSubscriber_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "15946b07b54e0909aa27fa0f35669f0600b7c3f449e509501f5aec30c0ba00fd": {
    functionName: "signIn_createServerFn_handler",
    importer: () => import("./auth.functions-V-uIB41o.mjs")
  },
  "160ebc02d3b498615964cc4f281517cce0c7e2c3044a62cac752d76cd3d34fa1": {
    functionName: "setHideSupportChat_createServerFn_handler",
    importer: () => import("./site-settings.functions-TRy7gp8L.mjs")
  },
  "165f6b5098b795c7472c0550a57f60e43dd18da3ce1c2f9509a61dff5b5b1836": {
    functionName: "deleteAd_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "16df0d113af31fa0a7330a7b7426337f0dfbfbd1facc9a4426d0eb75efe4cc8b": {
    functionName: "submitVipSubscription_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "177b456e028ec263041006282f11f32836be03f38b846b7d927caf195c7a5f8d": {
    functionName: "cancelVipByProject_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "185a1991094210b2d32efab49f8d7acd5513ff227faca5d4da0087bb88635515": {
    functionName: "adminCountNewOffers_createServerFn_handler",
    importer: () => import("./offers.functions-0K2M4hu_.mjs")
  },
  "1979a1e4f5d59cbaace842255e4b855ae012ccda75fe38f4250f5d0f795f9a80": {
    functionName: "searchProjectByName_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "1b6c0c9c1c9f08324d604e475dc4c3c8a4b09a16f89c8dc654c7f5866c6474af": {
    functionName: "visitorGetMessages_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "1ce867041959958fcb72da9a77d8774d8c5933420d2de303a25279903543e4fc": {
    functionName: "submitAdComment_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "1e581f7b957892bf14d2c14805cfbcd65fe1ebbb19cc8e82b1ca5f34370b0e5f": {
    functionName: "sendTeamMessage_createServerFn_handler",
    importer: () => import("./chat.functions-BKKBQj9a.mjs")
  },
  "270c1762d98a54703b818e3db3c9d3ff72890dcaf8162eb203025f6a4651b70a": {
    functionName: "adminListChatMessages_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "29185ffc54de4a4d32349e930389d6f85ee789e2c01a8d6a3f84c022fa6f57e1": {
    functionName: "adminReplyChat_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "29350f80d29a69d2e2195c7c03f4454ef10774b58808aa0149e6464d567e61d1": {
    functionName: "adminListBotQa_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "29d8cf46b86526f4ed2e12e14db38fce20f673c434cc32bba64fd9df14d0d158": {
    functionName: "updateExclusivityHours_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "2b7d944e60b08bcdc1fa7a16dba44b1924f252c838ee796c60dd9c638a18e6d5": {
    functionName: "adminListOffers_createServerFn_handler",
    importer: () => import("./offers.functions-0K2M4hu_.mjs")
  },
  "2c215c91a90faef79da9d18b0eb92d1ef9fbb18f84106d533d5af37449a05903": {
    functionName: "listApprovedAds_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "2db74c92baeb5d843e274872db3d4ed5b5eb082b316f00ac263401003b5f2678": {
    functionName: "adminSetAllProjectBotOffersEnabled_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "34e0e060549e3a4623590222947527fe754689016441c6d314a18fdeac1a7e25": {
    functionName: "getDatabaseSize_createServerFn_handler",
    importer: () => import("./db-stats.functions-a92IzhT0.mjs")
  },
  "385e76cdf807dd53711b6f969d894db85cf9b0ca7a6373bb34c6352adedccb64": {
    functionName: "markNotificationRead_createServerFn_handler",
    importer: () => import("./notifications.functions-BHPwuC6M.mjs")
  },
  "387e6b502d42689d22fd064d3335afa86e3c44f2fe491ded2d3150cb36a91126": {
    functionName: "upsertProject_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "3add45dd2017b4ee770445d6ef39bfbb1c8e55446695d0a84cf782b68e7e3c4b": {
    functionName: "getAddProjectRequests_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "3c44a42ed774bf578a6b2548e0865d038dcc3dcb253782b3109b445d11569b3e": {
    functionName: "adminGetOfferPdfUrl_createServerFn_handler",
    importer: () => import("./offers.functions-0K2M4hu_.mjs")
  },
  "3f82ba1060afbc012e7aa4eb899978a01af558ced2c471d584282a43987d701c": {
    functionName: "countPendingAds_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "44b86b436fe8582afd56c6b0eda471eb699a048021a38998ebcdfc0c9d9704f8": {
    functionName: "submitOffer_createServerFn_handler",
    importer: () => import("./offers.functions-0K2M4hu_.mjs")
  },
  "4566ade9bb98508870423efaadce8b560262f2655fdd5b8ba7e23267e21d5668": {
    functionName: "listPendingProjects_createServerFn_handler",
    importer: () => import("./project-approval.functions-Ds4YgoNJ.mjs")
  },
  "473edaaa49ffe54bc8f383fbdac7511392187f10acbab0c8c7449c1b7764ac54": {
    functionName: "listBotQuestions_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "4972077c58c3cae31fbfd59642caffaaff860ed682186b858700635f81bc3edd": {
    functionName: "adminSetProjectOffersEnabled_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "49867c4d400851977f9eda18b4c471e7906e96a9b56d2e425a6644d4a76e7cf2": {
    functionName: "getExclusiveStatus_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "49c390e7bc2471cb180475c3dfd0a2969eafc9d669d1f703838230d7f6d6e6d9": {
    functionName: "submitBidRequest_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "4e31fed744f1502c4fd3a455de3b458646141693e4fb894e3244a524fa9e09f0": {
    functionName: "testVipExpiry_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "4f8dc13b790c5f24f39e1a5cc0b8247f23005360e7a43f8aeddfe521ba17d07d": {
    functionName: "updateBotSettings_createServerFn_handler",
    importer: () => import("./bot-settings.functions-BiNW8W2_.mjs")
  },
  "54c65bf3dd015c1926564ab68fd48f22d297a13c1f853f3f20f031b78727cb37": {
    functionName: "updateProjectStatus_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "54e04a37a12218f385257a062bb266c9d185aa68b353d1b195d77988c7461243": {
    functionName: "adminListBlocked_createServerFn_handler",
    importer: () => import("./blocked.functions-BbsKsZuc.mjs")
  },
  "585f22b59b464df4b4843c564292572d6b66e16706f12ec871db320c1e45208f": {
    functionName: "createPackageTrialSubscription_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "5a07fa4a184d1a1748e919d1b3006b4633da0f254a8f503227346b1ef65ba315": {
    functionName: "listTeamMessages_createServerFn_handler",
    importer: () => import("./chat.functions-BKKBQj9a.mjs")
  },
  "5a2d12acd651ca5b6782bc2b0bf306c82dcbdc1bea4ab7e8e78ce4337b26435a": {
    functionName: "deleteTeamMessage_createServerFn_handler",
    importer: () => import("./chat.functions-BKKBQj9a.mjs")
  },
  "5b95ad651485d828d299837e8ae3aebcf2601ddb83a81bafd444e7c657d79eb8": {
    functionName: "listAdComments_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "5dd5cca12724248959e8a8504ab6d9a9d61c11c357ec9dedaf9b423a674b79a2": {
    functionName: "adminCountOpenSupportChats_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "5dffbc3f06512d6fb9ac263e257db41cb7931a7afa75aaedf5eb2ca77adb4729": {
    functionName: "createTrialVipSubscription_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "5e6ffd149a609aad6ed438bc6e7f2ad0c1aebc73f564aff8f9181ab657792bd8": {
    functionName: "deleteAllTeamMessages_createServerFn_handler",
    importer: () => import("./chat.functions-BKKBQj9a.mjs")
  },
  "60f5263309fdc132607d93bca522cc36ccdd154de4adb18313665bdbaf8b9cb4": {
    functionName: "adminSetProjectBotOffersEnabled_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "611c241d7fb4bb14926a88872df26c49a49ceddd2c20ae072560cbb5b4f7f30b": {
    functionName: "adminReplyContactMessage_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "6319f7726de73fa9273d35ad6b8c33dd3575d1f8a6bc610d6688e7580f07d2f1": {
    functionName: "listAllProjectVipStatus_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "66bf2c9f42071c86851f464f05150cc8b7062a838c064377680faa7baaf41f1e": {
    functionName: "toggleExclusivityOn_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "69d407fbdbcf3b34e77d9a628c0a3b99e32de0b96ed945a3cd4aa6eef2f6af40": {
    functionName: "cronVipExpiry_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "6b0873ce468403135fb5a48c9caa07c351725e7f9df20c439b51cdcea4750bbc": {
    functionName: "registerPublicUploadedFile_createServerFn_handler",
    importer: () => import("./files.functions-i35MBOo5.mjs")
  },
  "6ea05b622530e225578c99ae382ff2bc70d12ece0966bed2cf5f1544500a7e0f": {
    functionName: "countUnreadTeamMessages_createServerFn_handler",
    importer: () => import("./chat.functions-BKKBQj9a.mjs")
  },
  "6f67ec444785cb548e0eef51091b2b8814bd502dfc31d19f4b38b984fca8599c": {
    functionName: "approveVipSubscriber_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "733fbcb8fb28a6c5b7cf31b3247744ba1b32162789273385c0ee4a6f1e7c8013": {
    functionName: "getProject_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "778e376f08f5a466c5d0d2f160deb9c34f2cd4c35b8fc4a5e49228dc28cf6175": {
    functionName: "adminExtendVip_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "77ff4eb7c6301529d5cd1b294e0d6988476df6bb1844f5c358260435deb1bfb1": {
    functionName: "getExclusivityConfig_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "7ad1a8c9b4759d7b2a2362dbde9568531fd386e179b272a7e4daca399eafbc69": {
    functionName: "deleteSubmission_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "7f22a1795cf16f98b92e03c263c95f6dd64ca6dc1132ebeefbcc5b9f73d9b82b": {
    functionName: "adminDeleteContactMessage_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "86797decd1cf50ed025b4a3c4c789fa623ea93fd3d645a56f1779a1cc6d3c125": {
    functionName: "adminDeleteBotQa_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "873fe191eaddd17502d9e0ee23b50e63603c08b6463e76d6d368c74a4299f923": {
    functionName: "deleteProject_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "8816c8285bd6ce60443893f0f50a1aa744622b22fe2763515a8c9d4144b3ea33": {
    functionName: "updateGroqSettings_createServerFn_handler",
    importer: () => import("./bot-settings.functions-BiNW8W2_.mjs")
  },
  "898f3de7600e9b256fad8120a215a38853a66a40aaa08f931800d551e65cbfc8": {
    functionName: "uploadPublicFile_createServerFn_handler",
    importer: () => import("./files.functions-i35MBOo5.mjs")
  },
  "8af3a0596161f6271665a3fe29acde3400e514840352ee5348d84d4a02310fad": {
    functionName: "adminUpsertBotQa_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "8c565f38645e9e9c5973bb0f53137c61eab38648c1e478f7dc867988f9e5df35": {
    functionName: "listEmployees_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "8d3baad434375fac495bca852705012d384f30fc6b3bb22190dd852beb6f28d8": {
    functionName: "visitorSendMessage_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "8e18ebb7412094656070fe87bb4f75b5585d040dde6dc8879e5a04cdef734f7b": {
    functionName: "submitVisitorAd_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "8e8c85a8060f36e05865e9044f5c5cc1619143659e6d9409c338fffb7140812c": {
    functionName: "listMyProjects_createServerFn_handler",
    importer: () => import("./my-projects.functions-DTKfRkrb.mjs")
  },
  "8eecf51b875ae01da1d331e75ca34137b033f64c39771bb7e3231bdcdefb506a": {
    functionName: "setMaintenance_createServerFn_handler",
    importer: () => import("./maintenance.functions-C9aa3myR.mjs")
  },
  "8f652ff9fa3632dea93a9983aed261705bcabde86949f17d879eb4b6425a6e4d": {
    functionName: "getPlatformRequests_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "927f121ad4d8b1ea2976cd54068aad516e7090bd248f8cbd323c7f1c78357719": {
    functionName: "adminBlockCompany_createServerFn_handler",
    importer: () => import("./blocked.functions-BbsKsZuc.mjs")
  },
  "944bdf9b14036b6396cdff2ceede4468310a8caa97d79271cc547dd1bbd80d54": {
    functionName: "deleteMyAd_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "9450c15293c0a6ae5fe14448bd9f3e0ad58f596f22af371b91f88b98002e414b": {
    functionName: "markAllNotificationsRead_createServerFn_handler",
    importer: () => import("./notifications.functions-BHPwuC6M.mjs")
  },
  "95f2cf03275bf7421044cb43581f390444f8462eb7ceef40d1fbcdaa0f979964": {
    functionName: "signOut_createServerFn_handler",
    importer: () => import("./auth.functions-V-uIB41o.mjs")
  },
  "9986d6d39f0d4a4887403518971268a89e4410e9680fadf3d295b0965190da7e": {
    functionName: "getMaintenance_createServerFn_handler",
    importer: () => import("./maintenance.functions-C9aa3myR.mjs")
  },
  "99a6241c2e872ac588fb9e911f1c19e326e4ed158596fc59ad6d76613657d027": {
    functionName: "changePassword_createServerFn_handler",
    importer: () => import("./auth.functions-V-uIB41o.mjs")
  },
  "9df46a5875b60883376ae5ded6ff62d2c029a5e63ceaee7a57d3d4387c07232a": {
    functionName: "listPendingAds_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "a063de24e27e7066703bf4640340a5f98e56ac9e25a5324ae1896bd72f3339e9": {
    functionName: "createAd_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "a846ccbb8e0324334f18c2344337c3d6370fd1557fd569e0d0f39a9e17f34183": {
    functionName: "verifyReceipt_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "a93dcca664db7845b2d7a9b6c8f0b0f7cb52a62972f962422ce68f8dd2e3fd1e": {
    functionName: "adminListMessages_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "aad3e9706e54bcd02055ffffe6f7665f755a69cd12594265650302f41ade5078": {
    functionName: "setVipMaintenance_createServerFn_handler",
    importer: () => import("./site-settings.functions-TRy7gp8L.mjs")
  },
  "ab973bdd239dcdf060993b79d04685ed1e203bad5ea576703bca855610fbe619": {
    functionName: "submitProjectSuggestion_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "ac7aa1f9a63f321f68315638952e4c97cff2e5c25128228644651aabeddd037c": {
    functionName: "adminUnblockCompany_createServerFn_handler",
    importer: () => import("./blocked.functions-BbsKsZuc.mjs")
  },
  "acdc1590236f0839542f983a97a7193af437f8125c921a77e6feea3b73ccec73": {
    functionName: "listMyNotifications_createServerFn_handler",
    importer: () => import("./notifications.functions-BHPwuC6M.mjs")
  },
  "aceaa671ae0c02774591c3ab3a250fc497ecd82113315e64a670b81ffea6766e": {
    functionName: "adminListProjectOfferToggles_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "aff117b1e0b4be6dbba2be2060e23662a6cdac14409b025a8c42404d5161cd84": {
    functionName: "sendRequestMessage_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "b192b513e35f0d2b51783cbde58b942245d43109a88d04aa3bdb2052a8c43af4": {
    functionName: "adminStartVip_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "b5e36592858524cbe2f05bb9ab7731685df655bfb0b3baa905db2bee07360060": {
    functionName: "getHideSupportChat_createServerFn_handler",
    importer: () => import("./site-settings.functions-TRy7gp8L.mjs")
  },
  "b7ad89e53514fe40ef0575f2b782f1c24db826433880314689ac022007321e61": {
    functionName: "uploadFile_createServerFn_handler",
    importer: () => import("./files.functions-i35MBOo5.mjs")
  },
  "b86f98e7f0fcb133545a93fadb38ee922e3837fea4287a16fa6b77327ac96ffd": {
    functionName: "searchRequests_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "ba5e5d3e45d027763b3e6f83463fd24c55b59547ee2957357a0b658ee58c9729": {
    functionName: "approveAd_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "ba8201b60d030f84ad17817069c7fd101140ec025edaa95101eb79c705206605": {
    functionName: "updateAd_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "bbd9915d8b85c65a3b3f8e8ee5957a3dfe60390cf4d3eb0e1e0afb89dda15aea": {
    functionName: "signUp_createServerFn_handler",
    importer: () => import("./auth.functions-V-uIB41o.mjs")
  },
  "bc043367e3258bc0750efadc2962d5983ded7a90f892e25e8da034f07aee469d": {
    functionName: "getMyRoles_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "c1b423a7dbe5ef78b5653345dc2eee2dfa32cc1c6bfedd947532453fe5d87606": {
    functionName: "rejectProject_createServerFn_handler",
    importer: () => import("./project-approval.functions-Ds4YgoNJ.mjs")
  },
  "c8a82179ef36b1b5cbb6f0269981709217c19604b4627b7c6d34db26c0a63f2d": {
    functionName: "getGroqSettings_createServerFn_handler",
    importer: () => import("./bot-settings.functions-BiNW8W2_.mjs")
  },
  "cb8cf01b590bf98771097cf69a35af15af6ad3c0b339c353031913abb86d88c0": {
    functionName: "countContactMessages_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "cbbecc3eeba7f0f9946f0d511c1b0036cea0dbc5cf53b42135834da4bae44479": {
    functionName: "submitContactMessage_createServerFn_handler",
    importer: () => import("./public.functions-DBXVWy37.mjs")
  },
  "cc7b4410257e035601dc7f884ef7ba3df2cbacbc439903a1805806314de9bcc5": {
    functionName: "adminDeleteAllSupport_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "ce5211c91c96ea83d2bf1a2de856e6d5af5baf6508fb8401d3bc8e4a1a278a99": {
    functionName: "approveProject_createServerFn_handler",
    importer: () => import("./project-approval.functions-Ds4YgoNJ.mjs")
  },
  "cf361682af2d298d02de7c0ec6763b8ac233c3c2cada447d7edee0ac2ab23e41": {
    functionName: "sendTestEmail_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "d2395d71d5cf32fad3b7d198197abb2c2cf523dd2de7ce34028e5102040cfee9": {
    functionName: "startVisitorChat_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "d2db6b6f294d9a394e3406772dd37197a4cd4e971477c25f77a6607fe3f33d1d": {
    functionName: "toggleExclusivityOff_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "d47a983b48d5777a0269b3547219e13b80d7ce898c4db912618c93d350f34325": {
    functionName: "deleteFile_createServerFn_handler",
    importer: () => import("./files.functions-i35MBOo5.mjs")
  },
  "d4a5463d770cb7a3de60f99dac907f972b4526f5fcfe984ef7f58be9a90b39a4": {
    functionName: "getMyVipStatus_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "d4c835351eb03e09ca123caa1c91f29dde6054eb1fec80c344ad1b27997c3fd0": {
    functionName: "visitorEscalate_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "d4cc3b2e092015738ff48f621162da3e6d01d1d9c5a377a0ce06fdf793953857": {
    functionName: "getR2StorageStats_createServerFn_handler",
    importer: () => import("./db-stats.functions-a92IzhT0.mjs")
  },
  "d68947038400881570fabe714c6e93a8c429bf423406e0dab3b538b816a4b1bf": {
    functionName: "countMyUnreadNotifications_createServerFn_handler",
    importer: () => import("./notifications.functions-BHPwuC6M.mjs")
  },
  "d737e3c35142fbf7cef6d3e25b70815a83a31ae693e8752175bca7ea3eaa9752": {
    functionName: "adminCloseChat_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "d9b106c849be0fd2f7ab18c8e15ec604b7dc5de4962751279938eef968292b51": {
    functionName: "signupFirstAdmin_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "d9f867b576065bd30138998985d6a0306998465cdb7b77e80817a06cfae1c4a6": {
    functionName: "getBidPdfUrl_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "dd143bd7f19d33191eacfa211873d914aaadb0c9a4128aa79b89b3c3b41b4f77": {
    functionName: "listVipByProject_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "e17dc487a0036ee336605030048045203e2a326c9b140489d9df450b34555ca9": {
    functionName: "deleteEmployee_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "e337182b5923487d34c98e8e407f69fa815e9efcdf2c402e545c2cff02bf1358": {
    functionName: "listVipSubscribers_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "e37ef2463aa86b5e52ad7d1d5e3203b5ffbbc00e102276fa280036aae832a9ac": {
    functionName: "getVipMaintenance_createServerFn_handler",
    importer: () => import("./site-settings.functions-TRy7gp8L.mjs")
  },
  "e4885eaeb8ac9297e550ed13942ebcf044f892f4b68e4716a5c74f13b57b131e": {
    functionName: "approveSubmission_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "e530ff6faca702227cb960216134cfc2c9112cec642e05e30b7387124440b1ac": {
    functionName: "createEmployee_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "e5c0d6ea7dc3bc9867e1856a96d83ab10b1626673d3cabae446f712b148916ab": {
    functionName: "updateRequestStatus_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "e5da0a8610e2604ca8e6194cfced547a3621601f20e383f10fa825e92e526a6f": {
    functionName: "adminStopVip_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "e618c2143fa787d56d489687e0cce239f4041c5160149c846c9759048f21a75d": {
    functionName: "adminListChats_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "e65f1c7b2b5c36bbc7a7b847ae74a85fff6117377deccf4cd42c9a446ca3737a": {
    functionName: "getApprovedAd_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "e713b8df1ef850d860e649e0be3826f2ae16f9211b6d494a158d6e6f22a645a1": {
    functionName: "getMyUserId_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "e92855947cae016a13e8d6fa4b210ab347a059e2ad930c57303e3cd0fdac2134": {
    functionName: "requestPasswordReset_createServerFn_handler",
    importer: () => import("./auth.functions-V-uIB41o.mjs")
  },
  "eb481968f5b65fae23a4b92192abbd939d41ee354876a29434172e6f22a9e5a8": {
    functionName: "updateExclusivity_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "eb4e3c706f872f0da3aaed5a5f23123c66e0b18caf30063f912ba5bcf5982885": {
    functionName: "resetPasswordWithToken_createServerFn_handler",
    importer: () => import("./auth.functions-V-uIB41o.mjs")
  },
  "ec33fce6512ac111f8be4cb4b7013872e5de7e589be41b2cae5a1d61eb469d8f": {
    functionName: "submitProjectWithPaths_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "ecdc73f97ae33d5257d739dbb17f737a77ab3872680ff91462798930243850fd": {
    functionName: "submitAddProjectOffer_createServerFn_handler",
    importer: () => import("./offers.functions-0K2M4hu_.mjs")
  },
  "ed6396123983567371e5efb71c9f60edd285e6d62bfab3a8c0a639e124ddbb8a": {
    functionName: "visitorEndSession_createServerFn_handler",
    importer: () => import("./support.functions-BERZHIbx.mjs")
  },
  "eda19de27b2c907e246e2bdb835df6d9a12148d41da92c8ef3c5bdfc5b014cd1": {
    functionName: "adminListRequests_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "f302bfa9cba9e5efd3e6105eeb58b2edb4d316641b462d70f7f797dc99f49e61": {
    functionName: "registerUploadedFile_createServerFn_handler",
    importer: () => import("./files.functions-i35MBOo5.mjs")
  },
  "f4493e302c8cb79e5184cf95711c932355480a4bedfd8639d6c72c5d22f28a66": {
    functionName: "getFileUrl_createServerFn_handler",
    importer: () => import("./files.functions-i35MBOo5.mjs")
  },
  "f49e090916aa28e89ee0ee0eaa1c2632215cadab9f9b670fe8121a6271c37f47": {
    functionName: "rejectAd_createServerFn_handler",
    importer: () => import("./ads.functions-BGgO3OuB.mjs")
  },
  "f7cb4f36ca6b1736293532e9375e5e0f66e9982dea905b88e87abdea4fe1dba0": {
    functionName: "adminListSubmissions_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "f891f100da2378879fcd70938136c67e280423cae8700d3589510fa328eec3b2": {
    functionName: "approveVipByProject_createServerFn_handler",
    importer: () => import("./vip.functions-Bwu6MwZv.mjs")
  },
  "fabf83d09b4f50e361d550bb061e43007736f2c7f192b3b91fc90bcd215b8247": {
    functionName: "countPendingProjects_createServerFn_handler",
    importer: () => import("./project-approval.functions-Ds4YgoNJ.mjs")
  },
  "fd5bc09fc8660adfdcd4616b6410796c52b1503d5e4ba402984129c34172ea41": {
    functionName: "submitAddProjectBidRequest_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  },
  "fdc69a2b243b4323d4797604135af2fbf7cfea053d2450646bdfcda3fc281304": {
    functionName: "listRoles_createServerFn_handler",
    importer: () => import("./admin.functions-Cq6Mc2nO.mjs")
  }
};
async function getServerFnById(id, access) {
  const serverFnInfo = manifest[id];
  if (!serverFnInfo) {
    throw new Error("Server function info not found for " + id);
  }
  const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
  if (!fnModule) {
    throw new Error("Server function module not resolved for " + id);
  }
  const action = fnModule[serverFnInfo.functionName];
  if (!action) {
    throw new Error("Server function module export not resolved for serverFn ID: " + id);
  }
  return action;
}
var TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT";
var TSS_SERVER_FUNCTION = /* @__PURE__ */ Symbol.for("TSS_SERVER_FUNCTION");
var TSS_SERVER_FUNCTION_FACTORY = /* @__PURE__ */ Symbol.for("TSS_SERVER_FUNCTION_FACTORY");
var X_TSS_SERIALIZED = "x-tss-serialized";
var X_TSS_RAW_RESPONSE = "x-tss-raw";
var TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed";
var FrameType = {
  /** Seroval JSON chunk (NDJSON line) */
  JSON: 0,
  /** Raw stream data chunk */
  CHUNK: 1,
  /** Raw stream end (EOF) */
  END: 2,
  /** Raw stream error */
  ERROR: 3
};
var FRAME_HEADER_SIZE = 9;
var TSS_CONTENT_TYPE_FRAMED_VERSIONED = `${TSS_CONTENT_TYPE_FRAMED}; v=1`;
function isSafeKey(key) {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
function safeObjectMerge(target, source) {
  const result = /* @__PURE__ */ Object.create(null);
  if (target) {
    for (const key of Object.keys(target)) if (isSafeKey(key)) result[key] = target[key];
  }
  if (source && typeof source === "object") {
    for (const key of Object.keys(source)) if (isSafeKey(key)) result[key] = source[key];
  }
  return result;
}
function createNullProtoObject(source) {
  if (!source) return /* @__PURE__ */ Object.create(null);
  const obj = /* @__PURE__ */ Object.create(null);
  for (const key of Object.keys(source)) if (isSafeKey(key)) obj[key] = source[key];
  return obj;
}
var GLOBAL_STORAGE_KEY = /* @__PURE__ */ Symbol.for("tanstack-start:start-storage-context");
var globalObj = globalThis;
if (!globalObj[GLOBAL_STORAGE_KEY]) globalObj[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
var startStorage = globalObj[GLOBAL_STORAGE_KEY];
async function runWithStartContext(context, fn) {
  return startStorage.run(context, fn);
}
function getStartContext(opts) {
  const context = startStorage.getStore();
  if (!context && opts?.throwIfNotFound !== false) throw new Error(`No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
  return context;
}
var getStartOptions = () => getStartContext().startOptions;
var getStartContextServerOnly = getStartContext;
var createServerFn = (options, __opts) => {
  const resolvedOptions = __opts || options || {};
  if (typeof resolvedOptions.method === "undefined") resolvedOptions.method = "GET";
  const setValidator = (validator) => {
    return createServerFn(void 0, {
      ...resolvedOptions,
      validator,
      inputValidator: validator
    });
  };
  const res = {
    options: resolvedOptions,
    middleware: (middleware) => {
      const newMiddleware = [...resolvedOptions.middleware || []];
      middleware.map((m) => {
        if (TSS_SERVER_FUNCTION_FACTORY in m) {
          if (m.options.middleware) newMiddleware.push(...m.options.middleware);
        } else newMiddleware.push(m);
      });
      const res2 = createServerFn(void 0, {
        ...resolvedOptions,
        middleware: newMiddleware
      });
      res2[TSS_SERVER_FUNCTION_FACTORY] = true;
      return res2;
    },
    validator: setValidator,
    inputValidator: setValidator,
    handler: (...args) => {
      const [extractedFn, serverFn] = args;
      const newOptions = {
        ...resolvedOptions,
        extractedFn,
        serverFn
      };
      const resolvedMiddleware = [...newOptions.middleware || [], serverFnBaseToMiddleware(newOptions)];
      extractedFn.method = resolvedOptions.method;
      return Object.assign(async (opts) => {
        const result = await executeMiddleware$1(resolvedMiddleware, "client", {
          ...extractedFn,
          ...newOptions,
          data: opts?.data,
          headers: opts?.headers,
          signal: opts?.signal,
          fetch: opts?.fetch,
          context: createNullProtoObject()
        });
        const redirect = parseRedirect(result.error);
        if (redirect) throw redirect;
        if (result.error) throw result.error;
        return result.result;
      }, {
        ...extractedFn,
        method: resolvedOptions.method,
        __executeServer: async (opts) => {
          const startContext = getStartContextServerOnly();
          const serverContextAfterGlobalMiddlewares = startContext.contextAfterGlobalMiddlewares;
          return await executeMiddleware$1(resolvedMiddleware, "server", {
            ...extractedFn,
            ...opts,
            serverFnMeta: extractedFn.serverFnMeta,
            context: safeObjectMerge(opts.context, serverContextAfterGlobalMiddlewares),
            request: startContext.request
          }).then((d) => ({
            result: d.result,
            error: d.error,
            context: d.sendContext
          }));
        }
      });
    }
  };
  const fun = (options2) => {
    return createServerFn(void 0, {
      ...resolvedOptions,
      ...options2
    });
  };
  return Object.assign(fun, res);
};
async function executeMiddleware$1(middlewares, env, opts) {
  let flattenedMiddlewares = flattenMiddlewares([...getStartOptions()?.functionMiddleware || [], ...middlewares]);
  if (env === "server") {
    const startContext = getStartContextServerOnly({ throwIfNotFound: false });
    if (startContext?.executedRequestMiddlewares) flattenedMiddlewares = flattenedMiddlewares.filter((m) => !startContext.executedRequestMiddlewares.has(m));
  }
  const callNextMiddleware = async (ctx) => {
    const nextMiddleware = flattenedMiddlewares.shift();
    if (!nextMiddleware) return ctx;
    try {
      let validator = "validator" in nextMiddleware.options ? nextMiddleware.options.validator : void 0;
      if (!validator && "inputValidator" in nextMiddleware.options) validator = nextMiddleware.options.inputValidator;
      if (validator && env === "server") ctx.data = await execValidator(validator, ctx.data);
      let middlewareFn = void 0;
      if (env === "client") {
        if ("client" in nextMiddleware.options) middlewareFn = nextMiddleware.options.client;
      } else if ("server" in nextMiddleware.options) middlewareFn = nextMiddleware.options.server;
      if (middlewareFn) {
        const userNext = async (userCtx = {}) => {
          const result2 = await callNextMiddleware({
            ...ctx,
            ...userCtx,
            context: safeObjectMerge(ctx.context, userCtx.context),
            sendContext: safeObjectMerge(ctx.sendContext, userCtx.sendContext),
            headers: mergeHeaders(ctx.headers, userCtx.headers),
            _callSiteFetch: ctx._callSiteFetch,
            fetch: ctx._callSiteFetch ?? userCtx.fetch ?? ctx.fetch,
            result: userCtx.result !== void 0 ? userCtx.result : userCtx instanceof Response ? userCtx : ctx.result,
            error: userCtx.error ?? ctx.error
          });
          if (result2.error) throw result2.error;
          return result2;
        };
        const result = await middlewareFn({
          ...ctx,
          next: userNext
        });
        if (isRedirect(result)) return {
          ...ctx,
          error: result
        };
        if (result instanceof Response) return {
          ...ctx,
          result
        };
        if (!result) throw new Error("User middleware returned undefined. You must call next() or return a result in your middlewares.");
        return result;
      }
      return callNextMiddleware(ctx);
    } catch (error) {
      return {
        ...ctx,
        error
      };
    }
  };
  return callNextMiddleware({
    ...opts,
    headers: opts.headers || {},
    sendContext: opts.sendContext || {},
    context: opts.context || createNullProtoObject(),
    _callSiteFetch: opts.fetch
  });
}
function flattenMiddlewares(middlewares, maxDepth = 100) {
  const seen = /* @__PURE__ */ new Set();
  const flattened = [];
  const recurse = (middleware, depth) => {
    if (depth > maxDepth) throw new Error(`Middleware nesting depth exceeded maximum of ${maxDepth}. Check for circular references.`);
    middleware.forEach((m) => {
      if (m.options.middleware) recurse(m.options.middleware, depth + 1);
      if (!seen.has(m)) {
        seen.add(m);
        flattened.push(m);
      }
    });
  };
  recurse(middlewares, 0);
  return flattened;
}
async function execValidator(validator, input) {
  if (validator == null) return {};
  if ("~standard" in validator) {
    const result = await validator["~standard"].validate(input);
    if (result.issues) throw new Error(JSON.stringify(result.issues, void 0, 2));
    return result.value;
  }
  if ("parse" in validator) return validator.parse(input);
  if (typeof validator === "function") return validator(input);
  throw new Error("Invalid validator type!");
}
function serverFnBaseToMiddleware(options) {
  return {
    "~types": void 0,
    options: {
      inputValidator: options.validator ?? options.inputValidator,
      client: async ({ next, sendContext, fetch: fetch2, ...ctx }) => {
        const payload = {
          ...ctx,
          context: sendContext,
          fetch: fetch2
        };
        return next(await options.extractedFn?.(payload));
      },
      server: async ({ next, ...ctx }) => {
        const result = await options.serverFn?.(ctx);
        return next({
          ...ctx,
          result
        });
      }
    }
  };
}
var createMiddleware = (options, __opts) => {
  const resolvedOptions = {
    type: "request",
    ...__opts || options
  };
  const setValidator = (validator) => {
    return createMiddleware({}, Object.assign(resolvedOptions, {
      validator,
      inputValidator: validator
    }));
  };
  return {
    options: resolvedOptions,
    middleware: (middleware) => {
      return createMiddleware({}, Object.assign(resolvedOptions, { middleware }));
    },
    validator: setValidator,
    inputValidator: setValidator,
    client: (client) => {
      return createMiddleware({}, Object.assign(resolvedOptions, { client }));
    },
    server: (server2) => {
      return createMiddleware({}, Object.assign(resolvedOptions, { server: server2 }));
    }
  };
};
var innerCreateCsrfMiddleware = (opts = {}) => {
  const middleware = createMiddleware().server(async (ctx) => {
    const csrfCtx = ctx;
    if (opts.filter && !await opts.filter(csrfCtx)) return ctx.next();
    if (await isCsrfRequestAllowed(opts, csrfCtx)) return ctx.next();
    return getFailureResponse(opts, csrfCtx);
  });
  return middleware;
};
var createCsrfMiddleware = innerCreateCsrfMiddleware;
async function isCsrfRequestAllowed(opts, ctx) {
  const result = await getCsrfRequestValidationResult(opts, ctx);
  return result === true || result === void 0 && opts.allowRequestsWithoutOriginCheck === true;
}
async function getCsrfRequestValidationResult(opts, ctx) {
  const fetchSite = ctx.request.headers.get("Sec-Fetch-Site");
  if (fetchSite !== null) return matchValue(opts.secFetchSite ?? "same-origin", fetchSite, ctx);
  const origin = ctx.request.headers.get("Origin");
  if (origin !== null) {
    if (opts.origin) return matchValue(opts.origin, origin, ctx);
    return origin === new URL(ctx.request.url).origin;
  }
  const referer = ctx.request.headers.get("Referer");
  if (referer === null || opts.referer === false) return;
  if (typeof opts.referer === "function") return opts.referer(referer, ctx);
  if (opts.origin) {
    const refererOrigin = getOriginFromUrl(referer);
    return refererOrigin !== void 0 && matchValue(opts.origin, refererOrigin, ctx);
  }
  return isRefererSameOrigin(referer, new URL(ctx.request.url).origin);
}
async function matchValue(matcher, value, ctx) {
  if (typeof matcher === "function") return matcher(value, ctx);
  if (Array.isArray(matcher)) return matcher.includes(value);
  return value === matcher;
}
function getOriginFromUrl(url) {
  try {
    return new URL(url).origin;
  } catch {
    return;
  }
}
function isRefererSameOrigin(referer, requestOrigin) {
  if (referer === requestOrigin) return true;
  if (!referer.startsWith(requestOrigin)) return false;
  if (referer.length === requestOrigin.length) return true;
  const code = referer.charCodeAt(requestOrigin.length);
  return code === 47 || code === 63 || code === 35;
}
async function getFailureResponse(opts, ctx) {
  if (typeof opts.failureResponse === "function") return opts.failureResponse(ctx);
  return opts.failureResponse?.clone() ?? new Response("Forbidden", {
    status: 403
  });
}
function getDefaultSerovalPlugins() {
  return [...getStartOptions()?.serializationAdapters?.map(makeSerovalPlugin) ?? [], ...defaultSerovalPlugins];
}
var textEncoder = new TextEncoder();
var EMPTY_PAYLOAD = new Uint8Array(0);
function encodeFrame(type, streamId, payload) {
  const frame = new Uint8Array(FRAME_HEADER_SIZE + payload.length);
  frame[0] = type;
  frame[1] = streamId >>> 24 & 255;
  frame[2] = streamId >>> 16 & 255;
  frame[3] = streamId >>> 8 & 255;
  frame[4] = streamId & 255;
  frame[5] = payload.length >>> 24 & 255;
  frame[6] = payload.length >>> 16 & 255;
  frame[7] = payload.length >>> 8 & 255;
  frame[8] = payload.length & 255;
  frame.set(payload, FRAME_HEADER_SIZE);
  return frame;
}
function encodeJSONFrame(json) {
  return encodeFrame(FrameType.JSON, 0, textEncoder.encode(json));
}
function encodeChunkFrame(streamId, chunk) {
  return encodeFrame(FrameType.CHUNK, streamId, chunk);
}
function encodeEndFrame(streamId) {
  return encodeFrame(FrameType.END, streamId, EMPTY_PAYLOAD);
}
function encodeErrorFrame(streamId, error) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  return encodeFrame(FrameType.ERROR, streamId, textEncoder.encode(message));
}
function createMultiplexedStream(jsonStream, rawStreams, lateStreamSource) {
  let controller;
  let cancelled = false;
  const readers = [];
  const enqueue = (frame) => {
    if (cancelled) return false;
    try {
      controller.enqueue(frame);
      return true;
    } catch {
      return false;
    }
  };
  const errorOutput = (error) => {
    if (cancelled) return;
    cancelled = true;
    try {
      controller.error(error);
    } catch {
    }
    for (const reader of readers) reader.cancel().catch(() => {
    });
  };
  async function pumpRawStream(streamId, stream) {
    const reader = stream.getReader();
    readers.push(reader);
    try {
      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) {
          enqueue(encodeEndFrame(streamId));
          return;
        }
        if (!enqueue(encodeChunkFrame(streamId, value))) return;
      }
    } catch (error) {
      enqueue(encodeErrorFrame(streamId, error));
    } finally {
      reader.releaseLock();
    }
  }
  async function pumpJSON() {
    const reader = jsonStream.getReader();
    readers.push(reader);
    try {
      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) return;
        if (!enqueue(encodeJSONFrame(value))) return;
      }
    } catch (error) {
      errorOutput(error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }
  async function pumpLateStreams() {
    if (!lateStreamSource) return [];
    const lateStreamPumps = [];
    const reader = lateStreamSource.getReader();
    readers.push(reader);
    try {
      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;
        lateStreamPumps.push(pumpRawStream(value.id, value.stream));
      }
    } finally {
      reader.releaseLock();
    }
    return lateStreamPumps;
  }
  return new ReadableStream({
    async start(ctrl) {
      controller = ctrl;
      const pumps = [pumpJSON()];
      for (const [streamId, stream] of rawStreams) pumps.push(pumpRawStream(streamId, stream));
      if (lateStreamSource) pumps.push(pumpLateStreams());
      try {
        const latePumps = (await Promise.all(pumps)).find(Array.isArray);
        if (latePumps && latePumps.length > 0) await Promise.all(latePumps);
        if (!cancelled) try {
          controller.close();
        } catch {
        }
      } catch {
      }
    },
    cancel() {
      cancelled = true;
      for (const reader of readers) reader.cancel().catch(() => {
      });
      readers.length = 0;
    }
  });
}
var serovalPlugins = void 0;
var FORM_DATA_CONTENT_TYPES = ["multipart/form-data", "application/x-www-form-urlencoded"];
var MAX_PAYLOAD_SIZE = 1e6;
var handleServerAction = async ({ request, context, serverFnId }) => {
  const methodUpper = request.method.toUpperCase();
  const url = new URL(request.url);
  const action = await getServerFnById(serverFnId);
  if (action.method && methodUpper !== action.method) return new Response(`expected ${action.method} method. Got ${methodUpper}`, {
    status: 405,
    headers: { Allow: action.method }
  });
  const isServerFn = request.headers.get("x-tsr-serverFn") === "true";
  if (!serovalPlugins) serovalPlugins = getDefaultSerovalPlugins();
  const contentType = request.headers.get("Content-Type");
  function parsePayload(payload) {
    return fromJSON(payload, { plugins: serovalPlugins });
  }
  return await (async () => {
    try {
      let serializeResult = function(res2) {
        let nonStreamingBody = void 0;
        const alsResponse = getResponse();
        if (res2 !== void 0) {
          const rawStreams = /* @__PURE__ */ new Map();
          let initialPhase = true;
          let lateStreamWriter;
          let lateStreamReadable = void 0;
          const pendingLateStreams = [];
          const plugins = [createRawStreamRPCPlugin((id, stream) => {
            if (initialPhase) {
              rawStreams.set(id, stream);
              return;
            }
            if (lateStreamWriter) {
              lateStreamWriter.write({
                id,
                stream
              }).catch(() => {
              });
              return;
            }
            pendingLateStreams.push({
              id,
              stream
            });
          }), ...serovalPlugins || []];
          let done = false;
          const callbacks = {
            onParse: (value) => {
              nonStreamingBody = value;
            },
            onDone: () => {
              done = true;
            },
            onError: (error) => {
              throw error;
            }
          };
          toCrossJSONStream(res2, {
            refs: /* @__PURE__ */ new Map(),
            plugins,
            onParse(value) {
              callbacks.onParse(value);
            },
            onDone() {
              callbacks.onDone();
            },
            onError: (error) => {
              callbacks.onError(error);
            }
          });
          initialPhase = false;
          if (done && rawStreams.size === 0) return new Response(nonStreamingBody ? JSON.stringify(nonStreamingBody) : void 0, {
            status: alsResponse.status,
            statusText: alsResponse.statusText,
            headers: {
              "Content-Type": "application/json",
              [X_TSS_SERIALIZED]: "true"
            }
          });
          const { readable, writable } = new TransformStream();
          lateStreamReadable = readable;
          lateStreamWriter = writable.getWriter();
          for (const registration of pendingLateStreams) lateStreamWriter.write(registration).catch(() => {
          });
          pendingLateStreams.length = 0;
          const multiplexedStream = createMultiplexedStream(new ReadableStream({
            start(controller) {
              callbacks.onParse = (value) => {
                controller.enqueue(JSON.stringify(value) + "\n");
              };
              callbacks.onDone = () => {
                try {
                  controller.close();
                } catch {
                }
                lateStreamWriter?.close().catch(() => {
                }).finally(() => {
                  lateStreamWriter = void 0;
                });
              };
              callbacks.onError = (error) => {
                controller.error(error);
                lateStreamWriter?.abort(error).catch(() => {
                }).finally(() => {
                  lateStreamWriter = void 0;
                });
              };
              if (nonStreamingBody !== void 0) callbacks.onParse(nonStreamingBody);
              if (done) callbacks.onDone();
            },
            cancel() {
              lateStreamWriter?.abort().catch(() => {
              });
              lateStreamWriter = void 0;
            }
          }), rawStreams, lateStreamReadable);
          return new Response(multiplexedStream, {
            status: alsResponse.status,
            statusText: alsResponse.statusText,
            headers: {
              "Content-Type": TSS_CONTENT_TYPE_FRAMED_VERSIONED,
              [X_TSS_SERIALIZED]: "true"
            }
          });
        }
        return new Response(void 0, {
          status: alsResponse.status,
          statusText: alsResponse.statusText
        });
      };
      let res = await (async () => {
        if (FORM_DATA_CONTENT_TYPES.some((type) => contentType && contentType.includes(type))) {
          if (methodUpper === "GET") {
            if (false) ;
            invariant();
          }
          const formData = await request.formData();
          const serializedContext = formData.get(TSS_FORMDATA_CONTEXT);
          formData.delete(TSS_FORMDATA_CONTEXT);
          const params = {
            context,
            data: formData,
            method: methodUpper
          };
          if (typeof serializedContext === "string") try {
            const deserializedContext = fromJSON(JSON.parse(serializedContext), { plugins: serovalPlugins });
            if (typeof deserializedContext === "object" && deserializedContext) params.context = safeObjectMerge(deserializedContext, context);
          } catch (e) {
            if (false) ;
          }
          return await action(params);
        }
        if (methodUpper === "GET") {
          const payloadParam = url.searchParams.get("payload");
          if (payloadParam && payloadParam.length > MAX_PAYLOAD_SIZE) throw new Error("Payload too large");
          const payload2 = payloadParam ? parsePayload(JSON.parse(payloadParam)) : {};
          payload2.context = safeObjectMerge(payload2.context, context);
          payload2.method = methodUpper;
          return await action(payload2);
        }
        let jsonPayload;
        if (contentType?.includes("application/json")) jsonPayload = await request.json();
        const payload = jsonPayload ? parsePayload(jsonPayload) : {};
        payload.context = safeObjectMerge(payload.context, context);
        payload.method = methodUpper;
        return await action(payload);
      })();
      const unwrapped = res.result || res.error;
      if (isNotFound(res)) res = isNotFoundResponse(res);
      if (!isServerFn) return unwrapped;
      if (unwrapped instanceof Response) {
        if (isRedirect(unwrapped)) return unwrapped;
        unwrapped.headers.set(X_TSS_RAW_RESPONSE, "true");
        return unwrapped;
      }
      return serializeResult(res);
    } catch (error) {
      if (error instanceof Response) return error;
      if (isNotFound(error)) return isNotFoundResponse(error);
      console.info();
      console.info("Server Fn Error!");
      console.info();
      console.error(error);
      console.info();
      const serializedError = JSON.stringify(await Promise.resolve(toCrossJSONAsync(error, {
        refs: /* @__PURE__ */ new Map(),
        plugins: serovalPlugins
      })));
      const response = getResponse();
      return new Response(serializedError, {
        status: response.status ?? 500,
        statusText: response.statusText,
        headers: {
          "Content-Type": "application/json",
          [X_TSS_SERIALIZED]: "true"
        }
      });
    }
  })();
};
function isNotFoundResponse(error) {
  const { headers, ...rest } = error;
  return new Response(JSON.stringify(rest), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      ...headers || {}
    }
  });
}
var LINK_PARAM_TOKEN_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var PRELOAD_AS_VALUES = /* @__PURE__ */ new Set([
  "fetch",
  "font",
  "image",
  "script",
  "style",
  "track"
]);
function buildLinkParam(name, value) {
  if (value === void 0) return name;
  if (LINK_PARAM_TOKEN_RE.test(value)) return `${name}=${value}`;
  return `${name}=${JSON.stringify(value)}`;
}
function serializeEarlyHint(hint) {
  const parts = [`<${hint.href}>`, buildLinkParam("rel", hint.rel)];
  if (hint.as) parts.push(buildLinkParam("as", hint.as));
  if (hint.crossOrigin !== void 0) parts.push(buildLinkParam("crossorigin", hint.crossOrigin || void 0));
  if (hint.type) parts.push(buildLinkParam("type", hint.type));
  if (hint.integrity) parts.push(buildLinkParam("integrity", hint.integrity));
  if (hint.referrerPolicy) parts.push(buildLinkParam("referrerpolicy", hint.referrerPolicy));
  if (hint.fetchPriority) parts.push(buildLinkParam("fetchpriority", hint.fetchPriority));
  return parts.join("; ");
}
function getStringAttr(attrs, name, fallbackName) {
  const value = attrs?.[name] ?? (fallbackName ? attrs?.[fallbackName] : void 0);
  return typeof value === "string" ? value : void 0;
}
function getPreloadAs(attrs) {
  const as = getStringAttr(attrs, "as");
  return as && PRELOAD_AS_VALUES.has(as) ? as : void 0;
}
function addEarlyHintFetchAttrs(hint, attrs) {
  const crossOrigin = getStringAttr(attrs, "crossOrigin", "crossorigin");
  const type = getStringAttr(attrs, "type");
  const integrity = getStringAttr(attrs, "integrity");
  const referrerPolicy = getStringAttr(attrs, "referrerPolicy", "referrerpolicy");
  const fetchPriority = getStringAttr(attrs, "fetchPriority", "fetchpriority");
  if (crossOrigin !== void 0) hint.crossOrigin = crossOrigin;
  if (type) hint.type = type;
  if (integrity) hint.integrity = integrity;
  if (referrerPolicy) hint.referrerPolicy = referrerPolicy;
  if (fetchPriority) hint.fetchPriority = fetchPriority;
}
function linkAttrsToEarlyHint(attrs) {
  const href = getStringAttr(attrs, "href");
  const rel = getStringAttr(attrs, "rel");
  if (!href || !rel) return void 0;
  const relTokens = rel.split(/\s+/);
  let hintRel;
  let hintAs;
  if (relTokens.includes("modulepreload")) {
    hintRel = "modulepreload";
    hintAs = "script";
  } else if (relTokens.includes("stylesheet")) {
    hintRel = "preload";
    hintAs = "style";
  } else if (relTokens.includes("preload")) {
    hintAs = getPreloadAs(attrs);
    if (!hintAs) return void 0;
    hintRel = "preload";
  } else if (relTokens.includes("preconnect")) {
    hintRel = "preconnect";
    hintAs = void 0;
  } else if (relTokens.includes("dns-prefetch")) {
    hintRel = "dns-prefetch";
    hintAs = void 0;
  }
  if (!hintRel) return void 0;
  const hint = {
    href,
    rel: hintRel
  };
  if (hintAs) hint.as = hintAs;
  addEarlyHintFetchAttrs(hint, attrs);
  return hint;
}
function collectStaticHintsFromManifest(manifest2, matchedRoutes) {
  const hints = [];
  for (const route of matchedRoutes) {
    const routeManifest = manifest2.routes[route.id];
    if (!routeManifest) continue;
    for (const link of routeManifest.preloads ?? []) {
      const attrs = getScriptPreloadAttrs(manifest2, link);
      const hint = {
        href: attrs.href,
        rel: attrs.rel,
        as: "script"
      };
      if (attrs.crossOrigin !== void 0) hint.crossOrigin = attrs.crossOrigin;
      hints.push(hint);
    }
    for (const link of routeManifest.css ?? []) {
      const stylesheetHref = getStylesheetHref(link);
      if (manifest2.inlineCss?.styles[stylesheetHref] !== void 0) continue;
      const resolvedLink = resolveManifestCssLink(link);
      const hint = {
        href: stylesheetHref,
        rel: "preload",
        as: "style"
      };
      if (resolvedLink.crossOrigin !== void 0) hint.crossOrigin = resolvedLink.crossOrigin;
      hints.push(hint);
    }
  }
  return hints;
}
function collectDynamicHintsFromMatches(matches) {
  const hints = [];
  for (const match of matches) {
    const links = match.links;
    if (!Array.isArray(links)) continue;
    for (const link of links) {
      const hint = linkAttrsToEarlyHint(link);
      if (hint) hints.push(hint);
    }
  }
  return hints;
}
function createEarlyHintsEvent(opts) {
  const nextHints = [];
  const nextLinks = [];
  for (const hint of opts.hints) {
    const link = serializeEarlyHint(hint);
    if (opts.sentLinks.has(link)) continue;
    opts.sentLinks.add(link);
    opts.sentHints.push(hint);
    nextHints.push(hint);
    nextLinks.push(link);
  }
  if (!nextHints.length && opts.phase !== "dynamic") return void 0;
  return {
    phase: opts.phase,
    hints: nextHints,
    links: nextLinks,
    allHints: opts.sentHints.slice(),
    allLinks: Array.from(opts.sentLinks)
  };
}
function createResponseLinkHeaderEntries(opts) {
  for (const hint of opts.hints) {
    const link = serializeEarlyHint(hint);
    if (opts.sentLinks.has(link)) continue;
    opts.sentLinks.add(link);
    opts.entries.push({
      phase: opts.phase,
      hint,
      link
    });
  }
}
function getResponseLinkHeaderEntries(opts) {
  if (!opts.filter) return opts.entries.map((entry) => entry.link);
  try {
    const links = [];
    for (const entry of opts.entries) if (opts.filter(entry)) links.push(entry.link);
    return links;
  } catch (err) {
    console.error("Error filtering response Link headers:", err);
    return [];
  }
}
function notifyEarlyHints(phase, event, onEarlyHints) {
  try {
    const result = onEarlyHints(event);
    if (result) Promise.resolve(result).catch((err) => {
      console.error(`Error sending ${phase} early hints:`, err);
    });
  } catch (err) {
    console.error(`Error sending ${phase} early hints:`, err);
  }
}
function getResponseLinkHeaderFilter(responseLinkHeader) {
  if (typeof responseLinkHeader !== "object") return;
  return responseLinkHeader.filter;
}
function appendResponseLinkHeaders(opts) {
  for (const link of getResponseLinkHeaderEntries(opts)) opts.responseHeaders.append("Link", link);
}
function collectResponseLinkHeaderEntries(opts) {
  for (let index = 0; index < opts.event.hints.length; index++) opts.entries.push({
    phase: opts.phase,
    hint: opts.event.hints[index],
    link: opts.event.links[index]
  });
}
function collectEarlyHintsPhase(opts) {
  const event = opts.onEarlyHints ? createEarlyHintsEvent({
    phase: opts.phase,
    hints: opts.hints,
    sentLinks: opts.sentLinks,
    sentHints: opts.sentHints
  }) : void 0;
  if (event) notifyEarlyHints(opts.phase, event, opts.onEarlyHints);
  if (!opts.responseLinkHeaderEntries) return;
  if (event) {
    collectResponseLinkHeaderEntries({
      phase: opts.phase,
      event,
      entries: opts.responseLinkHeaderEntries
    });
    return;
  }
  createResponseLinkHeaderEntries({
    phase: opts.phase,
    hints: opts.hints,
    sentLinks: opts.sentLinks,
    entries: opts.responseLinkHeaderEntries
  });
}
function createEarlyHintsCollector(opts) {
  if (!opts?.onEarlyHints && !opts?.responseLinkHeader) return;
  const sentLinks = /* @__PURE__ */ new Set();
  const sentHints = opts.onEarlyHints ? new Array() : void 0;
  const responseLinkHeaderEntries = opts.responseLinkHeader ? new Array() : void 0;
  const responseLinkHeaderFilter = getResponseLinkHeaderFilter(opts.responseLinkHeader);
  return {
    collectStatic: ({ manifest: manifest2, matchedRoutes }) => {
      if (!matchedRoutes?.length) return;
      collectEarlyHintsPhase({
        phase: "static",
        hints: collectStaticHintsFromManifest(manifest2, matchedRoutes),
        sentLinks,
        sentHints,
        onEarlyHints: opts.onEarlyHints,
        responseLinkHeaderEntries
      });
    },
    collectDynamic: (matches) => {
      collectEarlyHintsPhase({
        phase: "dynamic",
        hints: collectDynamicHintsFromMatches(matches),
        sentLinks,
        sentHints,
        onEarlyHints: opts.onEarlyHints,
        responseLinkHeaderEntries
      });
    },
    appendResponseHeaders: (headers) => {
      if (!responseLinkHeaderEntries?.length) return;
      appendResponseLinkHeaders({
        responseHeaders: headers,
        entries: responseLinkHeaderEntries,
        filter: responseLinkHeaderFilter
      });
    }
  };
}
function normalizeTransformAssetResult(result) {
  if (typeof result === "string") return { href: result };
  return result;
}
function escapeCssString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\a ").replace(/\r/g, "\\d ").replace(/\f/g, "\\c ");
}
async function transformInlineCssTemplate(options) {
  const { strings, urls } = options.template;
  if (strings.length !== urls.length + 1) throw new Error(`TanStack Start inlineCss template for ${options.stylesheetHref} is invalid`);
  let css = strings[0];
  for (let index = 0; index < urls.length; index++) {
    const transformed = normalizeTransformAssetResult(await options.transformFn({
      kind: "css-url",
      url: urls[index],
      stylesheetHref: options.stylesheetHref
    }));
    css += escapeCssString(transformed.href) + strings[index + 1];
  }
  return css;
}
async function transformInlineCssStyles(inlineCss, transformFn) {
  const transformedStyles = {};
  const transformedEntries = await Promise.all(Object.entries(inlineCss.styles).map(async ([stylesheetHref, css]) => {
    const template = inlineCss.templates?.[stylesheetHref];
    return [stylesheetHref, template ? await transformInlineCssTemplate({
      stylesheetHref,
      template,
      transformFn
    }) : css];
  }));
  for (const [stylesheetHref, css] of transformedEntries) transformedStyles[stylesheetHref] = css;
  return {
    styles: transformedStyles,
    ...inlineCss.templates ? { templates: inlineCss.templates } : {}
  };
}
function resolveTransformAssetsCrossOrigin(config, kind) {
  if (!config) return void 0;
  if (typeof config === "string") return config;
  return config[kind];
}
function isObjectShorthand(transform) {
  return "prefix" in transform;
}
function resolveTransformAssetsConfig(transform) {
  if (typeof transform === "string") {
    const prefix = transform;
    return {
      type: "transform",
      transformFn: ({ url }) => ({ href: `${prefix}${url}` }),
      cache: true
    };
  }
  if (typeof transform === "function") return {
    type: "transform",
    transformFn: transform,
    cache: true
  };
  if (isObjectShorthand(transform)) {
    const { prefix, crossOrigin } = transform;
    return {
      type: "transform",
      transformFn: ({ url, kind }) => {
        const href = `${prefix}${url}`;
        if (kind === "css-url") return { href };
        const co = resolveTransformAssetsCrossOrigin(crossOrigin, kind);
        return co ? {
          href,
          crossOrigin: co
        } : { href };
      },
      cache: true
    };
  }
  if ("createTransform" in transform && transform.createTransform) return {
    type: "createTransform",
    createTransform: transform.createTransform,
    cache: transform.cache !== false
  };
  return {
    type: "transform",
    transformFn: typeof transform.transform === "string" ? (({ url }) => ({ href: `${transform.transform}${url}` })) : transform.transform,
    cache: transform.cache !== false
  };
}
function assignManifestLink(link, next) {
  if (typeof link === "string") return next.crossOrigin ? next : next.href;
  const nextLink = {
    ...link,
    href: next.href
  };
  if (next.crossOrigin) nextLink.crossOrigin = next.crossOrigin;
  else delete nextLink.crossOrigin;
  return nextLink;
}
async function transformManifestAssets(source, transformFn, _opts) {
  const manifest2 = structuredClone(source);
  const inlineCssEnabled = _opts?.inlineCss !== false;
  const scriptTransforms = /* @__PURE__ */ new Map();
  const transformScript = (url) => {
    const cached = scriptTransforms.get(url);
    if (cached) return cached;
    const transformed = Promise.resolve(transformFn({
      url,
      kind: "script"
    })).then(normalizeTransformAssetResult);
    scriptTransforms.set(url, transformed);
    return transformed;
  };
  if (!inlineCssEnabled) delete manifest2.inlineCss;
  else if (manifest2.inlineCss) manifest2.inlineCss = await transformInlineCssStyles(manifest2.inlineCss, transformFn);
  for (const route of Object.values(manifest2.routes)) {
    if (route.preloads?.length) route.preloads = await Promise.all(route.preloads.map(async (link) => {
      const result = await transformScript(resolveManifestAssetLink(link).href);
      return assignManifestLink(link, {
        href: result.href,
        crossOrigin: result.crossOrigin
      });
    }));
    if (route.css?.length && !manifest2.inlineCss) route.css = await Promise.all(route.css.map(async (link) => {
      const result = normalizeTransformAssetResult(await transformFn({
        url: resolveManifestCssLink(link).href,
        kind: "stylesheet"
      }));
      return assignManifestLink(link, {
        href: result.href,
        crossOrigin: result.crossOrigin
      });
    }));
    if (route.scripts?.length) for (const script of route.scripts) {
      const src = script.attrs?.src;
      if (typeof src !== "string") continue;
      const result = await transformScript(src);
      script.attrs = {
        ...script.attrs,
        src: result.href
      };
      if (result.crossOrigin) script.attrs.crossOrigin = result.crossOrigin;
      else delete script.attrs.crossOrigin;
    }
  }
  return manifest2;
}
function buildManifest(source, opts) {
  return {
    ...source.scriptFormat ? { scriptFormat: source.scriptFormat } : {},
    ...opts?.inlineCss !== false && source.inlineCss ? { inlineCss: structuredClone(source.inlineCss) } : {},
    routes: { ...source.routes }
  };
}
function getStaticHandlerInlineCssDefault(handlerInlineCss) {
  if (typeof handlerInlineCss === "function") return;
  return handlerInlineCss ?? true;
}
async function resolveInlineCssForRequest(opts) {
  if (opts.requestInlineCss !== void 0) return opts.requestInlineCss;
  if (typeof opts.handlerInlineCss === "function") return await opts.handlerInlineCss({ request: opts.request });
  return opts.handlerInlineCss ?? true;
}
function createCachedBaseManifestLoader(loadBaseManifest) {
  let baseManifestPromise;
  return () => {
    if (!baseManifestPromise) baseManifestPromise = loadBaseManifest().catch((error) => {
      baseManifestPromise = void 0;
      throw error;
    });
    return baseManifestPromise;
  };
}
function createFinalManifestTransformResolver(transformAssets, opts) {
  const transformConfig = transformAssets !== void 0 ? resolveTransformAssetsConfig(transformAssets) : void 0;
  const cache = transformConfig ? transformConfig.cache : true;
  const warmup = !!transformAssets && typeof transformAssets === "object" && "warmup" in transformAssets && transformAssets.warmup === true;
  let cachedCreateTransformPromise;
  const clearCachedCreateTransform = () => {
    cachedCreateTransformPromise = void 0;
  };
  return {
    cache,
    warmup,
    clearCachedCreateTransform,
    getTransformFn: async (ctx) => {
      if (!transformConfig) return void 0;
      if (transformConfig.type !== "createTransform") return transformConfig.transformFn;
      if (!cache || false) return transformConfig.createTransform(ctx);
      if (!cachedCreateTransformPromise) cachedCreateTransformPromise = Promise.resolve(transformConfig.createTransform(ctx)).catch((error) => {
        clearCachedCreateTransform();
        throw error;
      });
      return cachedCreateTransformPromise;
    }
  };
}
function createFinalManifestResolver(opts) {
  const finalManifestCache = /* @__PURE__ */ new Map();
  const transformResolver = createFinalManifestTransformResolver(opts.transformAssets);
  const handlerDefaultInlineCss = getStaticHandlerInlineCssDefault(opts.inlineCss);
  const getRequestManifestOptions = async (requestOpts) => {
    const transformFn = await transformResolver.getTransformFn({
      warmup: false,
      request: requestOpts.request
    });
    const inlineCss = await resolveInlineCssForRequest({
      request: requestOpts.request,
      handlerInlineCss: opts.inlineCss,
      requestInlineCss: requestOpts.requestInlineCss
    });
    return {
      getBaseManifest: requestOpts.getBaseManifest,
      transformFn,
      cache: transformResolver.cache,
      inlineCss
    };
  };
  const resolveRequest = async (requestOpts, cache) => {
    return resolveFinalManifest({
      ...await getRequestManifestOptions(requestOpts),
      finalManifestCache: cache
    });
  };
  return {
    warmup: ({ getBaseManifest: getBaseManifest2 }) => warmupFinalManifest({
      enabled: transformResolver.warmup,
      handlerDefaultInlineCss,
      cache: transformResolver.cache,
      finalManifestCache,
      getBaseManifest: getBaseManifest2,
      getTransformFn: () => transformResolver.getTransformFn({ warmup: true }),
      onError: transformResolver.clearCachedCreateTransform
    }),
    resolveCached: (requestOpts) => resolveRequest(requestOpts, finalManifestCache),
    resolveUncached: (requestOpts) => resolveRequest(requestOpts, void 0)
  };
}
function getFinalManifestCacheKey(inlineCss) {
  return inlineCss ? "inline-css" : "linked-css";
}
function cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, promise) {
  const cachedFinalManifestPromise = promise.catch((error) => {
    if (cachedFinalManifestPromises.get(cacheKey) === cachedFinalManifestPromise) cachedFinalManifestPromises.delete(cacheKey);
    throw error;
  });
  cachedFinalManifestPromises.set(cacheKey, cachedFinalManifestPromise);
  return cachedFinalManifestPromise;
}
function getOrCreateCachedFinalManifestPromise(cachedFinalManifestPromises, cacheKey, computeFinalManifest) {
  const cachedFinalManifestPromise = cachedFinalManifestPromises.get(cacheKey);
  if (cachedFinalManifestPromise) return cachedFinalManifestPromise;
  return cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, Promise.resolve().then(computeFinalManifest));
}
async function buildFinalManifest(opts) {
  return opts.transformFn ? await transformManifestAssets(opts.base, opts.transformFn, { inlineCss: opts.inlineCss }) : buildManifest(opts.base, { inlineCss: opts.inlineCss });
}
async function resolveFinalManifest(opts) {
  const computeFinalManifest = async () => {
    return buildFinalManifest({
      base: await opts.getBaseManifest(),
      transformFn: opts.transformFn,
      inlineCss: opts.inlineCss
    });
  };
  if (opts.finalManifestCache && (!opts.transformFn || opts.cache)) return getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(opts.inlineCss), computeFinalManifest);
  return computeFinalManifest();
}
function warmupFinalManifest(opts) {
  if (!opts.enabled || opts.handlerDefaultInlineCss === void 0 || !opts.cache) return;
  const inlineCss = opts.handlerDefaultInlineCss;
  const warmupPromise = getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(inlineCss), async () => {
    const [base, transformFn] = await Promise.all([opts.getBaseManifest(), opts.getTransformFn()]);
    return buildFinalManifest({
      base,
      transformFn,
      inlineCss
    });
  });
  if (opts.onError) warmupPromise.catch(opts.onError);
  return warmupPromise;
}
var ServerFunctionSerializationAdapter = createSerializationAdapter({
  key: "$TSS/serverfn",
  test: (v) => {
    if (typeof v !== "function") return false;
    if (!(TSS_SERVER_FUNCTION in v)) return false;
    return !!v[TSS_SERVER_FUNCTION];
  },
  toSerializable: ({ serverFnMeta }) => ({ functionId: serverFnMeta.id }),
  fromSerializable: ({ functionId }) => {
    const fn = async (opts, signal) => {
      return (await (await getServerFnById(functionId))(opts ?? {}, signal)).result;
    };
    return fn;
  }
});
function getStartResponseHeaders(opts) {
  return mergeHeaders({ "Content-Type": "text/html; charset=utf-8" }, ..._getRenderedMatches(opts.router.stores.matches.get()).map((match) => {
    return match.headers;
  }));
}
var entriesPromise;
var defaultCsrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });
var getCachedBaseManifest = createCachedBaseManifestLoader(() => getStartManifest());
var getProdBaseManifest = () => getCachedBaseManifest();
var getBaseManifest = getProdBaseManifest;
var createEarlyHintsForRequest = createEarlyHintsCollector;
async function loadEntries() {
  const [routerEntry, startEntry, pluginAdapters] = await Promise.all([
    import("./router-CtQuP2fc.mjs").then((n) => n.aC),
    import("./start-C_qJTNfx.mjs"),
    import("./empty-plugin-adapters-BFgPZ6_d.mjs")
  ]);
  return {
    routerEntry,
    startEntry,
    pluginAdapters
  };
}
function getEntries() {
  if (!entriesPromise) entriesPromise = loadEntries();
  return entriesPromise;
}
var ROUTER_BASEPATH = "/";
var SERVER_FN_BASE = "/_serverFn/";
var IS_PRERENDERING = process.env.TSS_PRERENDERING === "true";
var IS_SHELL_ENV = process.env.TSS_SHELL === "true";
var ERR_NO_RESPONSE = "Internal Server Error";
var ERR_NO_DEFER = "Internal Server Error";
function throwRouteHandlerError() {
  throw new Error(ERR_NO_RESPONSE);
}
function throwIfMayNotDefer() {
  throw new Error(ERR_NO_DEFER);
}
function isSpecialResponse(value) {
  return value instanceof Response || isRedirect(value);
}
function handleCtxResult(result) {
  if (isSsrResponse(result) || isSpecialResponse(result)) return { response: result };
  return result;
}
function disposeLateResponse(result, signal) {
  const response = handleCtxResult(result)?.response;
  if (isSsrResponse(response) || isSpecialResponse(response)) disposeSsrResponseDetached(response, signal.reason);
}
function isSignalAborted(signal) {
  return signal.aborted;
}
async function executeMiddleware(middlewares, ctx, signal) {
  let index = -1;
  let streamResponse;
  let retiredStreamIdentities;
  const isResponseAlias = (candidate, response) => candidate === response || candidate instanceof Response && response.body !== null && candidate.body === response.body;
  const setResponse = (response) => {
    if (isSsrResponse(response)) {
      if (response.serverSsrCleanup === "stream") streamResponse = response;
      ctx.response = response.response;
      return;
    }
    ctx.response = response;
  };
  const disposeStreamResponse = async (reason) => {
    const response = streamResponse;
    if (!response) return;
    streamResponse = void 0;
    retiredStreamIdentities ??= /* @__PURE__ */ new WeakSet();
    retiredStreamIdentities.add(response.response);
    if (response.response.body) retiredStreamIdentities.add(response.response.body);
    const currentResponse = ctx.response;
    if (isResponseAlias(currentResponse, response.response)) ctx.response = void 0;
    await response.dispose(reason);
  };
  const disposeAbandonedResult = (result) => {
    const exposed = handleCtxResult(result)?.response;
    const response = isSsrResponse(exposed) ? exposed.response : exposed;
    if (streamResponse && isResponseAlias(response, streamResponse.response)) {
      disposeStreamResponse(signal.reason).catch(console.error);
      return;
    }
    if (response instanceof Response && retiredStreamIdentities && (retiredStreamIdentities.has(response) || response.body !== null && retiredStreamIdentities.has(response.body))) return;
    disposeLateResponse(result, signal);
  };
  const getFinalResponse = async () => {
    const response = ctx.response;
    if (!response) throwRouteHandlerError();
    if (!streamResponse) return response;
    if (response === streamResponse.response) return streamResponse;
    if (streamResponse.response.body !== null && response.body === streamResponse.response.body) return {
      ...streamResponse,
      response
    };
    await disposeStreamResponse("middleware response replaced");
    return response;
  };
  let nextPromise;
  function next(nextCtx) {
    const result = runNext(nextCtx);
    nextPromise = result;
    return result;
  }
  async function runNext(nextCtx) {
    if (signal.aborted) throw signal.reason;
    if (nextCtx) {
      if (nextCtx.context) ctx.context = safeObjectMerge(ctx.context, nextCtx.context);
      for (const key of Object.keys(nextCtx)) if (key === "response") setResponse(nextCtx.response);
      else if (key !== "context") ctx[key] = nextCtx[key];
    }
    index++;
    const middleware = middlewares[index];
    if (!middleware) return ctx;
    let result;
    try {
      const pending = middleware({
        ...ctx,
        next
      });
      if (pending === nextPromise) {
        nextPromise = void 0;
        result = await pending;
        if (isSignalAborted(signal)) {
          disposeAbandonedResult(result);
          throw signal.reason;
        }
      } else result = await waitForRequest(pending, signal, disposeAbandonedResult);
    } catch (err) {
      if (isSignalAborted(signal)) throw signal.reason;
      if (isSpecialResponse(err)) {
        setResponse(err);
        return ctx;
      }
      throw err;
    }
    const normalized = handleCtxResult(result);
    if (normalized) {
      if (normalized.response !== void 0) setResponse(normalized.response);
      if (normalized.context) ctx.context = safeObjectMerge(ctx.context, normalized.context);
    }
    return ctx;
  }
  try {
    await runNext();
    const response = await waitForRequest(getFinalResponse(), signal, disposeAbandonedResult);
    if (signal.aborted) {
      disposeAbandonedResult(response);
      throw signal.reason;
    }
    return {
      ctx,
      response
    };
  } catch (err) {
    const disposal = disposeStreamResponse(signal.aborted ? signal.reason : err);
    if (signal.aborted) disposal.catch(console.error);
    else await disposal;
    throw err;
  }
}
function handlerToMiddleware(handler, mayDefer = false) {
  if (mayDefer) return handler;
  return async (ctx) => {
    const response = await handler({
      ...ctx,
      next: throwIfMayNotDefer
    });
    if (!response) throwRouteHandlerError();
    return response;
  };
}
function createStartHandler(cbOrOptions) {
  const handlerOptions = typeof cbOrOptions === "function" ? {} : cbOrOptions;
  const cb = typeof cbOrOptions === "function" ? cbOrOptions : cbOrOptions.handler;
  const finalManifestResolver = createFinalManifestResolver({
    ...handlerOptions
  });
  const resolveManifestForRequest = finalManifestResolver.resolveCached;
  finalManifestResolver.warmup({ getBaseManifest: () => getBaseManifest() });
  const startRequestResolver = async (request, requestOpts) => {
    let router = null;
    let responseOwnsCleanup = false;
    try {
      request.signal.throwIfAborted();
      const { url, handledProtocolRelativeURL } = getNormalizedURL(request.url);
      const href = url.pathname + url.search + url.hash;
      const origin = getOrigin(request);
      if (handledProtocolRelativeURL) return Response.redirect(url, 308);
      const entries = await waitForRequest(getEntries(), request.signal);
      const hasStartInstance = !!entries.startEntry.startInstance;
      const startOptions = await waitForRequest(entries.startEntry.startInstance?.getOptions(), request.signal) || {};
      const { hasPluginAdapters, pluginSerializationAdapters } = entries.pluginAdapters;
      const serializationAdapters = [
        ...startOptions.serializationAdapters || [],
        ...hasPluginAdapters ? pluginSerializationAdapters : [],
        ServerFunctionSerializationAdapter
      ];
      const requestStartOptions = {
        ...startOptions,
        requestMiddleware: hasStartInstance ? startOptions.requestMiddleware : [defaultCsrfMiddleware],
        serializationAdapters
      };
      const flattenedRequestMiddlewares = requestStartOptions.requestMiddleware ? flattenMiddlewares(requestStartOptions.requestMiddleware) : [];
      const executedRequestMiddlewares = new Set(flattenedRequestMiddlewares);
      const getRouter = async () => {
        if (router) return router;
        router = await waitForRequest(entries.routerEntry.getRouter(), request.signal);
        let isShell = IS_SHELL_ENV;
        if (IS_PRERENDERING && !isShell) isShell = request.headers.get(HEADERS.TSS_SHELL) === "true";
        const history = createMemoryHistory({ initialEntries: [href] });
        router.update({
          history,
          isShell,
          isPrerendering: IS_PRERENDERING,
          origin: router.options.origin ?? origin,
          defaultSsr: requestStartOptions.defaultSsr,
          serializationAdapters: [...requestStartOptions.serializationAdapters, ...router.options.serializationAdapters || []],
          basepath: ROUTER_BASEPATH
        });
        return router;
      };
      if (SERVER_FN_BASE && url.pathname.startsWith(SERVER_FN_BASE)) {
        if (false) ;
        const serverFnId = url.pathname.slice(SERVER_FN_BASE.length).split("/")[0];
        if (!serverFnId) throw new Error("Invalid server action param for serverFnId");
        const serverFnHandler = async ({ context }) => {
          return runWithStartContext({
            getRouter,
            startOptions: requestStartOptions,
            contextAfterGlobalMiddlewares: context,
            request,
            executedRequestMiddlewares,
            handlerType: "serverFn"
          }, () => handleServerAction({
            request,
            context: requestOpts?.context,
            serverFnId
          }));
        };
        const { response: middlewareResponse2 } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), serverFnHandler], {
          request,
          pathname: url.pathname,
          handlerType: "serverFn",
          context: createNullProtoObject(requestOpts?.context)
        }, request.signal);
        const result = await handleRedirectResponse(middlewareResponse2, request, getRouter, request.signal);
        bindSsrResponseToRequest(router ?? void 0, result, request.signal);
        request.signal.throwIfAborted();
        responseOwnsCleanup = result.serverSsrCleanup === "stream";
        return result.response;
      }
      const executeRouter = async (serverContext, matchedRoutes) => {
        const acceptParts = (request.headers.get("Accept") || "*/*").split(",");
        if (!["*/*", "text/html"].some((mimeType) => acceptParts.some((part) => part.trim().startsWith(mimeType)))) return normalizeSsrResponse(Response.json({ error: "Only HTML requests are supported here" }, { status: 500 }));
        const manifest2 = await waitForRequest(resolveManifestForRequest({
          request,
          requestInlineCss: requestOpts?.inlineCss,
          getBaseManifest: () => getBaseManifest(matchedRoutes)
        }), request.signal);
        const earlyHints = createEarlyHintsForRequest({
          onEarlyHints: requestOpts?.onEarlyHints,
          responseLinkHeader: requestOpts?.responseLinkHeader
        });
        earlyHints?.collectStatic({
          manifest: manifest2,
          matchedRoutes
        });
        const routerInstance = await getRouter();
        attachRouterServerSsrUtils({
          router: routerInstance,
          manifest: manifest2,
          getRequestAssets: () => getStartContext({ throwIfNotFound: false })?.requestAssets
        });
        routerInstance.options.additionalContext = { serverContext };
        await routerInstance.load({ _signal: request.signal });
        request.signal.throwIfAborted();
        if (routerInstance._serverResult?.type === "redirect") return normalizeSsrResponse(routerInstance._serverResult.redirect);
        earlyHints?.collectDynamic(_getRenderedMatches(routerInstance.stores.matches.get()));
        const ctx = getStartContext({ throwIfNotFound: false });
        await waitForRequest(routerInstance.serverSsr.dehydrate({ requestAssets: ctx?.requestAssets }), request.signal);
        request.signal.throwIfAborted();
        const responseHeaders = getStartResponseHeaders({ router: routerInstance });
        earlyHints?.appendResponseHeaders(responseHeaders);
        request.signal.throwIfAborted();
        return normalizeSsrResponse(await waitForRequest(cb({
          request,
          router: routerInstance,
          responseHeaders
        }), request.signal, (late) => disposeLateResponse(late, request.signal)));
      };
      const requestHandlerMiddleware = async ({ context }) => {
        return runWithStartContext({
          getRouter,
          startOptions: requestStartOptions,
          contextAfterGlobalMiddlewares: context,
          request,
          executedRequestMiddlewares,
          handlerType: "router"
        }, async () => {
          try {
            return await handleServerRoutes({
              getRouter,
              request,
              url,
              executeRouter,
              context,
              executedRequestMiddlewares
            });
          } catch (err) {
            if (err instanceof Response) return err;
            throw err;
          }
        });
      };
      const { response: middlewareResponse } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), requestHandlerMiddleware], {
        request,
        pathname: url.pathname,
        handlerType: "router",
        context: createNullProtoObject(requestOpts?.context)
      }, request.signal);
      const response = await handleRedirectResponse(middlewareResponse, request, getRouter, request.signal);
      bindSsrResponseToRequest(router ?? void 0, response, request.signal);
      request.signal.throwIfAborted();
      responseOwnsCleanup = response.serverSsrCleanup === "stream";
      return response.response;
    } finally {
      if (router?.serverSsr && !responseOwnsCleanup) router.serverSsr.cleanup();
      router = null;
    }
  };
  return requestHandler(startRequestResolver);
}
async function handleRedirectResponse(response, request, getRouter, signal) {
  signal.throwIfAborted();
  const ssrResponse = normalizeSsrResponse(response);
  if (!isRedirect(ssrResponse.response)) return ssrResponse;
  if (isResolvedRedirect(ssrResponse.response)) {
    if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
      ...ssrResponse.response.options,
      isSerializedRedirect: true
    }, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
    return ssrResponse;
  }
  const opts = ssrResponse.response.options;
  if (opts.to && typeof opts.to === "string" && !opts.to.startsWith("/")) throw new Error(`Server side redirects must use absolute paths via the 'href' or 'to' options. The redirect() method's "to" property accepts an internal path only. Use the "href" property to provide an external URL. Received: ${JSON.stringify(opts)}`);
  if ([
    "params",
    "search",
    "hash"
  ].some((d) => typeof opts[d] === "function")) throw new Error(`Server side redirects must use static search, params, and hash values and do not support functional values. Received functional values for: ${Object.keys(opts).filter((d) => typeof opts[d] === "function").map((d) => `"${d}"`).join(", ")}`);
  signal.throwIfAborted();
  const router = await waitForRequest(getRouter(), signal);
  signal.throwIfAborted();
  const redirect = router.resolveRedirect(ssrResponse.response);
  if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
    ...ssrResponse.response.options,
    isSerializedRedirect: true
  }, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
  return waitForRequest(replaceSsrResponse(ssrResponse, redirect, "redirect response replaced"), signal);
}
async function handleServerRoutes({ getRouter, request, url, executeRouter, context, executedRequestMiddlewares }) {
  const router = await getRouter();
  const pathname = executeRewriteInput(router.rewrite, url).pathname;
  const [matchedRoutes, rawParams, foundRoute] = router.getMatchedRoutes(pathname);
  const isExactMatch = foundRoute && rawParams["**"] === void 0;
  const routeMiddlewares = [];
  for (const route of matchedRoutes) {
    const serverMiddleware = route.options.server?.middleware;
    if (serverMiddleware) {
      const flattened = flattenMiddlewares(serverMiddleware);
      for (const m of flattened) if (!executedRequestMiddlewares.has(m)) routeMiddlewares.push(m.options.server);
    }
  }
  const server2 = foundRoute?.options.server;
  let isHeadFallback = false;
  if (server2?.handlers && isExactMatch) {
    const handlers = typeof server2.handlers === "function" ? server2.handlers({ createHandlers: (d) => d }) : server2.handlers;
    const requestMethod = request.method.toUpperCase();
    const handler = requestMethod === "HEAD" ? handlers["HEAD"] ?? handlers["GET"] ?? handlers["ANY"] : handlers[requestMethod] ?? handlers["ANY"];
    isHeadFallback = requestMethod === "HEAD" && handler !== void 0 && !handlers["HEAD"];
    if (handler) {
      const mayDefer = !!foundRoute.options.component;
      if (typeof handler === "function") routeMiddlewares.push(handlerToMiddleware(handler, mayDefer));
      else {
        if (handler.middleware?.length) {
          const handlerMiddlewares = flattenMiddlewares(handler.middleware);
          for (const m of handlerMiddlewares) routeMiddlewares.push(m.options.server);
        }
        if (handler.handler) routeMiddlewares.push(handlerToMiddleware(handler.handler, mayDefer));
      }
    }
  }
  routeMiddlewares.push(((ctx2) => executeRouter(ctx2.context, matchedRoutes)));
  const { ctx, response } = await executeMiddleware(routeMiddlewares, {
    request,
    context,
    params: rawParams,
    pathname,
    handlerType: "router"
  }, request.signal);
  if (isHeadFallback) {
    if (!ctx.response) throwRouteHandlerError();
    return waitForRequest(stripSsrResponseBody(await handleRedirectResponse(response, request, getRouter, request.signal), "HEAD body stripped"), request.signal);
  }
  return normalizeSsrResponse(response);
}
var fetch = createStartHandler(defaultStreamHandler);
function createServerEntry(entry) {
  return { async fetch(...args) {
    return await entry.fetch(...args);
  } };
}
var server_default = createServerEntry({ fetch });
const server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createServerEntry,
  default: server_default
}, Symbol.toStringTag, { value: "Module" }));
export {
  TSS_SERVER_FUNCTION as T,
  createMiddleware as a,
  getServerFnById as b,
  createServerFn as c,
  server as d,
  getRequest as g,
  setResponseHeader as s
};
