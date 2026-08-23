import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/employees")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/employees" });
  },
});