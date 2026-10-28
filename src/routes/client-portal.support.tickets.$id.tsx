import { createFileRoute } from "@tanstack/react-router";
import { ClientTicketDetailsPage } from "./client-support.tickets.$id";

export const Route = createFileRoute("/client-portal/support/tickets/$id")({
  ssr: false,
  component: ClientTicketDetailsPage,
});
