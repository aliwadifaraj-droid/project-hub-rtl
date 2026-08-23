import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, d as useRouterState, L as Link, O as Outlet } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, k as getMyRoles, m as countPendingAds, n as adminCountOpenSupportChats, o as signOut, q as countContactMessages, h as hasAdminRole, t as sendTestEmail, v as getRoleLabel } from "./router-CtQuP2fc.mjs";
import { b as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as countPendingProjects } from "./project-approval.functions-CkN3ZsAt.mjs";
import { c as countMyUnreadNotifications, l as listMyNotifications, m as markNotificationRead, a as markAllNotificationsRead } from "./notifications.functions-mf2-5xG4.mjs";
import { c as countUnreadTeamMessages } from "./chat.functions-DV_-1jmL.mjs";
import { T as Toaster } from "./sonner-DeNSN9-c.mjs";
import { t as toast } from "../_libs/sonner.mjs";

import "../_libs/seroval.mjs";
import "../_libs/bcryptjs.mjs";
import "../_libs/libsql__isomorphic-ws.mjs";
import "../_libs/libsql__hrana-client.mjs";
import "../_libs/promise-limit.mjs";
import "../_libs/aws4fetch.mjs";
import { B as Building2, g as Bell, d as Megaphone, f as MessagesSquare, H as Headphones, k as MessageSquare, j as Mail, s as LogOut, t as FolderKanban, e as ClipboardList, u as Bot, v as Settings2, w as ClipboardCheck, x as CircleUser, y as Users, h as Lock, a as Star } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
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
const TEAM_CHAT_SEEN_KEY = "team_chat_last_seen";
function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({
    select: (s) => s.location.pathname
  });
  const getRoles = useServerFn(getMyRoles);
  const countPending = useServerFn(countPendingAds);
  const countPendingProj = useServerFn(countPendingProjects);
  const countUnread = useServerFn(countMyUnreadNotifications);
  const countTeamUnread = useServerFn(countUnreadTeamMessages);
  const countOpenSupport = useServerFn(adminCountOpenSupportChats);
  const doSignOut = useServerFn(signOut);
  const listNotifs = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAllRead = useServerFn(markAllNotificationsRead);
  const countContactsFn = useServerFn(countContactMessages);
  const qc = useQueryClient();
  const {
    data: roles
  } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true
  });
  const isAdmin = hasAdminRole(roles);
  const primaryRole = isAdmin ? "admin" : roles?.[0];
  const roleLabel = getRoleLabel(primaryRole);
  const [notifOpen, setNotifOpen] = reactExports.useState(false);
  const {
    data: pendingCount = 0
  } = useQuery({
    queryKey: ["pending-ads-count"],
    queryFn: () => countPending(),
    enabled: !!roles && roles.length > 0,
    refetchInterval: 3e4
  });
  const {
    data: pendingProjectsCount = 0
  } = useQuery({
    queryKey: ["pending-projects-count"],
    queryFn: () => countPendingProj(),
    enabled: isAdmin,
    refetchInterval: 3e4
  });
  const {
    data: unreadCount = 0
  } = useQuery({
    queryKey: ["notif-unread-count"],
    queryFn: () => countUnread(),
    enabled: !!roles && roles.length > 0,
    refetchInterval: 3e4
  });
  const {
    data: teamChatUnread = 0,
    refetch: refetchTeamChatUnread
  } = useQuery({
    queryKey: ["chat-unread-count"],
    queryFn: async () => {
      const since = typeof window !== "undefined" ? localStorage.getItem(TEAM_CHAT_SEEN_KEY) : null;
      const res = await countTeamUnread({
        data: {
          since
        }
      });
      return res.count;
    },
    enabled: !!roles && roles.length > 0,
    refetchInterval: 3e4
  });
  const {
    data: supportEscalatedCount = 0,
    refetch: refetchSupportEscalated
  } = useQuery({
    queryKey: ["support-escalated-count"],
    queryFn: async () => {
      const res = await countOpenSupport();
      return res.count;
    },
    enabled: !!roles && roles.length > 0,
    refetchInterval: 15e3
  });
  const {
    data: notifs
  } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => listNotifs(),
    enabled: notifOpen
  });
  const CONTACT_SEEN_KEY = "admin_contact_msgs_last_seen";
  const {
    data: contactUnread = 0,
    refetch: refetchContact
  } = useQuery({
    queryKey: ["contact-messages-unread"],
    queryFn: async () => {
      const since = typeof window !== "undefined" ? localStorage.getItem(CONTACT_SEEN_KEY) : null;
      const res = await countContactsFn({
        data: {
          since
        }
      });
      return res.count;
    },
    enabled: isAdmin,
    refetchInterval: 3e4
  });
  function handleContactBellClick() {
    if (typeof window !== "undefined") {
      localStorage.setItem(CONTACT_SEEN_KEY, (/* @__PURE__ */ new Date()).toISOString());
    }
    qc.setQueryData(["contact-messages-unread"], 0);
  }
  function handleTeamChatBellClick() {
    if (typeof window !== "undefined") {
      localStorage.setItem(TEAM_CHAT_SEEN_KEY, (/* @__PURE__ */ new Date()).toISOString());
    }
    qc.setQueryData(["chat-unread-count"], 0);
  }
  async function logout() {
    await doSignOut();
    navigate({
      to: "/auth",
      replace: true
    });
  }
  const items = [{
    to: "/admin/projects",
    label: "كل المشاريع",
    icon: FolderKanban,
    show: true
  }, {
    to: "/admin/requests",
    label: "الطلبات",
    icon: ClipboardList,
    show: true
  }, {
    to: "/admin/messages",
    label: "الرسائل",
    icon: MessageSquare,
    show: isAdmin
  }, {
    to: "/admin/chat",
    label: "شات الفريق",
    icon: MessagesSquare,
    show: true
  }, {
    to: "/admin/support",
    label: "دعم العملاء",
    icon: Headphones,
    show: true
  }, {
    to: "/admin/bot-training",
    label: "تدريب البوت",
    icon: Bot,
    show: isAdmin
  }, {
    to: "/admin/bot-settings",
    label: "إعدادات البوت",
    icon: Settings2,
    show: isAdmin
  }, {
    to: "/admin/groq-settings",
    label: "إعدادات Groq",
    icon: Bot,
    show: isAdmin
  }, {
    to: "/admin/bot-test",
    label: "تجربة البوت",
    icon: Bot,
    show: isAdmin
  }, {
    to: "/admin/pending-projects",
    label: "موافقات المشاريع",
    icon: ClipboardCheck,
    show: isAdmin
  }, {
    to: "/admin/users",
    label: "المستخدمون",
    icon: CircleUser,
    show: isAdmin
  }, {
    to: "/admin/employees",
    label: "المستخدمون",
    icon: Users,
    show: isAdmin
  }, {
    to: "/admin/exclusivity",
    label: "الحصرية",
    icon: Lock,
    show: isAdmin
  }, {
    to: "/admin/vip",
    label: "العملاء المميزون",
    icon: Star,
    show: isAdmin
  }, {
    to: "/admin/settings",
    label: "الإعدادات",
    icon: Settings2,
    show: isAdmin
  }];
  async function openNotif(open) {
    setNotifOpen(open);
    if (open && unreadCount > 0) {
      await markAllRead();
      qc.invalidateQueries({
        queryKey: ["notif-unread-count"]
      });
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-secondary/30", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-center", dir: "rtl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "border-b border-border bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto flex h-16 items-center justify-between px-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin", className: "flex items-center gap-2 font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5" }) }),
          "لوحة التحكم"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openNotif(!notifOpen), "aria-label": "إشعاراتي", className: `relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${unreadCount > 0 ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-border bg-background hover:bg-secondary"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
              unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground", children: unreadCount > 99 ? "99+" : unreadCount })
            ] }),
            notifOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border px-3 py-2 text-sm font-semibold", children: "إشعاراتي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-96 overflow-auto", children: (notifs ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 text-center text-xs text-muted-foreground", children: "لا توجد إشعارات" }) : (notifs ?? []).map((n) => {
                const Wrapper = ({
                  children
                }) => n.link ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: n.link, onClick: async () => {
                  await markRead({
                    data: {
                      id: n.id
                    }
                  });
                  qc.invalidateQueries({
                    queryKey: ["my-notifications"]
                  });
                  setNotifOpen(false);
                }, className: "block", children }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children });
                return /* @__PURE__ */ jsxRuntimeExports.jsx(Wrapper, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `border-b border-border px-3 py-2 text-xs hover:bg-secondary ${n.read ? "" : "bg-primary/5"}`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: n.title }),
                  n.body ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-muted-foreground", children: n.body }) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[10px] text-muted-foreground", children: new Date(n.created_at).toLocaleString("ar") })
                ] }) }, n.id);
              }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/ads", "aria-label": "الإعلانات المعلقة", className: `relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${pendingCount > 0 ? "border-destructive bg-destructive text-destructive-foreground animate-pulse hover:bg-destructive/90" : "border-border bg-background hover:bg-secondary"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Megaphone, { className: "h-4 w-4" }),
            pendingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-destructive-foreground", children: pendingCount > 99 ? "99+" : pendingCount })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/chat", onClick: handleTeamChatBellClick, "aria-label": "رسائل شات الفريق", title: "رسائل شات الفريق", className: `relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${teamChatUnread > 0 ? "border-primary bg-primary text-primary-foreground animate-pulse hover:bg-primary/90" : "border-border bg-background hover:bg-secondary"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessagesSquare, { className: "h-4 w-4" }),
            teamChatUnread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground", children: teamChatUnread > 99 ? "99+" : teamChatUnread })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/support", "aria-label": "دعم العملاء - محادثات محوَّلة", title: "عملاء بحاجة إلى موظف", className: `relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${supportEscalatedCount > 0 ? "border-destructive bg-destructive text-destructive-foreground animate-pulse hover:bg-destructive/90" : "border-border bg-background hover:bg-secondary"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Headphones, { className: "h-4 w-4" }),
            supportEscalatedCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-destructive-foreground", children: supportEscalatedCount > 99 ? "99+" : supportEscalatedCount })
          ] }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/messages", onClick: handleContactBellClick, "aria-label": "رسائل التواصل", title: "رسائل التواصل", className: `relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${contactUnread > 0 ? "border-destructive bg-destructive text-destructive-foreground animate-pulse hover:bg-destructive/90" : "border-border bg-background hover:bg-secondary"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4" }),
            contactUnread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-destructive-foreground", children: contactUnread > 99 ? "99+" : contactUnread })
          ] }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: async () => {
            const to = window.prompt("أدخل البريد لإرسال بريد تجريبي:", "");
            if (!to) return;
            const tId = toast.loading("جارٍ إرسال البريد التجريبي...");
            try {
              const r = await sendTestEmail({
                data: {
                  to
                }
              });
              toast.success(`تم الإرسال بنجاح إلى ${r.to}${r.id ? ` (ID: ${r.id})` : ""}`, {
                id: tId
              });
            } catch (e) {
              toast.error(`فشل الإرسال: ${e?.message ?? "خطأ غير معروف"}`, {
                id: tId,
                duration: 8e3
              });
            }
          }, "aria-label": "إرسال بريد تجريبي", title: "إرسال بريد تجريبي", className: "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium", children: roleLabel }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: logout, className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
            " خروج"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "container mx-auto flex gap-1 overflow-x-auto px-2 pb-2", children: items.filter((i) => i.show).map((i) => {
        const active = path.startsWith(i.to);
        const isAdsItem = i.to === "/admin/ads";
        const isPendingProjItem = i.to === "/admin/pending-projects";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: i.to, className: `relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(i.icon, { className: "h-4 w-4" }),
          " ",
          i.label,
          isAdsItem && pendingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground", children: pendingCount > 99 ? "99+" : pendingCount }),
          i.to === "/admin/chat" && teamChatUnread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground", children: teamChatUnread > 99 ? "99+" : teamChatUnread }),
          i.to === "/admin/support" && supportEscalatedCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse", children: supportEscalatedCount > 99 ? "99+" : supportEscalatedCount }),
          isPendingProjItem && pendingProjectsCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground", children: pendingProjectsCount > 99 ? "99+" : pendingProjectsCount })
        ] }, i.to);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "container mx-auto px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
  ] });
}
export {
  AdminLayout as component
};
