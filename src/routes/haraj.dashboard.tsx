import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Briefcase, CheckCircle2, Phone, MapPin, Heart, Clapperboard } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { TeacherSubscription } from "@/components/teacher-subscription";
import { getMyTeacherProfile, getMyHarajOffers, getMyHarajTasks, expressHarajInterest } from "@/lib/haraj.functions";
import type { TeacherMarketRow } from "@/lib/haraj.repo";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/haraj/dashboard")({
  head: () => ({ meta: [{ title: "لوحة المعلم — حراج المعلمين" }] }),
  component: TeacherDashboardPage,
});

type Panel = "profile" | "subscription" | "offers" | "tasks";

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  banned: "موقوف",
};

type HarajOffer = {
  id: string;
  work_name: string;
  description: string;
  city: string;
  owner_phone: string;
  status: string;
  assigned_teacher_id: string | null;
  created_at: string;
  images: string[];
  has_interest?: boolean;
};

type HarajTask = {
  id: string;
  work_name: string;
  description: string;
  city: string;
  owner_phone: string;
  status: string;
  created_at: string;
  images: string[];
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("ar-SA");
}

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyTeacherProfile);
  const fetchOffers = useServerFn(getMyHarajOffers);
  const fetchTasks = useServerFn(getMyHarajTasks);
  const expressInterest = useServerFn(expressHarajInterest);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<Panel | null>(null);
  const [profile, setProfile] = useState<TeacherMarketRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [offers, setOffers] = useState<HarajOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [tasks, setTasks] = useState<HarajTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [interestPending, setInterestPending] = useState<string | null>(null);

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

  async function loadOffers() {
    setOffersLoading(true);
    setOffersError("");
    try {
      const res = await fetchOffers();
      setOffers(res.rows as HarajOffer[]);
      setUnreadCount(res.unread ?? 0);
    } catch (err) {
      setOffersError(err instanceof Error ? err.message : "تعذر تحميل العروض");
    } finally {
      setOffersLoading(false);
    }
  }

  async function loadTasks() {
    setTasksLoading(true);
    setTasksError("");
    try {
      const res = await fetchTasks();
      setTasks(res.rows as HarajTask[]);
    } catch (err) {
      setTasksError(err instanceof Error ? err.message : "تعذر تحميل المهام");
    } finally {
      setTasksLoading(false);
    }
  }

  function togglePanel(panel: Panel) {
    if (openPanel === panel) {
      setOpenPanel(null);
      return;
    }
    setOpenPanel(panel);
    if (panel === "profile" && !profile) void loadProfile();
    if (panel === "offers") void loadOffers();
    if (panel === "tasks") void loadTasks();
  }

  async function handleInterest(offerId: string) {
    setInterestPending(offerId);
    try {
      await expressInterest({ data: { offer_id: offerId } });
      toast.success("تم تسجيل اهتمامك بنجاح");
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, has_interest: true } : o)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setInterestPending(null);
    }
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
      <Toaster position="top-center" dir="rtl" />
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
                onClick={() => togglePanel("offers")}
                aria-expanded={openPanel === "offers"}
                className="relative inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary transition hover:opacity-90"
              >
                <Clapperboard className="h-4 w-4" />
                عروض الإدارة
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => togglePanel("tasks")}
                aria-expanded={openPanel === "tasks"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary transition hover:opacity-90"
              >
                <Briefcase className="h-4 w-4" />
                مهامي
                {tasks.length > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold">
                    {tasks.length}
                  </span>
                )}
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

          {openPanel === "offers" && (
            <section className="mx-auto max-w-md space-y-4">
              <h2 className="text-lg font-bold">عروض الإدارة</h2>
              {offersLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...
                </div>
              )}
              {offersError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{offersError}</div>
              )}
              {!offersLoading && !offersError && offers.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  لا توجد عروض متاحة في مدينتك حالياً
                </div>
              )}
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-bold">{offer.work_name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {offer.city}
                    </span>
                  </div>
                  <p className="mb-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{offer.description}</p>
                  {offer.images.length > 0 && (
                    <div className="mb-3 grid grid-cols-3 gap-2">
                      {offer.images.slice(0, 6).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`صورة ${i + 1}`}
                          className="aspect-square w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">{formatDate(offer.created_at)}</span>
                    {offer.has_interest ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-600">
                        <CheckCircle2 className="h-4 w-4" /> سجّلت اهتمامك
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInterest(offer.id)}
                        disabled={interestPending === offer.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                      >
                        {interestPending === offer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
                        أنا مهتم
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}

          {openPanel === "tasks" && (
            <section className="mx-auto max-w-md space-y-4">
              <h2 className="text-lg font-bold">مهامي</h2>
              {tasksLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> جاري التحميل...
                </div>
              )}
              {tasksError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{tasksError}</div>
              )}
              {!tasksLoading && !tasksError && tasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                  لا توجد مشاريع مثبتة عليك حالياً
                </div>
              )}
              {tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-bold">{task.work_name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                      <CheckCircle2 className="h-3 w-3" /> مثبت
                    </span>
                  </div>
                  <p className="mb-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.description}</p>
                  {task.images.length > 0 && (
                    <div className="mb-3 grid grid-cols-3 gap-2">
                      {task.images.slice(0, 6).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`صورة ${i + 1}`}
                          className="aspect-square w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                  <div className="rounded-lg bg-secondary/40 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold" dir="ltr">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {task.owner_phone}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">رقم جوال صاحب العمل — متاح بعد التثبيت</p>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
