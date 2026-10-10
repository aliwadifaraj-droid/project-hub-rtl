import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMe } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getMe تعيد null للعملاء، فتتم إعادة توجيههم لصفحة دخول الادمن
    const me = await getMe();
    if (!me) throw redirect({ to: "/auth" });
    return { user: me };
  },
  component: () => <Outlet />,
});
