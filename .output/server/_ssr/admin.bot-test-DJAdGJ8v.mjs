import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, M as startVisitorChat, N as visitorSendMessage, O as visitorGetMessages, P as listBotQuestions } from "./router-pxcAI1C5.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { u as Bot, R as RefreshCw, O as CircleAlert, S as Send } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
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
function generateUuid() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = b[6] & 15 | 64;
  b[8] = b[8] & 63 | 128;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
}
function BotTestPage() {
  const startFn = useServerFn(startVisitorChat);
  const sendFn = useServerFn(visitorSendMessage);
  const getFn = useServerFn(visitorGetMessages);
  const listQaFn = useServerFn(listBotQuestions);
  const [token, setToken] = reactExports.useState(() => generateUuid());
  const [messages, setMessages] = reactExports.useState([]);
  const [qas, setQas] = reactExports.useState([]);
  const [input, setInput] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [log, setLog] = reactExports.useState([]);
  function pushLog(type, msg) {
    setLog((l) => [{
      ts: (/* @__PURE__ */ new Date()).toLocaleTimeString("ar"),
      type,
      msg
    }, ...l].slice(0, 50));
  }
  async function refresh(t = token) {
    try {
      const r = await getFn({
        data: {
          visitorToken: t
        }
      });
      setMessages(r.messages ?? []);
      pushLog("ok", `تحديث الرسائل (${r.messages?.length ?? 0})`);
    } catch (e) {
      pushLog("error", `فشل التحديث: ${e?.message ?? e}`);
    }
  }
  async function init() {
    setError(null);
    try {
      pushLog("info", `بدء جلسة جديدة (${token.slice(0, 8)}…)`);
      await startFn({
        data: {
          visitorToken: token,
          visitorName: "أدمن-تجريبي"
        }
      });
      pushLog("ok", "تم إنشاء الجلسة");
      const qa = await listQaFn();
      setQas(qa ?? []);
      pushLog("ok", `تحميل الأسئلة المُدرَّبة (${qa?.length ?? 0})`);
      await refresh(token);
    } catch (e) {
      const m = e?.message ?? String(e);
      setError(m);
      pushLog("error", `فشل بدء الجلسة: ${m}`);
    }
  }
  async function send(body, qaId) {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      pushLog("info", `إرسال: ${body}`);
      await sendFn({
        data: {
          visitorToken: token,
          body,
          qaId: qaId != null ? String(qaId) : null
        }
      });
      pushLog("ok", "تم الإرسال، جارٍ جلب الرد…");
      setInput("");
      await refresh();
    } catch (e) {
      const m = e?.message ?? String(e);
      setError(m);
      pushLog("error", `فشل الإرسال: ${m}`);
    } finally {
      setSending(false);
    }
  }
  function newSession() {
    const t = generateUuid();
    setToken(t);
    setMessages([]);
    setError(null);
    pushLog("info", `توليد توكن جديد ${t.slice(0, 8)}…`);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "تجربة البوت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "اختبر الإرسال واعرض أي خطأ يظهر" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: init, className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }),
          " بدء الجلسة"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: newSession, className: "rounded-md border border-border px-3 py-2 text-sm", children: "توكن جديد" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Visitor Token:" }),
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "ltr", dir: "ltr", children: token })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-4 w-4 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 break-words", children: error })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border px-3 py-2 text-sm font-bold", children: "المحادثة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-80 space-y-2 overflow-auto p-3", children: messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-muted-foreground", children: 'لا رسائل بعد — اضغط "بدء الجلسة"' }) : messages.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-md p-2 text-sm ${m.sender === "visitor" ? "bg-primary/10 ms-8" : m.sender === "bot" ? "bg-secondary me-8" : "bg-accent/20 text-center text-xs"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-0.5 text-[10px] text-muted-foreground", children: m.sender }),
          m.body
        ] }, m.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border p-2", children: [
          qas.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex flex-wrap gap-1", children: qas.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => send(q.question, q.id), disabled: sending, className: "rounded-full border border-border px-2 py-1 text-[11px] hover:bg-secondary disabled:opacity-50", children: q.question }, q.id)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
              if (e.key === "Enter") send(input);
            }, placeholder: "اكتب رسالة تجريبية…", className: "flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => send(input), disabled: sending || !input.trim(), className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
              " ",
              sending ? "..." : "إرسال"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: "سجل التنفيذ" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setLog([]), className: "text-xs text-muted-foreground hover:text-foreground", children: "مسح" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-[26rem] overflow-auto p-2 font-mono text-xs", dir: "ltr", children: log.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-2 text-center text-muted-foreground", children: "لا يوجد سجل" }) : log.map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `border-b border-border/50 px-2 py-1 ${l.type === "error" ? "text-destructive" : l.type === "ok" ? "text-emerald-600" : "text-muted-foreground"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "opacity-60", children: [
            "[",
            l.ts,
            "]"
          ] }),
          " ",
          l.msg
        ] }, i)) })
      ] })
    ] })
  ] });
}
export {
  BotTestPage as component
};
