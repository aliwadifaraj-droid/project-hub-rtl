import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { HarajTeacherHeader } from "@/components/haraj-teacher-header";
import { TeacherSubscription } from "@/components/teacher-subscription";

export const Route = createFileRoute("/haraj/subscription")({
  head: () => ({ meta: [{ title: "اشتراك المعلمين — حراج المعلمين" }] }),
  component: TeacherSubscriptionPage,
});

function TeacherSubscriptionPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("teacher_name") === null) {
      navigate({ to: "/haraj", replace: true });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <HarajTeacherHeader />
      <main className="container mx-auto px-4 pb-14 pt-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link
            to="/haraj/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            العودة إلى لوحة المعلم
          </Link>
          <TeacherSubscription />
        </div>
      </main>
    </div>
  );
}
