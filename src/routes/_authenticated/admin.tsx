import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/admin.functions";
import { countPendingAds } from "@/lib/ads.functions";
import { countPendingProjects } from "@/lib/project-approval.functions";
import { listMyNotifications, countMyUnreadNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/notifications.functions";
import { getRoleLabel, hasAdminRole } from "@/lib/role-label";
import { Building2, ClipboardList, Users, LogOut, FolderKanban, MessageSquare, UserCircle, Inbox, MessagesSquare, Megaphone, PlusCircle, Bell, ClipboardCheck, Check, Star } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

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
  const listNotifs = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAllRead = useServerFn(markAllNotificationsRead);
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
  const { data: notifs } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => listNotifs(),
    enabled: notifOpen,
  });

  useEffect(() => {
    if (!roles || roles.length === 0) return;
    const channel = supabase
      .channel("ads-pending-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ads" },
        (payload) => {
          const row = payload.new as { status?: string; title?: string };
          if (row?.status === "pending") {
            toast.message("إعلان جديد بانتظار الموافقة", {
              description: row.title ?? "",
              icon: <Bell className="h-4 w-4" />,
            });
            qc.invalidateQueries({ queryKey: ["pending-ads-count"] });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ads" },
        () => qc.invalidateQueries({ queryKey: ["pending-ads-count"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, roles]);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = [
    { to: "/admin/projects", label: "كل المشاريع", icon: FolderKanban, show: true },
    { to: "/admin/requests", label: "الطلبات", icon: ClipboardList, show: true },
    { to: "/admin/submissions", label: "طلبات إضافة المشاريع", icon: Inbox, show: isAdmin },
    { to: "/admin/messages", label: "الرسائل", icon: MessageSquare, show: isAdmin },
    { to: "/admin/chat", label: "شات الفريق", icon: MessagesSquare, show: true },
    { to: "/admin/pending-projects", label: "موافقات المشاريع", icon: ClipboardCheck, show: isAdmin },
    { to: "/admin/users", label: "المستخدمون", icon: UserCircle, show: isAdmin },
    { to: "/admin/employees", label: "المستخدمون", icon: Users, show: isAdmin },
    { to: "/admin/vip", label: "العملاء المميزون", icon: Star, show: isAdmin },
  ];

  async function openNotif(open: boolean) {
    setNotifOpen(open);
    if (open && unreadCount > 0) {
      await markAllRead();
      qc.invalidateQueries({ queryKey: ["notif-unread-count"] });
    }
  }


  return (
    <div className="min-h-screen bg-secondary/30">
      <Toaster position="top-center" dir="rtl" />
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-2 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            لوحة التحكم
          </Link>
          <div className="flex items-center gap-2">
            {/* Notifications bell with dropdown */}
            <div className="relative">
              <button
                onClick={() => openNotif(!notifOpen)}
                aria-label="إشعاراتي"
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                  unreadCount > 0
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-background hover:bg-secondary"
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  <div className="border-b border-border px-3 py-2 text-sm font-semibold">إشعاراتي</div>
                  <div className="max-h-96 overflow-auto">
                    {(notifs ?? []).length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">لا توجد إشعارات</div>
                    ) : (
                      (notifs ?? []).map((n) => {
                        const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
                          n.link ? (
                            <Link
                              to={n.link as never}
                              onClick={async () => {
                                await markRead({ data: { id: n.id } });
                                qc.invalidateQueries({ queryKey: ["my-notifications"] });
                                setNotifOpen(false);
                              }}
                              className="block"
                            >
                              {children}
                            </Link>
                          ) : (
                            <div>{children}</div>
                          );
                        return (
                          <Wrapper key={n.id}>
                            <div className={`border-b border-border px-3 py-2 text-xs hover:bg-secondary ${n.read ? "" : "bg-primary/5"}`}>
                              <div className="font-semibold">{n.title}</div>
                              {n.body ? <div className="mt-0.5 text-muted-foreground">{n.body}</div> : null}
                              <div className="mt-1 text-[10px] text-muted-foreground">
                                {new Date(n.created_at).toLocaleString("ar")}
                              </div>
                            </div>
                          </Wrapper>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/admin/ads"
              aria-label="الإعلانات المعلقة"
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                pendingCount > 0
                  ? "border-destructive bg-destructive text-destructive-foreground animate-pulse hover:bg-destructive/90"
                  : "border-border bg-background hover:bg-secondary"
              }`}
            >
              <Megaphone className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium">
              {roleLabel}
            </span>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary">
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </div>
        </div>
        <nav className="container mx-auto flex gap-1 overflow-x-auto px-2 pb-2">
          {items.filter((i) => i.show).map((i) => {
            const active = path.startsWith(i.to);
            const isAdsItem = i.to === "/admin/ads";
            const isPendingProjItem = i.to === "/admin/pending-projects";
            return (
              <Link
                key={i.to} to={i.to}
                className={`relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"}`}
              >
                <i.icon className="h-4 w-4" /> {i.label}
                {isAdsItem && pendingCount > 0 && (
                  <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
                {isPendingProjItem && pendingProjectsCount > 0 && (
                  <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {pendingProjectsCount > 99 ? "99+" : pendingProjectsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
