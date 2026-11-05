import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, Heart, Building2, Ticket, Crown, LogOut, User, TrendingUp, MessageSquare, MapPin } from "lucide-react";
import { HarajTeacherHeader } from "@/components/haraj-teacher-header";
import { getMyHarajOffers, getMyHarajTasks, expressHarajInterest } from "@/lib/haraj.functions";
import { getMyHarajUnreadOfferCount, markMyHarajOffersRead } from "@/lib/haraj-offer-reads.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/haraj/dashboard")({
  head: () => ({ meta: [{ title: "لوحة المعلم — حراج المعلمين" }] }),
  component: TeacherDashboardPage,
});

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
  interest_block_reason?: string | null;
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

function hapticTap() {
  navigator.vibrate?.(10);
}

const TILE_BASE =
  "relative inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-base font-bold transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0.5 active:scale-[0.96] active:brightness-90";

function TeacherDashboardPage() {
  const navigate = useNavigate();
  const fetchOffers = useServerFn(getMyHarajOffers);
  const fetchUnreadCount = useServerFn(getMyHarajUnreadOfferCount);
  const markOffersReadOnServer = useServerFn(markMyHarajOffersRead);
  const fetchTasks = useServerFn(getMyHarajTasks);
  const expressInterest = useServerFn(expressHarajInterest);
  const offersRef = useRef<HTMLElement>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [offers, setOffers] = useState<HarajOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState("");
  const [subscriptionCity, setSubscriptionCity] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tasks, setTasks] = useState<HarajTask[]>([]);
  const [interestPending, setInterestPending] = useState<string | null>(null);
  const [revealedReasonOfferId, setRevealedReasonOfferId] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem("teacher_name");
    if (name === null) {
      navigate({ to: "/haraj", replace: true });
      return;
    }
    setTeacherName(name);
  }, [navigate]);

  useEffect(() => {
    if (teacherName === null) return;
    void loadOffers();
    void loadUnreadCount();
    void loadTasks();
  }, [teacherName]);

  useEffect(() => {
    if (revealedReasonOfferId === null) return;
    const timer = setTimeout(() => setRevealedReasonOfferId(null), 4000);
    return () => clearTimeout(timer);
  }, [revealedReasonOfferId]);

  async function loadOffers() {
    setOffersLoading(true);
    setOffersError("");
    try {
      const res = await fetchOffers();
      setOffers(res.rows as HarajOffer[]);
      setSubscriptionCity(res.subscription_city ?? null);
    } catch (err) {
      setOffersError(err instanceof Error ? err.message : "تعذر تحميل العروض");
    } finally {
      setOffersLoading(false);
    }
  }

  async function loadUnreadCount() {
    try {
      const res = await fetchUnreadCount();
      setUnreadCount(res.unread);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحميل عدد العروض الجديدة");
    }
  }

  async function loadTasks() {
    try {
      const res = await fetchTasks();
      setTasks(res.rows as HarajTask[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تحميل المهام");
    }
  }

  function scrollToOffers() {
    offersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function markOffersSeen() {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    try {
      await markOffersReadOnServer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
      void loadUnreadCount();
    }
  }

  async function handleInterest(offerId: string) {
    setInterestPending(offerId);
    try {
      await expressInterest({ data: { offer_id: offerId } });
      toast.success("تم تسجيل اهتمامك بنجاح");
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, has_interest: true } : o)));
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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <HarajTeacherHeader />
      <Toaster position="top-center" dir="rtl" />
      <main className="container mx-auto px-4 pb-14 pt-4">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="rounded-2xl border-border bg-[#fef3c7] p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-accent)] text-accent-foreground">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold">لوحة المعلم</h1>
                <p className="text-sm text-muted-foreground">مرحباً {teacherName}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  navigate({ to: "/haraj/subscription" });
                }}
                className={`${TILE_BASE} border-emerald-300 bg-emerald-50 text-emerald-800`}
              >
                اشتراكي
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  scrollToOffers();
                }}
                className={`${TILE_BASE} border-emerald-300 bg-emerald-50 text-emerald-800`}
              >
                <Ticket className="h-5 w-5" />
                عروض الإدارة
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  navigate({ to: "/haraj/tasks" });
                }}
                className={`${TILE_BASE} border-amber-300 bg-amber-50 text-amber-800`}
              >
                <Crown className="h-5 w-5" />
                مهامي
                {tasks.length > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                    {tasks.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  logout();
                }}
                className={`${TILE_BASE} border-stone-300 bg-stone-100 text-stone-700`}
              >
                <LogOut className="h-5 w-5" />
                تسجيل الخروج
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                navigate({ to: "/haraj/profile" });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition duration-150 hover:bg-secondary active:scale-[0.96] active:brightness-90"
            >
              <User className="h-4 w-4" />
              بياناتي
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </button>
            <Link
              to="/haraj/support"
              onClick={hapticTap}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition duration-150 hover:bg-secondary active:scale-[0.96] active:brightness-90"
            >
              <MessageSquare className="h-4 w-4" />
              الدعم الفني
            </Link>
          </div>

          <section ref={offersRef} className="mx-auto max-w-md scroll-mt-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">عروض الإدارة</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {subscriptionCity
                  ? <>اشتراكك الفعّال في مدينة <span className="font-semibold text-foreground">{subscriptionCity}</span>. يمكنك إبداء الاهتمام بعروض هذه المدينة فقط.</>
                  : "ليس لديك اشتراك فعّال حالياً. يمكنك الاطلاع على جميع العروض، وإبداء الاهتمام يتطلب اشتراكاً فعّالاً."}
              </p>
            </div>
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
                لا توجد عروض متاحة حالياً
              </div>
            )}
            {offers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => void markOffersSeen()}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
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
                {!offer.has_interest && offer.interest_block_reason && revealedReasonOfferId === offer.id && (
                  <p className="mb-3 rounded-lg bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">{offer.interest_block_reason}</p>
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
                      onClick={() => {
                        if (offer.interest_block_reason) setRevealedReasonOfferId(offer.id);
                        void handleInterest(offer.id);
                      }}
                      disabled={interestPending === offer.id}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                        offer.interest_block_reason
                          ? "bg-secondary text-muted-foreground hover:bg-secondary/80"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}
                    >
                      {interestPending === offer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
                      احجز العرض
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
