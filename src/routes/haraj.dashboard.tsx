import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/haraj/dashboard")({
  head: () => ({ meta: [{ title: "لوحة المعلم — حراج المعلمين" }] }),
  component: TeacherDashboardPage,
});

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem("teacher_name");
    if (name === null) {
      navigate({ to: "/haraj", replace: true });
      return;
    }
    setTeacherName(name);
  }, [navigate]);

  function logout() {
    localStorage.removeItem("teacher_name");
    navigate({ to: "/haraj", replace: true });
  }

  if (teacherName === null) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto px-4 py-14">
        <div
          className="mx-auto max-w-md space-y-6 rounded-2xl p-8 text-center text-primary-foreground shadow-elegant"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <h1 className="text-2xl font-bold">مرحباً {teacherName}</h1>
          <button
            type="button"
            onClick={logout}
            className="inline-flex w-full items-center justify-center rounded-lg border border-primary-foreground/40 px-5 py-2.5 text-sm font-semibold transition hover:bg-primary-foreground/10"
          >
            تسجيل الخروج
          </button>
        </div>
      </main>
    </div>
  );
}
