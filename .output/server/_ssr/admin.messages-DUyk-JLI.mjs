import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, a3 as adminListMessages, a4 as adminDeleteContactMessage, a5 as adminReplyContactMessage, a6 as adminSendCustomEmail } from "./router-pxcAI1C5.mjs";
import { b as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { B as Button, c as cn } from "./button-DjOZMqFS.mjs";
import { D as Dialog$1, a as DialogPortal$1, b as DialogContent$1, c as DialogClose, d as DialogTitle$1, e as DialogOverlay$1, f as DialogDescription$1 } from "../_libs/radix-ui__react-dialog.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { L as LoaderCircle, g as Bell, T as Trash2, C as CircleCheck, S as Send, j as Mail, X } from "../_libs/lucide-react.mjs";

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
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-effect-event+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/tslib.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
const Dialog = Dialog$1;
const DialogPortal = DialogPortal$1;
const DialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  DialogOverlay$1,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogOverlay$1.displayName;
const DialogContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent$1,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogClose, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogContent$1.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props });
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  DialogTitle$1,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = DialogTitle$1.displayName;
const DialogDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  DialogDescription$1,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogDescription$1.displayName;
function MessagesPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListMessages);
  const delFn = useServerFn(adminDeleteContactMessage);
  const replyFn = useServerFn(adminReplyContactMessage);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: () => list()
  });
  const [replyText, setReplyText] = reactExports.useState({});
  const [sending, setSending] = reactExports.useState({});
  const [showNewMessageModal, setShowNewMessageModal] = reactExports.useState(false);
  const [newMsg, setNewMsg] = reactExports.useState({
    to: "",
    subject: "",
    message: ""
  });
  const [sendingNew, setSendingNew] = reactExports.useState(false);
  const sendNewEmailFn = useServerFn(adminSendCustomEmail);
  async function handleSendNewEmail(e) {
    e.preventDefault();
    setSendingNew(true);
    try {
      await sendNewEmailFn({
        data: {
          to: newMsg.to,
          subject: newMsg.subject,
          message: newMsg.message
        }
      });
      toast.success("تم ارسال الايميل بنجاح");
      setShowNewMessageModal(false);
      setNewMsg({
        to: "",
        subject: "",
        message: ""
      });
    } catch (err) {
      toast.error(err?.message ?? "تعذر إرسال الإيميل");
    } finally {
      setSendingNew(false);
    }
  }
  async function handleDelete(id) {
    if (!confirm("هل تريد حذف هذه الرسالة؟")) return;
    try {
      await delFn({
        data: {
          id
        }
      });
      qc.invalidateQueries({
        queryKey: ["admin-messages"]
      });
      toast.success("تم حذف الرسالة");
    } catch (err) {
      toast.error(err?.message ?? "تعذر الحذف");
    }
  }
  async function handleReply(id) {
    const text = (replyText[id] ?? "").trim();
    if (!text) {
      toast.error("اكتب الرد أولاً");
      return;
    }
    setSending((s) => ({
      ...s,
      [id]: true
    }));
    try {
      await replyFn({
        data: {
          id,
          reply: text
        }
      });
      toast.success("تم إرسال الرد بنجاح");
      setReplyText((r) => ({
        ...r,
        [id]: ""
      }));
      qc.invalidateQueries({
        queryKey: ["admin-messages"]
      });
    } catch (err) {
      toast.error(err?.message ?? "تعذر إرسال الرد");
    } finally {
      setSending((s) => ({
        ...s,
        [id]: false
      }));
    }
  }
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin" }) });
  const rows = data ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl md:text-2xl font-bold", children: "الرسائل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowNewMessageModal(true), children: "إرسال رسالة جديدة" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { "aria-label": "إشعارات الرسائل", className: "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-5 w-5" }),
        rows.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -start-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white", children: rows.length > 99 ? "99+" : rows.length })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-right text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-800 text-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "الاسم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "الإيميل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "الرسالة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "التاريخ" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 font-semibold", children: "إجراء" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          rows.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-slate-800 hover:bg-slate-800/50 align-top", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 font-medium", children: m.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:${m.email}`, className: "text-sky-400 hover:underline", children: m.email }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-300 max-w-md whitespace-pre-wrap", children: m.message }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-slate-400 text-xs whitespace-nowrap", children: new Date(m.created_at).toLocaleDateString("ar") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleDelete(m.id), className: "inline-flex items-center gap-1 rounded-md bg-red-600/20 px-2 py-1 text-xs text-red-300 hover:bg-red-600/30", "aria-label": "حذف", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
                " حذف"
              ] }) })
            ] }, m.id),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-t border-slate-800/50 bg-slate-900/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "p-3", children: m.reply ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-emerald-400", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "تم الرد في ",
                  m.replied_at ? new Date(m.replied_at).toLocaleDateString("ar") : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3 text-sm text-slate-300 whitespace-pre-wrap", children: m.reply })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: replyText[m.id] ?? "", onChange: (e) => setReplyText((r) => ({
                ...r,
                [m.id]: e.target.value
              })), placeholder: "اكتب الرد هنا...", rows: 3, className: "w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleReply(m.id), disabled: sending[m.id], className: "inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition", children: sending[m.id] ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
                " جارٍ الإرسال..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
                " إرسال الرد"
              ] }) })
            ] }) }) }, m.id + "-reply")
          ] })),
          rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "p-8 text-center text-slate-400", children: "لا توجد رسائل بعد" }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:hidden divide-y divide-slate-800", children: [
        rows.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: m.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-500 shrink-0", children: new Date(m.created_at).toLocaleDateString("ar") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `mailto:${m.email}`, className: "block text-sm text-sky-400 hover:underline", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "inline h-3.5 w-3.5 ml-1" }),
            m.email
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-300 whitespace-pre-wrap", children: m.message }),
          m.reply ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-emerald-400", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "تم الرد في ",
                m.replied_at ? new Date(m.replied_at).toLocaleDateString("ar") : ""
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3 text-sm text-slate-300 whitespace-pre-wrap", children: m.reply })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: replyText[m.id] ?? "", onChange: (e) => setReplyText((r) => ({
              ...r,
              [m.id]: e.target.value
            })), placeholder: "اكتب الرد هنا...", rows: 3, className: "w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleReply(m.id), disabled: sending[m.id], className: "inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition", children: sending[m.id] ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
              " جارٍ الإرسال..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
              " إرسال الرد"
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleDelete(m.id), className: "inline-flex items-center gap-1 rounded-md bg-red-600/20 px-2 py-1 text-xs text-red-300 hover:bg-red-600/30", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
            " حذف"
          ] })
        ] }, m.id)),
        rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-slate-400", children: "لا توجد رسائل بعد" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showNewMessageModal, onOpenChange: setShowNewMessageModal, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "إرسال رسالة جديدة" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSendNewEmail, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", name: "to", placeholder: "ايميل المستلم", required: true, value: newMsg.to, onChange: (e) => setNewMsg((s) => ({
          ...s,
          to: e.target.value
        })), className: "w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", name: "subject", placeholder: "الموضوع", required: true, value: newMsg.subject, onChange: (e) => setNewMsg((s) => ({
          ...s,
          subject: e.target.value
        })), className: "w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { name: "message", placeholder: "نص الرسالة", required: true, rows: 5, value: newMsg.message, onChange: (e) => setNewMsg((s) => ({
          ...s,
          message: e.target.value
        })), className: "w-full resize-y rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setShowNewMessageModal(false), disabled: sendingNew, children: "إلغاء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: sendingNew, children: sendingNew ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
            " جارٍ الإرسال..."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
            " إرسال"
          ] }) })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  MessagesPage as component
};
