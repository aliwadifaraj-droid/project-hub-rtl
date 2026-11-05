import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { HarajTeacherHeader } from "@/components/haraj-teacher-header";
import { getMyTeacherProfile } from "@/lib/haraj.functions";
import type { TeacherMarketRow } from "@/lib/haraj.repo";

export const Route = createFileRoute("/haraj/profile")({
  head: () => ({ meta: [{ title: "بياناتي — حراج المعلمين" }] }),
  component: TeacherProfilePage,
});

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  banned: "موقوف",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("ar-SA");
}

function TeacherProfilePage() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyTeacherProfile);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<TeacherMarketRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("teacher_name") === null) {
      navigate({ to: "/haraj", replace: true });
      return;
    }
    setReady(true);
  }, [navigate]);

  useEffect(() => {
    if (!ready) return;
    void loadProfile();
  }, [ready]);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      setProfile(await fetchProfile());
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  const profileRows = profile
    ? [
        { label: "الاسم الكامل", value: profile.full_name, ltr: false },
        { label: "رقم الجوال", value: profile.phone, ltr: true },
        { label: "المدينة", value: profile.city, ltr: false },
        { label: "المهنة", value: profile.profession, ltr: false },
        { label: "البريد الإلكتروني", value: profile.email, ltr: true },
        { label: "الحالة", value: STATUS_LABELS[profile.status] ?? profile.status, ltr: false },
        { label: "تاريخ التسجيل", value: formatDate(profile.created_at), ltr: true },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <HarajTeacherHeader />
      <main className="container mx-auto px-4 pb-14 pt-4">
        <div className="mx-auto max-w-xl space-y-6">
          <Link
            to="/haraj/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            العودة إلى لوحة المعلم
          </Link>
          <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
            <h1 className="mb-4 text-xl font-bold">بيانات التسجيل</h1>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
            )}
            {profile && (
              <dl className="divide-y divide-border">
                {profileRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-sm font-semibold" dir={row.ltr ? "ltr" : undefined}>{row.value || "-"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
