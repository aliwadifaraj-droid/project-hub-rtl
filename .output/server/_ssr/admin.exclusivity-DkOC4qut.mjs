import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, Z as searchProjectByName, _ as updateExclusivityHours, $ as toggleExclusivityOn, a0 as toggleExclusivityOff } from "./router-pxcAI1C5.mjs";
import { b as useQueryClient, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { T as Toaster } from "./sonner-DeNSN9-c.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { l as Search, L as LoaderCircle, h as Lock, Q as LockOpen, c as Clock, N as Save, V as Play, Y as Square } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "./createSsrRpc-C50NoQin.mjs";
import "./server-BNqJEEJz.mjs";
import "../_libs/h3-v2.mjs";
import "../_libs/unenv.mjs";


import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";




import "./auth-middleware.server-CWyFWbOs.mjs";
import "./db-BSVZwhof.mjs";
import "../_libs/libsql__client.mjs";
import "../_libs/libsql__core.mjs";
import "../_libs/js-base64.mjs";
import "../_libs/jose.mjs";

import "./vip.repo-BoiBu0-3.mjs";
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
function ExclusivityPage() {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchProjectByName);
  const updateHoursFn = useServerFn(updateExclusivityHours);
  const toggleOnFn = useServerFn(toggleExclusivityOn);
  const toggleOffFn = useServerFn(toggleExclusivityOff);
  const [query, setQuery] = reactExports.useState("");
  const [searching, setSearching] = reactExports.useState(false);
  const [results, setResults] = reactExports.useState([]);
  const [hoursMap, setHoursMap] = reactExports.useState({});
  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const rows = await searchFn({
        data: {
          q: query.trim()
        }
      });
      setResults(rows);
      const map = {};
      for (const r of rows) map[r.id] = String(r.exclusive_hours ?? 6);
      setHoursMap(map);
    } catch {
      toast.error("تعذر البحث، حاول مرة أخرى.");
    } finally {
      setSearching(false);
    }
  }
  const saveHoursMut = useMutation({
    mutationFn: (vars) => updateHoursFn({
      data: {
        projectId: vars.projectId,
        hours: vars.hours
      }
    }),
    onSuccess: () => {
      toast.success("تم حفظ عدد الساعات");
      qc.invalidateQueries({
        queryKey: ["exclusivity-search"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const toggleOnMut = useMutation({
    mutationFn: (vars) => toggleOnFn({
      data: {
        projectId: vars.projectId,
        hours: vars.hours
      }
    }),
    onSuccess: () => {
      toast.success("تم تشغيل الحصرية");
      refreshResults();
    },
    onError: (e) => toast.error(e.message)
  });
  const toggleOffMut = useMutation({
    mutationFn: (projectId) => toggleOffFn({
      data: {
        projectId
      }
    }),
    onSuccess: () => {
      toast.success("تم إيقاف الحصرية");
      refreshResults();
    },
    onError: (e) => toast.error(e.message)
  });
  async function refreshResults() {
    if (!query.trim()) return;
    try {
      const rows = await searchFn({
        data: {
          q: query.trim()
        }
      });
      setResults(rows);
      const map = {};
      for (const r of rows) map[r.id] = String(r.exclusive_hours ?? 6);
      setHoursMap(map);
    } catch {
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-center", dir: "rtl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold mb-2", children: "لوحة تحكم الحصرية" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-6", children: "ابحث عن مشروع لتعديل ساعات الحصرية الافتراضية أو تشغيل/إيقاف الحصرية يدوياً." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSearch, className: "flex gap-2 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "ابحث باسم المشروع...", className: "w-full rounded-lg border border-input bg-background pr-10 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: searching || !query.trim(), className: "inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60", children: [
        searching ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
        "بحث"
      ] })
    ] }),
    results.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground", children: "لا توجد نتائج. ابحث عن مشروع بالاسم." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: results.map((r) => {
      const hours = hoursMap[r.id] ?? String(r.exclusive_hours ?? 6);
      const busy = saveHoursMut.isPending || toggleOnMut.isPending || toggleOffMut.isPending;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-4 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-base truncate", children: r.name }),
          r.location ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: r.location }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${r.active ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`, children: r.active ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3 w-3" }),
              " حصري - متبقي ",
              r.remaining_hours,
              " ساعة"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LockOpen, { className: "h-3 w-3" }),
              " مفتوح للجميع"
            ] }) }),
            r.vip_end_at ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
              "ينتهي: ",
              new Date(r.vip_end_at).toLocaleString("ar")
            ] }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 1, max: 720, value: hours, onChange: (e) => setHoursMap((m) => ({
              ...m,
              [r.id]: e.target.value
            })), className: "w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-center" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "ساعة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            const n = Number(hours);
            if (!Number.isFinite(n) || n < 1 || n > 720) {
              toast.error("الساعات يجب أن تكون بين 1 و 720");
              return;
            }
            saveHoursMut.mutate({
              projectId: r.id,
              hours: n
            });
          }, disabled: busy, className: "inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3.5 w-3.5" }),
            " حفظ"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
            const n = Number(hours);
            const h = Number.isFinite(n) && n > 0 ? n : 6;
            toggleOnMut.mutate({
              projectId: r.id,
              hours: h
            });
          }, disabled: busy, className: "inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-3.5 w-3.5" }),
            " تشغيل"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toggleOffMut.mutate(r.id), disabled: busy, className: "inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5" }),
            " إيقاف"
          ] })
        ] })
      ] }) }, r.id);
    }) })
  ] });
}
export {
  ExclusivityPage as component
};
