import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/admin.functions";
import { countPendingAds } from "@/lib/ads.functions";
import { getRoleLabel, hasAdminRole } from "@/lib/role-label";
import { Building2, ClipboardList, Users, LogOut, FolderKanban, MessageSquare, UserCircle, Inbox, MessagesSquare, Megaphone, PlusCircle, Bell } from "lucide-react";
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

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-ads-count"],
    queryFn: () => countPending(),
    enabled: !!roles && roles.length > 0,
    refetchInterval: 30000,
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
    { to: "/admin/requests", label: "الطلبات", icon: ClipboardList, show: true },
    { to: "/admin/submissions", label: "طلبات إضافة المشاريع", icon: Inbox, show: isAdmin },
    { to: "/admin/messages", label: "الرسائل", icon: MessageSquare, show: true },
    { to: "/admin/chat", label: "شات الفريق", icon: MessagesSquare, show: true },
    { to: "/admin/ads", label: "الإعلانات المعلقة", icon: Megaphone, show: true },
    { to: "/ads/new", label: "إضافة إعلان", icon: PlusCircle, show: true },
    { to: "/admin/users", label: "المستخدمون", icon: UserCircle, show: isAdmin },
    { to: "/admin/projects", label: "المشاريع", icon: FolderKanban, show: isAdmin },
    { to: "/admin/employees", label: "المستخدمون", icon: Users, show: isAdmin },
  ];

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
            <Link
              to="/admin/ads"
              aria-label="الإعلانات المعلقة"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary"
            >
              <Bell className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -end-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
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
