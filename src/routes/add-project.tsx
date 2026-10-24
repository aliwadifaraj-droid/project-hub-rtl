import { createFileRoute } from "@tanstack/react-router";
import { BidFormAddProject } from "@/components/BidFormAddProject";

export const Route = createFileRoute("/add-project")({
  ssr: false,
  component: BidFormAddProject,
});
