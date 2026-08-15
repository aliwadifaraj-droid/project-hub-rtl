import { createFileRoute } from "@tanstack/react-router";
import { BidFormAddProject } from "@/components/BidFormAddProject";

export const Route = createFileRoute("/submit-project")({
  head: () => ({
    meta: [
      { title: "أضف مشروعك — منصة المقاولات" },
      { name: "description", content: "أرسل مشروعك ليتم مراجعته ونشره على المنصة." },
    ],
  }),
  component: SubmitProjectPage,
});

function SubmitProjectPage() {
  return <BidFormAddProject />;
}
