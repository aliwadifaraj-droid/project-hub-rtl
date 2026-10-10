import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMe, getSessionClaimsPublic } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // منع العملاء من دخول لوحة التحكم
    const claims = await getSessionClaimsPublic();
    if (claims?.roles?.includes("client")) {
      throw redirect({ to: "/client-portal" });
    }
    const me = await getMe();
    if (!me) throw redirect({ to: "/auth" });
    return { user: me };
  },
  component: () => <Outlet />,
});
