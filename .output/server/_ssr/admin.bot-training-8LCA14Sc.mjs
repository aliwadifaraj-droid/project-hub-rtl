import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, Q as adminListBotQa, S as adminUpsertBotQa, T as adminDeleteBotQa } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { u as Bot, m as Plus, X, N as Save, T as Trash2 } from "../_libs/lucide-react.mjs";

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
const ACTION_LABEL = {
  none: "بدون",
  escalate: "تحويل لموظف"
};
function BotTrainingPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListBotQa);
  const upsertFn = useServerFn(adminUpsertBotQa);
  const delFn = useServerFn(adminDeleteBotQa);
  const {
    data: rows = [],
    isLoading
  } = useQuery({
    queryKey: ["admin-bot-qa"],
    queryFn: () => listFn()
  });
  const [editing, setEditing] = reactExports.useState(null);
  const editorRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (editing && editorRef.current) {
      editorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      const first = editorRef.current.querySelector("input,textarea");
      first?.focus();
    }
  }, [editing?.id, editing && !editing.id]);
  function startNew() {
    setEditing({
      question: "",
      answer: "",
      keywords: [],
      is_active: true,
      sort_order: (rows.length + 1) * 10,
      action: "none"
    });
  }
  async function save() {
    if (!editing) return;
    const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, "");
    const newKeywords = (editing.keywords ?? []).map(normalize).filter(Boolean);
    for (const row of rows) {
      if (editing.id && row.id === editing.id) continue;
      const existing = (Array.isArray(row.keywords) ? row.keywords : []).map(normalize);
      for (let i = 0; i < newKeywords.length; i++) {
        if (existing.includes(newKeywords[i])) {
          toast.error(`خطأ: كلمة [${(editing.keywords ?? [])[i]}] موجودة في سؤال [${row.question}]. غيرها`);
          return;
        }
      }
    }
    try {
      await upsertFn({
        data: {
          id: editing.id ?? null,
          question: editing.question ?? "",
          answer: editing.answer ?? "",
          keywords: editing.keywords ?? [],
          is_active: editing.is_active ?? true,
          sort_order: editing.sort_order ?? 0,
          action: editing.action ?? "none"
        }
      });
      setEditing(null);
      qc.invalidateQueries({
        queryKey: ["admin-bot-qa"]
      });
      toast.success("تم الحفظ");
    } catch (err) {
      toast.error(err?.message ?? "تعذر الحفظ");
    }
  }
  async function remove(id) {
    if (!confirm("حذف هذا السؤال؟")) return;
    await delFn({
      data: {
        id
      }
    });
    qc.invalidateQueries({
      queryKey: ["admin-bot-qa"]
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "تدريب البوت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "أضف أسئلة وأجوبة يستخدمها البوت مع العملاء" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: startNew, className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " إضافة سؤال"
      ] })
    ] }),
    editing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: editorRef, className: "mb-4 rounded-xl border border-border bg-background p-4 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold", children: editing.id ? "تعديل سؤال" : "سؤال جديد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditing(null), className: "text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "السؤال" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: editing.question ?? "", onChange: (e) => setEditing({
            ...editing,
            question: e.target.value
          }), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "الإجابة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 4, value: editing.answer ?? "", onChange: (e) => setEditing({
            ...editing,
            answer: e.target.value
          }), className: "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "كلمات مفتاحية (مفصولة بفاصلة)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: (editing.keywords ?? []).join(", "), onChange: (e) => setEditing({
            ...editing,
            keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
          }), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs font-semibold", children: "الإجراء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: editing.action ?? "none", onChange: (e) => setEditing({
            ...editing,
            action: e.target.value
          }), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "none", children: "بدون" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "escalate", children: "تحويل لموظف" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-muted-foreground", children: 'عند اختيار "تحويل لموظف": البوت يرد أول مرة بطلب التوضيح، وعند تكرار العميل يتم التحويل فوراً.' })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: editing.is_active ?? true, onChange: (e) => setEditing({
              ...editing,
              is_active: e.target.checked
            }) }),
            "مفعل"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs", children: [
            "الترتيب:",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", value: editing.sort_order ?? 0, onChange: (e) => setEditing({
              ...editing,
              sort_order: parseInt(e.target.value || "0")
            }), className: "w-20 rounded-md border border-input bg-background px-2 py-1 text-sm" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditing(null), className: "rounded-md border border-border px-3 py-1.5 text-sm", children: "إلغاء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: save, className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
            " حفظ"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-background", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-4 text-center text-sm text-muted-foreground", children: "جاري التحميل…" }) : rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-4 text-center text-sm text-muted-foreground", children: "لا توجد أسئلة بعد" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-right text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-secondary/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "السؤال" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "الإجابة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "الحالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "الإجراء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3", children: "إجراء" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: r.question }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-muted-foreground line-clamp-2 max-w-md", children: r.answer }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] ${r.is_active ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`, children: r.is_active ? "مفعل" : "معطل" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] ${r.action === "escalate" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`, children: ACTION_LABEL[r.action ?? "none"] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditing({
            id: r.id,
            question: r.question,
            answer: r.answer,
            keywords: Array.isArray(r.keywords) ? [...r.keywords] : [],
            is_active: r.is_active,
            sort_order: r.sort_order,
            action: r.action ?? "none"
          }), className: "rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary", children: "تعديل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => remove(r.id), className: "inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }),
            " حذف"
          ] })
        ] }) })
      ] }, r.id)) })
    ] }) })
  ] });
}
export {
  BotTrainingPage as component
};
