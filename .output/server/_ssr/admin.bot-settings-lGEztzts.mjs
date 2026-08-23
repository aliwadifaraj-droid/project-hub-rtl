import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, K as getBotSettings, L as updateBotSettings } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { v as Settings2, N as Save } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__query-core.mjs";
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
const DAYS = [{
  key: "sat",
  label: "السبت"
}, {
  key: "sun",
  label: "الأحد"
}, {
  key: "mon",
  label: "الاثنين"
}, {
  key: "tue",
  label: "الثلاثاء"
}, {
  key: "wed",
  label: "الأربعاء"
}, {
  key: "thu",
  label: "الخميس"
}, {
  key: "fri",
  label: "الجمعة"
}];
function trimSec(t) {
  return t?.length >= 5 ? t.slice(0, 5) : t;
}
function BotSettingsPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getBotSettings);
  const saveFn = useServerFn(updateBotSettings);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["bot-settings"],
    queryFn: () => getFn()
  });
  const [workDays, setWorkDays] = reactExports.useState({
    sat: false,
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: false
  });
  const [workStart, setWorkStart] = reactExports.useState("09:00");
  const [workEnd, setWorkEnd] = reactExports.useState("17:00");
  const [offMsg, setOffMsg] = reactExports.useState("نحن خارج ساعات العمل حالياً. سنرد عليك في أقرب وقت.");
  const [fallbackMsg, setFallbackMsg] = reactExports.useState('عذرًا، لا أملك إجابة على هذا السؤال. يمكنك اختيار أحد الأسئلة من القائمة أو كتابة "موظف" للتحدث مع الدعم.');
  const [allowEsc, setAllowEsc] = reactExports.useState(true);
  const [showSuggested, setShowSuggested] = reactExports.useState(true);
  const [localEnabled, setLocalEnabled] = reactExports.useState(true);
  const [localSystemPrompt, setLocalSystemPrompt] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!data) return;
    setWorkDays(data.work_days);
    setWorkStart(trimSec(data.work_start));
    setWorkEnd(trimSec(data.work_end));
    setOffMsg(data.off_hours_message);
    setFallbackMsg(data.fallback_message ?? "");
    setAllowEsc(data.allow_escalation);
    setShowSuggested(data.show_suggested_questions ?? true);
    setLocalEnabled(data.local_enabled ?? true);
    setLocalSystemPrompt(data.local_system_prompt ?? "");
  }, [data]);
  async function save() {
    setSaving(true);
    try {
      await saveFn({
        data: {
          work_days: workDays,
          work_start: workStart,
          work_end: workEnd,
          off_hours_message: offMsg,
          fallback_message: fallbackMsg,
          allow_escalation: allowEsc,
          show_suggested_questions: showSuggested,
          local_enabled: localEnabled,
          local_system_prompt: localSystemPrompt
        }
      });
      qc.invalidateQueries({
        queryKey: ["bot-settings"]
      });
      qc.invalidateQueries({
        queryKey: ["bot-settings-public"]
      });
      toast.success("تم حفظ الإعدادات");
    } catch (e) {
      toast.error(e?.message ?? "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "إعدادات البوت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "تحكم في ساعات عمل البوت ورسائل خارج الدوام" })
      ] })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-4 text-center text-sm text-muted-foreground", children: "جاري التحميل…" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-sm font-bold", children: "ساعات العمل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-2 block text-xs font-semibold", children: "أيام العمل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-4", children: DAYS.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: workDays[d.key], onChange: (e) => setWorkDays({
              ...workDays,
              [d.key]: e.target.checked
            }) }),
            d.label
          ] }, d.key)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "من" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "time", value: workStart, onChange: (e) => setWorkStart(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "إلى" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "time", value: workEnd, onChange: (e) => setWorkEnd(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-sm font-bold", children: "الرسائل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "رسالة خارج الدوام" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 4, value: offMsg, onChange: (e) => setOffMsg(e.target.value), className: "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "الرد الافتراضي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 4, value: fallbackMsg, onChange: (e) => setFallbackMsg(e.target.value), className: "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "يُستخدم عندما لا يجد البوت إجابة مطابقة لسؤال العميل." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-border pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold", children: "إظهار الأسئلة المقترحة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "عرض قائمة الأسئلة السريعة في بوت الصفحة الرئيسية" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowSuggested(!showSuggested), role: "switch", "aria-checked": showSuggested, className: `relative h-6 w-11 rounded-full transition ${showSuggested ? "bg-primary" : "bg-muted"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${showSuggested ? "start-0.5" : "end-0.5"}` }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold", children: "تفعيل البوت المحلي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "تشغيل أو إيقاف ردود البوت المحلي (بيانات المنصة)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setLocalEnabled(!localEnabled), role: "switch", "aria-checked": localEnabled, className: `relative h-6 w-11 rounded-full transition ${localEnabled ? "bg-primary" : "bg-muted"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${localEnabled ? "start-0.5" : "end-0.5"}` }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "System Prompt" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 5, value: localSystemPrompt, onChange: (e) => setLocalSystemPrompt(e.target.value), className: "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring", placeholder: "تعليمات يقرأها البوت المحلي قبل أي رد..." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "يستخدمها البوت المحلي كتوجيه ثابت قبل كل رد." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded-xl border border-border bg-background p-4 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold", children: "تفعيل التحويل للدعم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "السماح للعملاء بطلب التحدث مع موظف" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setAllowEsc(!allowEsc), role: "switch", "aria-checked": allowEsc, className: `relative h-6 w-11 rounded-full transition ${allowEsc ? "bg-primary" : "bg-muted"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${allowEsc ? "start-0.5" : "end-0.5"}` }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: save, disabled: saving, className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
        " ",
        saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"
      ] }) })
    ] })
  ] });
}
export {
  BotSettingsPage as component
};
