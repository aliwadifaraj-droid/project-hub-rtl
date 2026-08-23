import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, k as getMyRoles, U as getMyUserId, v as getRoleLabel } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { l as listTeamMessages, s as sendTeamMessage, d as deleteTeamMessage, a as deleteAllTeamMessages } from "./chat.functions-DV_-1jmL.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { f as MessagesSquare, T as Trash2, S as Send } from "../_libs/lucide-react.mjs";

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
function TeamChatPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTeamMessages);
  const sendFn = useServerFn(sendTeamMessage);
  const delFn = useServerFn(deleteTeamMessage);
  const delAllFn = useServerFn(deleteAllTeamMessages);
  const rolesFn = useServerFn(getMyRoles);
  const whoami = useServerFn(getMyUserId);
  const {
    data: messages = [],
    isLoading
  } = useQuery({
    queryKey: ["team-messages"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: false
  });
  const {
    data: myRoles = []
  } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => rolesFn()
  });
  const {
    data: me
  } = useQuery({
    queryKey: ["my-user-id"],
    queryFn: () => whoami()
  });
  const isAdmin = myRoles.includes("admin");
  const [body, setBody] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const inputRef = reactExports.useRef(null);
  const bottomRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("team_chat_last_seen", (/* @__PURE__ */ new Date()).toISOString());
      qc.setQueryData(["chat-unread-count"], 0);
    }
  }, [messages.length, qc]);
  reactExports.useEffect(() => {
    inputRef.current?.focus();
  }, []);
  async function handleSend(e) {
    e?.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendFn({
        data: {
          body: text
        }
      });
      setBody("");
      qc.invalidateQueries({
        queryKey: ["team-messages"]
      });
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err?.message ?? "تعذر إرسال الرسالة");
    } finally {
      setSending(false);
    }
  }
  async function handleDelete(id) {
    try {
      await delFn({
        data: {
          id
        }
      });
      qc.invalidateQueries({
        queryKey: ["team-messages"]
      });
    } catch (err) {
      toast.error(err?.message ?? "تعذر حذف الرسالة");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessagesSquare, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "غرفة شات الفريق" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "محادثة مشتركة بين الأدمن وجميع المستخدمين" })
        ] })
      ] }),
      isAdmin && messages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: async () => {
        if (!confirm("حذف جميع رسائل شات الفريق؟ لا يمكن التراجع.")) return;
        try {
          await delAllFn();
          qc.invalidateQueries({
            queryKey: ["team-messages"]
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[calc(100vh-220px)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-3 overflow-y-auto p-4", children: [
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm text-muted-foreground", children: "جاري التحميل…" }) : messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm text-muted-foreground", children: "لا توجد رسائل بعد. ابدأ المحادثة!" }) : messages.map((m) => {
          const mine = m.user_id === me?.userId;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${mine ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `group max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-0.5 flex items-center gap-2 text-[11px] opacity-80", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: m.sender_email }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-background/30 px-1.5 py-0.5 text-[10px]", children: getRoleLabel(m.sender_role) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "·" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(m.created_at).toLocaleString("ar") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "whitespace-pre-wrap break-words", children: m.body }),
            (mine || isAdmin) && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleDelete(m.id), className: "mt-1 inline-flex items-center gap-1 text-[11px] opacity-0 transition group-hover:opacity-80", "aria-label": "حذف", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }),
              " حذف"
            ] })
          ] }) }, m.id);
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: bottomRef })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSend, className: "flex items-end gap-2 border-t border-border bg-secondary/30 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { ref: inputRef, value: body, onChange: (e) => setBody(e.target.value), onKeyDown: (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }, rows: 1, maxLength: 4e3, placeholder: "اكتب رسالتك… (Enter للإرسال، Shift+Enter لسطر جديد)", className: "max-h-32 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: sending || !body.trim(), className: "inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
          " إرسال"
        ] })
      ] })
    ] })
  ] });
}
export {
  TeamChatPage as component
};
