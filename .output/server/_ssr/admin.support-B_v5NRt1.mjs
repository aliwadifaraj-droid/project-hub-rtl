import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, ap as adminListChats, aq as adminListChatMessages, ar as adminReplyChat, as as adminCloseChat, at as adminDeleteAllSupport } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { H as Headphones, T as Trash2, C as CircleCheck, S as Send } from "../_libs/lucide-react.mjs";

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
function AdminSupportPage() {
  const qc = useQueryClient();
  const listChats = useServerFn(adminListChats);
  const listMsgs = useServerFn(adminListChatMessages);
  const reply = useServerFn(adminReplyChat);
  const closeFn = useServerFn(adminCloseChat);
  const delAllFn = useServerFn(adminDeleteAllSupport);
  const [activeId, setActiveId] = reactExports.useState(null);
  const [body, setBody] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const scrollRef = reactExports.useRef(null);
  const {
    data: chats = []
  } = useQuery({
    queryKey: ["admin-support-chats"],
    queryFn: () => listChats(),
    refetchInterval: 5e3
  });
  const {
    data: messages = []
  } = useQuery({
    queryKey: ["admin-support-msgs", activeId],
    queryFn: () => listMsgs({
      data: {
        chatId: activeId
      }
    }),
    enabled: !!activeId,
    refetchInterval: activeId ? 3e3 : false
  });
  reactExports.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages.length, activeId]);
  async function handleSend(e) {
    e?.preventDefault();
    if (!activeId || !body.trim() || sending) return;
    setSending(true);
    try {
      await reply({
        data: {
          chatId: activeId,
          body: body.trim()
        }
      });
      setBody("");
      qc.invalidateQueries({
        queryKey: ["admin-support-msgs", activeId]
      });
    } catch (err) {
      toast.error(err?.message ?? "تعذر الإرسال");
    } finally {
      setSending(false);
    }
  }
  async function handleClose() {
    if (!activeId) return;
    await closeFn({
      data: {
        chatId: activeId
      }
    });
    qc.invalidateQueries({
      queryKey: ["admin-support-chats"]
    });
    toast.success("تم إغلاق المحادثة");
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Headphones, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "دعم العملاء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "كل محادثات العملاء والبوت" })
        ] })
      ] }),
      chats.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: async () => {
        if (!confirm("حذف جميع محادثات ورسائل الدعم؟ لا يمكن التراجع.")) return;
        try {
          await delAllFn();
          setActiveId(null);
          qc.invalidateQueries({
            queryKey: ["admin-support-chats"]
          });
          qc.invalidateQueries({
            queryKey: ["admin-support-msgs"]
          });
          toast.success("تم حذف جميع الرسائل");
        } catch (err) {
          toast.error(err?.message ?? "تعذر الحذف");
        }
      }, className: "inline-flex items-center gap-1.5 rounded-md bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-600/30", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
        " حذف الكل"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid h-[calc(100vh-220px)] min-h-[500px] grid-cols-1 gap-3 md:grid-cols-[280px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-y-auto rounded-xl border border-border bg-background", children: chats.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-4 text-center text-sm text-muted-foreground", children: "لا توجد محادثات" }) : chats.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveId(c.id), className: `block w-full border-b border-border px-3 py-2 text-right text-sm transition ${activeId === c.id ? "bg-secondary" : "hover:bg-secondary/50"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: c.visitor_name || `زائر ${c.id.slice(0, 6)}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-1.5 py-0.5 text-[10px] ${c.status === "escalated" ? "bg-accent text-accent-foreground" : c.status === "closed" ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground"}`, children: c.status === "escalated" ? "بحاجة موظف" : c.status === "closed" ? "مغلق" : "بوت" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[11px] text-muted-foreground", children: new Date(c.last_message_at).toLocaleString("ar") })
      ] }, c.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col overflow-hidden rounded-xl border border-border bg-background", children: !activeId ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid flex-1 place-items-center text-sm text-muted-foreground", children: "اختر محادثة لعرضها" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border bg-secondary/40 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: "المحادثة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleClose, className: "inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-secondary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
            " إغلاق"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: scrollRef, className: "flex-1 space-y-2 overflow-y-auto p-3", children: messages.map((m) => {
          if (m.sender === "system") {
            return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-[80%] rounded-md bg-accent/15 px-3 py-1.5 text-center text-[11px] text-foreground/70", children: m.body }, m.id);
          }
          const isAdminMsg = m.sender === "admin";
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${isAdminMsg ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isAdminMsg ? "bg-primary text-primary-foreground" : m.sender === "bot" ? "bg-secondary" : "bg-background border border-border"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-0.5 text-[10px] font-semibold opacity-70", children: [
              m.sender === "admin" ? "موظف" : m.sender === "bot" ? "بوت" : "عميل",
              " · ",
              new Date(m.created_at).toLocaleString("ar")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "whitespace-pre-wrap break-words", dangerouslySetInnerHTML: {
              __html: m.body
            } })
          ] }) }, m.id);
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSend, className: "flex items-end gap-2 border-t border-border bg-secondary/30 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }, rows: 1, maxLength: 4e3, placeholder: "اكتب ردك…", className: "max-h-32 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: sending || !body.trim(), className: "inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
            " إرسال"
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  AdminSupportPage as component
};
