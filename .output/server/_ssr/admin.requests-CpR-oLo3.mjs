import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, ac as getPlatformRequests, ad as updateRequestStatus, ae as getBidPdfUrl, k as getMyRoles, af as adminListProjectOfferToggles, ag as adminSetProjectOffersEnabled, ah as adminSetAllProjectOffersEnabled, ai as adminSetProjectBotOffersEnabled, aj as adminSetAllProjectBotOffersEnabled, ak as sendRequestMessage } from "./router-pxcAI1C5.mjs";
import { b as useQueryClient, u as useQuery, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as adminBlockCompany } from "./blocked.functions-B0hy_Vq2.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { L as LoaderCircle, g as Bell, G as FileDown, j as Mail, $ as Ban, a2 as ToggleRight, a3 as ToggleLeft, u as Bot, a4 as BotOff, X } from "../_libs/lucide-react.mjs";

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
const STATUS = {
  pending: {
    label: "قيد الانتظار",
    cls: "bg-gray-500/15 text-gray-700 dark:text-gray-300"
  },
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
function RequestsPage() {
  const list = useServerFn(getPlatformRequests);
  const update = useServerFn(updateRequestStatus);
  const getUrl = useServerFn(getBidPdfUrl);
  const getRoles = useServerFn(getMyRoles);
  const qc = useQueryClient();
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["platform-requests"],
    queryFn: () => list()
  });
  const {
    data: roles
  } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles()
  });
  const isAdmin = roles?.includes("admin");
  const [msgTarget, setMsgTarget] = reactExports.useState(null);
  const [noteTarget, setNoteTarget] = reactExports.useState(null);
  const blockFn = useServerFn(adminBlockCompany);
  const blockMut = useMutation({
    mutationFn: (v) => blockFn({
      data: v
    }),
    onSuccess: () => {
      toast.success("تم حظر الشركة");
      qc.invalidateQueries({
        queryKey: ["platform-requests"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const mut = useMutation({
    mutationFn: (v) => update({
      data: v
    }),
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      setNoteTarget(null);
      qc.invalidateQueries({
        queryKey: ["platform-requests"]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  async function openPdf(path) {
    try {
      const url = await getUrl({
        data: {
          path
        }
      });
      window.open(url, "_blank");
    } catch {
      toast.error("تعذر فتح الملف");
    }
  }
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) });
  const rows = data ?? [];
  const newCount = rows.filter((r) => r.status === "new" || r.status === "pending").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl md:text-2xl font-bold", children: [
        "الطلبات الواردة (",
        rows.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { "aria-label": "طلبات جديدة", className: "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-5 w-5" }),
        newCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -start-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white", children: newCount > 99 ? "99+" : newCount })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-right text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-800 text-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "الشركة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "المشروع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "البريد" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "موقع المنشأة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "التاريخ" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "الحالة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "عرض السعر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "حظر" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-slate-800 hover:bg-slate-800/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: r.company_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 text-slate-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: r.projects?.name ?? "-" }),
              r.submitter_type && /* @__PURE__ */ jsxRuntimeExports.jsx(SubmitterBadge, { type: r.submitter_type })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-300 ltr text-left", dir: "ltr", children: r.email ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:${r.email}`, className: "text-blue-300 hover:underline", children: r.email }) : "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3 text-slate-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: r.facility_location }),
              r.note ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-amber-300", children: [
                "📝 ",
                r.note
              ] }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-400 text-xs", children: new Date(r.created_at).toLocaleDateString("ar") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: isAdmin || r.can_manage ? /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: r.status, onChange: (e) => setNoteTarget({
              id: r.id,
              status: e.target.value,
              note: r.note ?? ""
            }), className: `rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-medium ${STATUS[r.status].cls}`, children: Object.entries(STATUS).map(([k, v]) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: k, className: "bg-slate-800 text-slate-100", children: v.label }, k)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS[r.status].cls}`, children: STATUS[r.status].label }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              isAdmin || r.can_manage ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openPdf(r.pdf_url ?? ""), className: "inline-flex items-center gap-1 rounded-md bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4" }),
                " فتح PDF"
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-slate-700/50 px-2.5 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4" }),
                " غير مصرح"
              ] }),
              (isAdmin || r.can_manage) && r.email ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setMsgTarget({
                email: String(r.email),
                company: String(r.company_name ?? "")
              }), className: "inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4" }),
                " رسالة خاصة"
              ] }) : null
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: blockMut.isPending, onClick: () => blockMut.mutate({
              company_name: r.company_name ?? "",
              email: r.email ?? ""
            }), className: "inline-flex items-center gap-1 rounded-md bg-red-600/80 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-4 w-4" }),
              " حظر"
            ] }) : "-" })
          ] }, r.id)),
          rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 8, className: "p-8 text-center text-slate-400", children: "لا توجد طلبات بعد" }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:hidden divide-y divide-slate-800", children: [
        rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: r.company_name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-slate-400 mt-0.5", children: r.projects?.name ?? "-" }),
              r.submitter_type && /* @__PURE__ */ jsxRuntimeExports.jsx(SubmitterBadge, { type: r.submitter_type })
            ] }),
            isAdmin || r.can_manage ? /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: r.status, onChange: (e) => setNoteTarget({
              id: r.id,
              status: e.target.value,
              note: r.note ?? ""
            }), className: `shrink-0 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-medium ${STATUS[r.status].cls}`, children: Object.entries(STATUS).map(([k, v]) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: k, className: "bg-slate-800 text-slate-100", children: v.label }, k)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS[r.status].cls}`, children: STATUS[r.status].label })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-slate-300", children: [
            "📍 ",
            r.facility_location
          ] }),
          r.note ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-amber-300", children: [
            "📝 ",
            r.note
          ] }) : null,
          r.email && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-slate-300 ltr text-left", dir: "ltr", children: [
            "✉️ ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:${r.email}`, className: "text-blue-300 hover:underline", children: r.email })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-500", children: new Date(r.created_at).toLocaleDateString("ar") }),
            isAdmin || r.can_manage ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openPdf(r.pdf_url ?? ""), className: "inline-flex items-center gap-1 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4" }),
              " فتح PDF"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-md bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4" }),
              " غير مصرح"
            ] })
          ] }),
          (isAdmin || r.can_manage) && r.email ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setMsgTarget({
            email: String(r.email),
            company: String(r.company_name ?? "")
          }), className: "inline-flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4" }),
            " رسالة خاصة"
          ] }) : null
        ] }, r.id)),
        rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-slate-400", children: "لا توجد طلبات بعد" })
      ] })
    ] }),
    isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(OfferTogglesPanel, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BotOfferTogglesPanel, {})
    ] }),
    noteTarget && /* @__PURE__ */ jsxRuntimeExports.jsx(NoteModal, { target: noteTarget, required: !isAdmin, pending: mut.isPending, onClose: () => setNoteTarget(null), onSubmit: (note) => mut.mutate({
      id: noteTarget.id,
      status: noteTarget.status,
      note
    }) }),
    msgTarget && /* @__PURE__ */ jsxRuntimeExports.jsx(MessageModal, { target: msgTarget, onClose: () => setMsgTarget(null) })
  ] });
}
function NoteModal({
  target,
  required,
  pending,
  onClose,
  onSubmit
}) {
  const [note, setNote] = reactExports.useState(target.note ?? "");
  function submit(e) {
    e.preventDefault();
    if (required && !note.trim()) {
      toast.error("الملاحظة إجبارية");
      return;
    }
    onSubmit(note.trim());
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", dir: "rtl", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "ملاحظة تغيير الحالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 text-xs text-slate-400", children: [
          "الحالة الجديدة: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: STATUS[target.status].label }),
          " — ",
          required ? "الملاحظة إجبارية" : "الملاحظة اختيارية"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": "إغلاق", onClick: onClose, className: "rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: note, onChange: (e) => setNote(e.target.value), rows: 5, maxLength: 2e3, placeholder: "اكتب الملاحظة...", className: "w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "الملاحظة تظهر للإدارة وفي رد البوت فقط، ولا تُرسل في بريد العميل." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800", children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: pending, className: "inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60", children: [
          pending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : null,
          " حفظ الحالة"
        ] })
      ] })
    ] })
  ] }) });
}
function OfferTogglesPanel() {
  const listFn = useServerFn(adminListProjectOfferToggles);
  const setOneFn = useServerFn(adminSetProjectOffersEnabled);
  const setAllFn = useServerFn(adminSetAllProjectOffersEnabled);
  const qc = useQueryClient();
  const {
    data: projects = [],
    isLoading
  } = useQuery({
    queryKey: ["project-offer-toggles"],
    queryFn: () => listFn()
  });
  function refresh() {
    qc.invalidateQueries({
      queryKey: ["project-offer-toggles"]
    });
  }
  const toggleOne = useMutation({
    mutationFn: (v) => setOneFn({
      data: v
    }),
    onSuccess: (_d, v) => {
      toast.success(v.enabled ? "تم تفعيل إرسال عرض السعر" : "تم تعطيل إرسال عرض السعر");
      refresh();
    },
    onError: (e) => toast.error(e.message)
  });
  const toggleAll = useMutation({
    mutationFn: (enabled) => setAllFn({
      data: {
        enabled
      }
    }),
    onSuccess: (_d, enabled) => {
      toast.success(enabled ? "تم تفعيل الكل" : "تم تعطيل الكل");
      refresh();
    },
    onError: (e) => toast.error(e.message)
  });
  const busy = toggleOne.isPending || toggleAll.isPending;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base md:text-lg font-bold", children: "التحكم في زر «إرسال عرض سعر»" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: busy, onClick: () => toggleAll.mutate(true), className: "inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleRight, { className: "h-4 w-4" }),
          " تفعيل الكل"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: busy, onClick: () => toggleAll.mutate(false), className: "inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleLeft, { className: "h-4 w-4" }),
          " تعطيل الكل"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "عند التعطيل يختفي زر «إرسال عرض سعر» للعميل في صفحة المشروع ويرفض البوت استلام العروض لهذا المشروع." }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) : projects.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-6 text-center text-sm text-slate-400", children: "لا توجد مشاريع" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 divide-y divide-slate-800", children: projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between gap-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: p.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "switch", "aria-checked": p.offers_enabled, "aria-label": `تشغيل أو إطفاء عرض السعر لمشروع ${p.name}`, disabled: busy, onClick: () => toggleOne.mutate({
        id: p.id,
        enabled: !p.offers_enabled
      }), className: `relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${p.offers_enabled ? "bg-emerald-600" : "bg-slate-600"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute h-5 w-5 rounded-full bg-white transition-all ${p.offers_enabled ? "start-[2px]" : "start-[22px]"}` }) })
    ] }, p.id)) })
  ] });
}
function BotOfferTogglesPanel() {
  const listFn = useServerFn(adminListProjectOfferToggles);
  const setOneFn = useServerFn(adminSetProjectBotOffersEnabled);
  const setAllFn = useServerFn(adminSetAllProjectBotOffersEnabled);
  const qc = useQueryClient();
  const {
    data: projects = [],
    isLoading
  } = useQuery({
    queryKey: ["project-offer-toggles"],
    queryFn: () => listFn()
  });
  function refresh() {
    qc.invalidateQueries({
      queryKey: ["project-offer-toggles"]
    });
  }
  const toggleOne = useMutation({
    mutationFn: (v) => setOneFn({
      data: v
    }),
    onSuccess: (_d, v) => {
      toast.success(v.enabled ? "تم تفعيل استلام البوت للعروض" : "تم تعطيل استلام البوت للعروض");
      refresh();
    },
    onError: (e) => toast.error(e.message)
  });
  const toggleAll = useMutation({
    mutationFn: (enabled) => setAllFn({
      data: {
        enabled
      }
    }),
    onSuccess: (_d, enabled) => {
      toast.success(enabled ? "تم تفعيل الكل - البوت" : "تم تعطيل الكل - البوت");
      refresh();
    },
    onError: (e) => toast.error(e.message)
  });
  const busy = toggleOne.isPending || toggleAll.isPending;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base md:text-lg font-bold", children: "تحكم البوت في استلام عروض الأسعار" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: busy, onClick: () => toggleAll.mutate(true), className: "inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-4 w-4" }),
          " تفعيل الكل - البوت"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: busy, onClick: () => toggleAll.mutate(false), className: "inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BotOff, { className: "h-4 w-4" }),
          " تعطيل الكل - البوت"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "هذا التحكم مستقل عن زر العميل: عند تعطيل مشروع يرفض البوت استلام أي عرض سعر له، وعند «تعطيل الكل» يرفض البوت كل العروض." }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }) }) : projects.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-6 text-center text-sm text-slate-400", children: "لا توجد مشاريع" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 divide-y divide-slate-800", children: projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between gap-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: p.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", role: "switch", "aria-checked": p.bot_offers_enabled, "aria-label": `تشغيل أو إطفاء استلام البوت للعروض لمشروع ${p.name}`, disabled: busy, onClick: () => toggleOne.mutate({
        id: p.id,
        enabled: !p.bot_offers_enabled
      }), className: `relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${p.bot_offers_enabled ? "bg-emerald-600" : "bg-slate-600"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute h-5 w-5 rounded-full bg-white transition-all ${p.bot_offers_enabled ? "start-[2px]" : "start-[22px]"}` }) })
    ] }, p.id)) })
  ] });
}
function SubmitterBadge({
  type
}) {
  const isUser = type === "user";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isUser ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`, children: isUser ? "👤 مستخدم" : "🔔 زائر" });
}
function MessageModal({
  target,
  onClose
}) {
  const send = useServerFn(sendRequestMessage);
  const [message, setMessage] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("اكتب نص الرسالة");
      return;
    }
    setSending(true);
    try {
      await send({
        data: {
          to: target.email,
          message: `الشركة: ${target.company}

${message.trim()}`
        }
      });
      toast.success("تم إرسال الرسالة");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر إرسال الرسالة");
    } finally {
      setSending(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", dir: "rtl", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "رسالة خاصة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 text-xs text-slate-400", children: [
          target.company,
          " — ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { dir: "ltr", children: target.email })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": "إغلاق", onClick: onClose, className: "rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: message, onChange: (e) => setMessage(e.target.value), rows: 6, maxLength: 3e3, placeholder: "اكتب رسالتك هنا...", className: "w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800", children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: sending, className: "inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60", children: [
          sending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4" }),
          " إرسال"
        ] })
      ] })
    ] })
  ] }) });
}
export {
  RequestsPage as component
};
