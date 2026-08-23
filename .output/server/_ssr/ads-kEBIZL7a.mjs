import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, l as listApprovedAds } from "./router-CtQuP2fc.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { S as SiteHeader } from "./site-header-DfiCN8H8.mjs";
import { S as SiteFooter } from "./site-footer-ByXRtXvu.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { d as Megaphone, L as LoaderCircle } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./createSsrRpc-DY9HpWEz.mjs";
import "./server-COznR7QB.mjs";
import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";




import "./auth-middleware.server-B9hAjfqi.mjs";
import "./db-D5OYORU-.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

import "./vip.repo-CycBrLVA.mjs";
import "./saudi-cities-D2sGDQV3.mjs";
import "./r2-CJ2zxhhj.mjs";
import "../_libs/lovable.dev__webhooks-js.mjs";
import "../_libs/lovable.dev__email-js.mjs";
import "../_libs/react-email__render.mjs";
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
import "../_libs/aws-sdk__client-s3.mjs";
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
import "../_libs/react-email__html.mjs";
import "../_libs/react-email__head.mjs";
import "../_libs/react-email__preview.mjs";
import "../_libs/react-email__body.mjs";
import "../_libs/react-email__container.mjs";
import "../_libs/react-email__heading.mjs";
import "../_libs/react-email__text.mjs";
import "../_libs/zod.mjs";
import "./notifications.functions-mf2-5xG4.mjs";
import "./chat.functions-DV_-1jmL.mjs";
function AdsListPage() {
  const list = useServerFn(listApprovedAds);
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["approved-ads"],
    queryFn: () => list()
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen flex-col bg-background", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "container mx-auto flex-1 px-4 py-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-5 w-5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "الإعلانات" })
      ] }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-destructive", children: error.message }) : !data || data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground", children: "لا توجد إعلانات حالياً." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: data.map((ad) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/ads/$adId", params: {
        adId: ad.id
      }, className: "group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-[var(--shadow-card)]", children: [
        ad.image_signed_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: ad.image_signed_url, alt: ad.title, className: "h-44 w-full object-cover transition group-hover:scale-105" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-44 w-full place-items-center bg-secondary/50 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-8 w-8" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-1 font-bold", children: ad.title }),
          ad.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground line-clamp-2", children: ad.description }) : null
        ] })
      ] }, ad.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
export {
  AdsListPage as component
};
