import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, c as searchRequests } from "./router-CtQuP2fc.mjs";
import { S as SiteHeader } from "./site-header-DfiCN8H8.mjs";
import { S as SiteFooter } from "./site-footer-ByXRtXvu.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { e as ClipboardList, L as LoaderCircle, l as Search } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
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
const STATUS = {
  new: {
    label: "جديد",
    cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300"
  },
  reviewing: {
    label: "قيد المراجعة",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300"
  },
  accepted: {
    label: "مقبول",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
  },
  rejected: {
    label: "مرفوض",
    cls: "bg-red-500/15 text-red-700 dark:text-red-300"
  }
};
function MyRequests() {
  const search = useServerFn(searchRequests);
  const [q, setQ] = reactExports.useState("");
  const [rows, setRows] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [searched, setSearched] = reactExports.useState(false);
  async function onSearch(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await search({
        data: {
          q: q.trim()
        }
      });
      setRows(r);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-7 w-7" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 text-3xl md:text-4xl font-extrabold", children: "طلباتي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "ابحث باسم شركتك لعرض جميع العروض التي قدّمتها وحالتها الحالية." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: onSearch, className: "mt-8 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", required: true, value: q, onChange: (e) => setQ(e.target.value), placeholder: "اكتب اسم الشركة...", className: "flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: loading, className: "inline-flex items-center gap-1.5 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background hover:bg-foreground/90 disabled:opacity-60", children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
          " بحث"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8", children: [
        searched && rows && rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-8 text-center text-muted-foreground", children: [
          'لا توجد طلبات باسم "',
          q,
          '"'
        ] }) : null,
        rows && rows.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: rows.map((r) => {
          const s = STATUS[r.status] ?? STATUS.new;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold", children: r.projects?.name ?? "مشروع" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: r.company_name }),
                " • ",
                r.facility_location
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: new Date(r.created_at).toLocaleString("ar") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`, children: s.label })
          ] }) }, r.id);
        }) }) : null
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
export {
  MyRequests as component
};
