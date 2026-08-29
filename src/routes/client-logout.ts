import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie } from "@/lib/auth.server";

export const Route = createFileRoute("/client-logout")({
  server: {
    handlers: {
      GET: async () => {
        clearSessionCookie();
        return new Response(null, {
          status: 302,
          headers: { Location: "/client-login" },
        });
      },
    },
  },
});
