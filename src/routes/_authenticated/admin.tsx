import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth.functions";
import { getMyRoles, sendTestEmail, countContactMessages } from "@/lib/admin.functions";
import { countPendingAds } from "@/lib/ads.functions";
import { countPendingProjects } from "@/lib/project-approval.functions";
import { listMyNotifications, countMyUnreadNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/notifications.functions";
import { countUnreadTeamMessages } from "@/lib/chat.functions";
import { adminCountOpenSupportChats } from "@/lib/support.functions";
import { testPush } from "@/lib/push-test.functions";
import { getRoleLabel, hasAdminRole } from "@/lib/role-label";
import { Building2, ClipboardList, Users, LogOut, FolderKanban, MessageSquare, UserCircle, MessagesSquare, Megaphone, Bell, ClipboardCheck, Check, Star, Mail, Settings2, Headphones, Bot, Lock, FileText, Eye, Send, GraduationCap } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const TEAM_CHAT_SEEN_KEY = "team_chat_last_seen";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
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
  const doTestPush = useServerFn(testPush);
  const qc = useQueryClient();
  const { data: roles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => getRoles(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const isAdmin = hasAdminRole(roles);
  const primaryRole = isAdmin ? "admin" : roles?.[0];
  const roleLabel = getRoleLabel(primaryRole);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-ads-count"],
    queryFn: () => countPending(),
    enabled: !!roles && roles.length > 0,
    refetchInterval: 30000,
  });
  const { data: pendingProjectsCount = 0 } = useQuery({
    queryKey: ["pending-projects-count"],
    queryFn: () => countPendingProj(),
    enabled: isAdmin,
    refetchInterval: 30000,
  });
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notif-unread-count"],
    queryFn: () => countUnread(),
    enabled: !!roles && roles.length > 0,
    refetchInterval: 30000,
  });
  const { data: teamChatUnread = 0, refetch: refetchTeamChatUnread } = useQuery({
    queryKey: ["chat-unread-count"],
    queryFn: async () => {
      const since = typeof window !== "undefined" ? localStorage.getItem(TEAM_CHAT_SEEN_KEY) : null;
      const res = await countTeamUnread({ data: { since } });
      return res.count;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });
  const { data: supportEscalatedCount = 0, refetch: refetchSupportEscalated } = useQuery({
    queryKey: ["support-escalated-count"],
    queryFn: async () => {
      const res = await countOpenSupport();
      return res.count;
    },
    enabled: !!roles && roles.length > 0,
    refetchInterval: 2000,
  });
  const { data: notifs } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => listNotifs(),
    enabled: notifOpen,
  });

  const CONTACT_SEEN_KEY = "admin_contact_msgs_last_seen";
  const { data: contactUnread = 0, refetch: refetchContact } = useQuery({
    queryKey: ["contact-messages-unread"],
    queryFn: async () => {
      const since = typeof window !== "undefined" ? localStorage.getItem(CONTACT_SEEN_KEY) : null;
      const res = await countContactsFn({ data: { since } });
      return res.count;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  function handleContactBellClick() {
    if (typeof window !== "undefined") {
      localStorage.setItem(CONTACT_SEEN_KEY, new Date().toISOString());
    }
    qc.setQueryData(["contact-messages-unread"], 0);
  }

  function handleTeamChatBellClick() {
    if (typeof window !== "undefined") {
      localStorage.setItem(TEAM_CHAT_SEEN_KEY, new Date().toISOString());
    }
    qc.setQueryData(["chat-unread-count"], 0);
  }

  async function logout() {
    await doSignOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = [
    { to: "/admin/projects", label: "كل المشاريع", icon: FolderKanban, show: true },
    { to: "/admin/requests", label: "الطلبات", icon: ClipboardList, show: true },
    { to: "/admin/messages", label: "الرسائل", icon: MessageSquare, show: isAdmin },
    { to: "/admin/chat", label: "شات الفريق", icon: MessagesSquare, show: isAdmin },
    { to: "/admin/support", label: "دعم العملاء", icon: Headphones, show: true },
    { to: "/admin/bot-training", label: "تدريب البوت", icon: Bot, show: isAdmin },
    { to: "/admin/bot-settings", label: "إعدادات البوت", icon: Settings2, show: isAdmin },
    { to: "/admin/groq-settings", label: "إعدادات Groq", icon: Bot, show: isAdmin },
    { to: "/admin/bot-test", label: "تجربة البوت", icon: Bot, show: isAdmin },
    { to: "/admin/pending-projects", label: "موافقات المشاريع", icon: ClipboardCheck, show: isAdmin },
    { to: "/admin/users", label: "المستخدمون", icon: UserCircle, show: isAdmin },
    { to: "/admin/employees", label: "المستخدمون", icon: Users, show: isAdmin },
    { to: "/admin/clients", label: "متابعة العملاء", icon: Eye, show: isAdmin },
    { to: "/admin/exclusivity", label: "الحصرية", icon: Lock, show: isAdmin },
    { to: "/admin/vip", label: "العملاء المميزون", icon: Star, show: isAdmin },
    { to: "/admin/teacher-market", label: "حراج المعلمين", icon: GraduationCap, show: isAdmin },
    { to: "/admin/settings", label: "الإعدادات", icon: Settings2, show: isAdmin },
  ];

  async function openNotif(open: boolean) {
    setNotifOpen(open);
    if (open) {
      refetchSupportEscalated();
    }
  }

  useEffect(() => {
    if (path === "/admin" || path === "/admin/") {
      navigate({ to: "/admin/projects", replace: true });
    }
  }, [path, navigate]);

  const visibleItems = items.filter((i) => i.show);
  const supportCount = supportEscalatedCount;
  const contactCount = contactUnread;
  const teamCount = teamChatUnread;
  const escalationsBadge = supportCount > 0 ? supportCount : null;

  return (
    <div className="flex min-h-screen flex-col bg-secondary/20" dir="rtl">
      <Toaster position="top-center" richColors />
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/projects" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="hidden text-lg font-bold sm:inline-block">لوحة التحكم</span>
            </Link>
            {roleLabel && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {roleLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openNotif(true)}
              className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              title="الإشعارات"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isAdmin && (
              <Link
                to="/admin/messages"
                onClick={handleContactBellClick}
                className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="رسائل التواصل"
              >
                <Mail className="h-5 w-5" />
                {contactCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {contactCount > 9 ? "9+" : contactCount}
                  </span>
                )}
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/chat"
                onClick={handleTeamChatBellClick}
                className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="شات الفريق"
              >
                <MessagesSquare className="h-5 w-5" />
                {teamCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {teamCount > 9 ? "9+" : teamCount}
                  </span>
                )}
              </Link>
            )}

            <Link
              to="/admin/support"
              className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              title="دعم العملاء"
            >
              <Headphones className="h-5 w-5" />
              {escalationsBadge && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {escalationsBadge > 9 ? "9+" : escalationsBadge}
                </span>
              )}
            </Link>

            {isAdmin && (
              <button
                onClick={() => doTestPush().then(() => toast.success("تم إرسال إشعار تجريبي"))}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="إشعار تجريبي"
              >
                <Send className="h-5 w-5" />
              </button>
            )}

n            <button
              onClick={logout}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              title="تسجيل الخروج"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-64 shrink-0 border-l border-border bg-background md:block">
          <ul className="space-y-1 p-3">
            {visibleItems.map((item) => {
              const active = path === item.to || path.startsWith(item.to + "/");
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[image:var(--gradient-accent)] text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background md:hidden">
          <ul className="flex overflow-x-auto gap-1 p-2">
            {visibleItems.map((item) => {
              const active = path === item.to || path.startsWith(item.to + "/");
              return (
                <li key={item.to} className="shrink-0">
                  <Link
                    to={item.to}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "bg-[image:var(--gradient-accent)] text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {notifOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end bg-black/20 p-4"
          onClick={() => openNotif(false)}
        >
          <div
            className="mt-16 w-full max-w-sm rounded-xl border border-border bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-3">
              <h3 className="font-bold">الإشعارات</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => markAllRead().then(() => qc.invalidateQueries({ queryKey: ["my-notifications"] }))}
                  className="text-xs text-primary hover:underline"
                >
                  تعليم الكل كمقروء
                </button>
                <button onClick={() => openNotif(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifs && notifs.length > 0 ? (
                notifs.map((n: any) => (
                  <div
                    key={n.id}
                    className={`border-b border-border p-3 ${n.read ? "bg-background" : "bg-secondary/30"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => {
                              markRead({ data: { id: n.id } });
                              openNotif(false);
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            عرض
                          </Link>
                        )}
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markRead({ data: { id: n.id } }).then(() => qc.invalidateQueries({ queryKey: ["my-notifications"] }))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-6 text-center text-sm text-muted-foreground">لا توجد إشعارات</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
