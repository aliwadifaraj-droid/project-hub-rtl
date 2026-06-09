import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/admin.functions";
import { Building2, ClipboardList, Users, LogOut, FolderKanban, MessageSquare, UserCircle, Inbox, MessagesSquare, Megaphone, PlusCircle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const getRoles = useServerFn(getMyRoles);
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles() });
  const isAdmin = roles?.includes("admin");

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = [
    { to: "/admin/requests", label: "الطلبات", icon: ClipboardList, show: true },
    { to: "/admin/submissions", label: "طلبات إضافة المشاريع", icon: Inbox, show: isAdmin },
    { to: "/admin/messages", label: "الرسائل", icon: MessageSquare, show: true },
    { to: "/admin/chat", label: "شات الفريق", icon: MessagesSquare, show: true },
    { to: "/admin/ads", label: "الإعلانات المعلقة", icon: Megaphone, show: isAdmin },
    { to: "/ads/new", label: "إضافة إعلان", icon: PlusCircle, show: true },
    { to: "/admin/users", label: "المستخدمون", icon: UserCircle, show: isAdmin },
    { to: "/admin/projects", label: "المشاريع", icon: FolderKanban, show: isAdmin },
    { to: "/admin/employees", label: "الموظفون", icon: Users, show: isAdmin },
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
            <span className="hidden sm:inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium">
              {isAdmin ? "أدمن" : "موظف"}
            </span>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary">
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </div>
        </div>
        <nav className="container mx-auto flex gap-1 overflow-x-auto px-2 pb-2">
          {items.filter((i) => i.show).map((i) => {
            const active = path.startsWith(i.to);
            return (
              <Link
                key={i.to} to={i.to}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"}`}
              >
                <i.icon className="h-4 w-4" /> {i.label}
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
