import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { TeacherSubscription } from "@/components/teacher-subscription";
import { getMyTeacherProfile } from "@/lib/haraj.functions";
import type { TeacherMarketRow } from "@/lib/haraj.repo";

export const Route = createFileRoute("/haraj/dashboard")({
  head: () => ({ meta: [{ title: "لوحة المعلم — حراج المعلمين" }] }),
  component: TeacherDashboardPage,
});

type Panel = "profile" | "subscription";

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  banned: "موقوف",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("ar-SA");
}

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyTeacherProfile);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<Panel | null>(null);
  const [profile, setProfile] = useState<TeacherMarketRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("teacher_name");
    if (name === null) {
      navigate({ to: "/haraj", replace: true });
      return;
    }
    setTeacherName(name);
  }, [navigate]);

  async function loadProfile() {
    setProfileLoading(true);
    setProfileError("");
    try {
      setProfile(await fetchProfile());
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "تعذر تحميل البيانات");
    } finally {
      setProfileLoading(false);
    }
  }

  function togglePanel(panel: Panel) {
    if (openPanel === panel) {
      setOpenPanel(null);
      return;
    }
    setOpenPanel(panel);
    if (panel === "profile" && !profile) void loadProfile();
  }

  function logout() {
    localStorage.removeItem("teacher_name");
    navigate({ to: "/haraj", replace: true });
  }

  if (teacherName === null) return null;

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
      <SiteHeader />
      <main className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-xl space-y-6">
          <div
            className="mx-auto max-w-md space-y-6 rounded-2xl p-8 text-center text-primary-foreground shadow-elegant"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            <h1 className="text-2xl font-bold">مرحباً {teacherName}</h1>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => togglePanel("profile")}
                aria-expanded={openPanel === "profile"}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary transition hover:opacity-90"
              >
                بياناتي
              </button>
              <button
                type="button"
                onClick={() => togglePanel("subscription")}
                aria-expanded={openPanel === "subscription"}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary transition hover:opacity-90"
              >
                اشتراكي
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex w-full items-center justify-center rounded-lg border border-primary-foreground/40 px-5 py-2.5 text-sm font-semibold transition hover:bg-primary-foreground/10 sm:col-span-2"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>

          {openPanel === "profile" && (
            <section className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]">
              <h2 className="mb-4 text-lg font-bold">بيانات التسجيل</h2>
              {profileLoading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...
                </div>
              )}
              {profileError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{profileError}</div>
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
          )}

          {openPanel === "subscription" && <TeacherSubscription />}
        </div>
      </main>
    </div>
  );
}
