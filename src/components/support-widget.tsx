import { Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";

export function SupportWidget() {
  return (
    <Link
      to="/support/tickets"
      className="fixed bottom-6 left-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-primary/90"
      aria-label="الدعم"
    >
      <LifeBuoy className="h-6 w-6" />
    </Link>
  );
}
