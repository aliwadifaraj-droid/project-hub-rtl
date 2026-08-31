import { createFileRoute, redirect } from "@tanstack/react-router";
import { getClientSession } from "@/lib/client.functions";
import { ClientPortal } from "@/components/client-portal";

export const Route = createFileRoute("/client-portal")({
  ssr: false,
  beforeLoad: async () => {
    const session = await getClientSession();
    if (!session) throw redirect({ to: "/client-login" });
    return { session };
  },
  component: ClientPortal,
});
