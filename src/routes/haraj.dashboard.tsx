import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { clearStoredTeacher, readStoredTeacher, type StoredTeacher } from "@/lib/haraj-teacher-storage";

export const Route = createFileRoute("/haraj/dashboard")({
  head: () => ({ meta: [{ title: "لوحة المعلم — حراج المعلمين" }] }),
  component: TeacherDashboardPage,
});

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<StoredTeacher | null>(null);

  useEffect(() => {
    const stored = readStoredTeacher();
    if (!stored) {
      navigate({ to: "/haraj", replace: true });
      return;
    }
    setTeacher(stored);
  }, [navigate]);

  function logout() {
    clearStoredTeacher();
    navigate({ to: "/haraj", replace: true });
  }

  if (!teacher) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
          <h1 className="text-2xl font-bold">مرحباً بك</h1>
          <p className="text-sm text-muted-foreground" dir="ltr">{teacher.email}</p>
          <button
            type="button"
            onClick={logout}
            className="inline-flex w-full items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary"
          >
            تسجيل الخروج
          </button>
        </div>
      </main>
    </div>
  );
}
