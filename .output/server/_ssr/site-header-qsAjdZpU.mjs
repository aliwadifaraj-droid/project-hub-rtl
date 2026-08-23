import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useRouterState, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, g as getMe } from "./router-pxcAI1C5.mjs";
import { b as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as countMyUnreadNotifications, l as listMyNotifications, m as markNotificationRead, a as markAllNotificationsRead } from "./notifications.functions-DOWRu_2x.mjs";
import { c as countUnreadTeamMessages } from "./chat.functions-DMnGOKTk.mjs";
import { B as Building2, d as Megaphone, e as ClipboardList, f as MessagesSquare, g as Bell } from "../_libs/lucide-react.mjs";
const CHAT_SEEN_KEY = "team_chat_last_seen";
function SiteHeader() {
  const [signedIn, setSignedIn] = reactExports.useState(false);
  const [open, setOpen] = reactExports.useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const countUnread = useServerFn(countMyUnreadNotifications);
  const listNotifs = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAllRead = useServerFn(markAllNotificationsRead);
  const fetchMe = useServerFn(getMe);
  const countChatFn = useServerFn(countUnreadTeamMessages);
  reactExports.useEffect(() => {
    let mounted = true;
    fetchMe().then((me) => {
      if (mounted) setSignedIn(!!me);
    }).catch(() => {
      if (mounted) setSignedIn(false);
    });
    return () => {
      mounted = false;
    };
  }, [fetchMe, path]);
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notif-unread-count"],
    queryFn: () => countUnread(),
    enabled: signedIn,
    refetchInterval: 3e4
  });
  const { data: notifs } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => listNotifs(),
    enabled: signedIn && open
  });
  const { data: chatUnread = 0, refetch: refetchChat } = useQuery({
    queryKey: ["chat-unread-count"],
    queryFn: async () => {
      const since = typeof window !== "undefined" ? localStorage.getItem(CHAT_SEEN_KEY) : null;
      const res = await countChatFn({ data: { since } });
      return res.count;
    },
    enabled: signedIn
  });
  async function toggle(next) {
    setOpen(next);
    if (next && unreadCount > 0) {
      await markAllRead();
      qc.invalidateQueries({ queryKey: ["notif-unread-count"] });
    }
  }
  function handleChatClick() {
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_SEEN_KEY, (/* @__PURE__ */ new Date()).toISOString());
    }
    qc.setQueryData(["chat-unread-count"], 0);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto flex h-16 items-center justify-between px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 font-bold text-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "العمران" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex items-center gap-1 sm:gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/projects",
          className: "rounded-md px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground",
          children: "المشاريع"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/ads",
          className: "inline-flex items-center gap-1 rounded-md px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-4 w-4" }),
            " الإعلانات"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/my-requests",
          className: "inline-flex items-center gap-1 rounded-md px-2 sm:px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-4 w-4" }),
            " طلباتي"
          ]
        }
      ),
      signedIn && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/admin/chat",
          onClick: handleChatClick,
          "aria-label": "شات الفريق",
          className: `relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${chatUnread > 0 ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-background hover:bg-secondary"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessagesSquare, { className: "h-4 w-4" }),
            chatUnread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground", children: chatUnread > 99 ? "99+" : chatUnread })
          ]
        }
      ),
      signedIn && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => toggle(!open),
            "aria-label": "إشعاراتي",
            className: `relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${unreadCount > 0 ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-background hover:bg-secondary"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
              unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground", children: unreadCount > 99 ? "99+" : unreadCount })
            ]
          }
        ),
        open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border px-3 py-2 text-sm font-semibold", children: "إشعاراتي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-96 overflow-auto", children: (notifs ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-center text-xs text-muted-foreground", children: "لا توجد إشعارات" }) : (notifs ?? []).map((n) => {
            const content = /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `border-b border-border px-3 py-2 text-xs hover:bg-secondary ${n.read ? "" : "bg-primary/5"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: n.title }),
              n.body ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-muted-foreground", children: n.body }) : null,
              n.link ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[11px] text-primary underline", children: "عرض المنشور" }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[10px] text-muted-foreground", children: new Date(n.created_at).toLocaleString("ar") })
            ] });
            return n.link ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: n.link,
                onClick: async () => {
                  await markRead({ data: { id: n.id } });
                  qc.invalidateQueries({ queryKey: ["my-notifications"] });
                  setOpen(false);
                },
                className: "block",
                children: content
              },
              n.id
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: content }, n.id);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/contact",
          className: "rounded-md bg-foreground px-3 sm:px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90",
          children: "تواصل بنا"
        }
      )
    ] })
  ] }) });
}
export {
  SiteHeader as S
};
