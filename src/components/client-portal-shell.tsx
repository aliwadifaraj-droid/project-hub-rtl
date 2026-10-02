import { Link } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { ClientPortal } from "@/components/client-portal";

export function ClientPortalShell() {
  return (
    <div className="relative">
      <ClientPortal />
      <div className="pointer-events-none fixed inset-x-4 top-20 z-50 flex justify-start sm:inset-x-6 sm:top-24">
        <Link
          to="/client-support/tickets"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-lg transition hover:bg-secondary"
        >
          <Ticket className="h-4 w-4" />
          تذاكر الدعم
        </Link>
      </div>
    </div>
  );
}
