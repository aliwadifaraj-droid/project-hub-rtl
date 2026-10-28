import { createFileRoute } from "@tanstack/react-router";
import { ClientTicketsPage } from "./client-support.tickets";

export const Route = createFileRoute("/client-portal/support/tickets")({
  ssr: false,
  component: ClientTicketsPage,
});
