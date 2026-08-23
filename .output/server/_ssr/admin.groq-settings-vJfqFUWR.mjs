import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { b as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, a1 as getGroqSettings, a2 as updateGroqSettings } from "./router-pxcAI1C5.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { u as Bot, X, m as Plus, N as Save } from "../_libs/lucide-react.mjs";

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
function GeminiSettingsPage() {
  const qc = useQueryClient();
  const fetchCfg = useServerFn(getGroqSettings);
  const saveCfg = useServerFn(updateGroqSettings);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["groq-cfg"],
    queryFn: () => fetchCfg()
  });
  const [systemInstruction, setSystem] = reactExports.useState("");
  const [dialect, setDialect] = reactExports.useState("");
  const [botName, setBotName] = reactExports.useState("");
  const [blocked, setBlocked] = reactExports.useState([]);
  const [newBlocked, setNewBlocked] = reactExports.useState("");
  const [scope, setScope] = reactExports.useState("");
  const [groqEnabled, setGroqEnabled] = reactExports.useState(true);
  const [saving, setSaving] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!data) return;
    setSystem(data.systemInstruction);
    setDialect(data.dialect);
    setBotName(data.botName);
    setBlocked(data.blockedReplies ?? []);
    setScope(data.scope);
    setGroqEnabled(data.groqEnabled ?? true);
  }, [data]);
  async function save() {
    setSaving(true);
    try {
      const payload = {
        systemInstruction,
        dialect,
        botName,
        blockedReplies: blocked,
        scope,
        groqEnabled
      };
      await saveCfg({
        data: payload
      });
      qc.invalidateQueries({
        queryKey: ["groq-cfg"]
      });
      toast.success("تم حفظ إعدادات Groq");
    } catch (e) {
      toast.error(e?.message ?? "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }
  function addBlocked() {
    const v = newBlocked.trim();
    if (!v) return;
    if (blocked.includes(v)) {
      setNewBlocked("");
      return;
    }
    setBlocked([...blocked, v]);
    setNewBlocked("");
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "إعدادات Groq" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "تحكم في شخصية البوت ونطاق ردوده" })
      ] })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-4 text-center text-sm text-muted-foreground", children: "جاري التحميل…" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold", children: "تفعيل Groq" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "تشغيل أو إيقاف ردود Groq للأسئلة الخارجية" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setGroqEnabled(!groqEnabled), role: "switch", "aria-checked": groqEnabled, className: `relative h-6 w-11 rounded-full transition ${groqEnabled ? "bg-primary" : "bg-muted"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${groqEnabled ? "start-0.5" : "end-0.5"}` }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "System Instruction" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 5, value: systemInstruction, onChange: (e) => setSystem(e.target.value), className: "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring", placeholder: "مثال: أنت مساعد ودود..." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "اللهجة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: dialect, onChange: (e) => setDialect(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring", placeholder: "سعودي، مصري، فصحى..." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "اسم البوت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: botName, onChange: (e) => setBotName(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring", placeholder: "مساعد العمران" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "الردود الممنوعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex flex-wrap gap-2", children: [
          blocked.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "لا يوجد" }),
          blocked.map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs", children: [
            b,
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setBlocked(blocked.filter((_, j) => j !== i)), className: "grid h-4 w-4 place-items-center rounded-full hover:bg-background", "aria-label": "حذف", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }) })
          ] }, i))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: newBlocked, onChange: (e) => setNewBlocked(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addBlocked();
            }
          }, className: "flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring", placeholder: "أضف كلمة أو عبارة ممنوعة..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: addBlocked, className: "inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            " إضافة"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "أي رد يحتوي على أحد هذه العبارات سيتم استبداله برسالة تحويل للموظف." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "نطاق عمل البوت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 4, value: scope, onChange: (e) => setScope(e.target.value), className: "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring", placeholder: "مثال: الرد على أسئلة المشاريع والمنصة فقط." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: save, disabled: saving, className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
        " ",
        saving ? "جارٍ الحفظ…" : "حفظ"
      ] }) })
    ] })
  ] });
}
export {
  GeminiSettingsPage as component
};
