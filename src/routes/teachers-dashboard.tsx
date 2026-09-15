import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTeacherMe,
  teacherSignOut,
  teacherSubscribe,
  getTeacherNotifications,
  getUnreadTeacherNotifications,
  markTeacherNotificationsRead,
  getTeacherOffers,
  submitTeacherOffer,
  SUBSCRIPTION_PLANS,
} from "@/lib/teachers.functions";
import {
  HardHat, LogOut, Loader2, Check, Clock, Bell, CreditCard,
  MapPin, Briefcase, Mail, Calendar, Plus, Send,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/teachers/dashboard")({
  component: TeachersDashboard,
});

function TeachersDashboard() {
  const navigate = useNavigate();
  const fetchMe = useServerFn(getTeacherMe);
  const doSignOut = useServerFn(teacherSignOut);
  const doSubscribe = useServerFn(teacherSubscribe);
  const fetchNotifs = useServerFn(getTeacherNotifications);
  const fetchUnread = useServerFn(getUnreadTeacherNotifications);
  const doMarkRead = useServerFn(markTeacherNotificationsRead);
  const fetchOffers = useServerFn(getTeacherOffers);
  const doSubmitOffer = useServerFn(submitTeacherOffer);
  const qc = useQueryClient();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerDesc, setOfferDesc] = useState("");
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => {
        if (!me) navigate({ to: "/teachers", replace: true });
      })
      .catch(() => navigate({ to: "/teachers", replace: true }));
  }, [fetchMe, navigate]);

  const { data: me } = useQuery({
    queryKey: ["teacher-me"],
    queryFn: () => fetchMe(),
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["teacher-unread-count"],
    queryFn: () => fetchUnread(),
    refetchInterval: 30000,
  });

  const { data: notifs } = useQuery({
    queryKey: ["teacher-notifs"],
    queryFn: () => fetchNotifs(),
    enabled: showNotifs,
  });

  const { data: offers } = useQuery({
    queryKey: ["teacher-offers"],
    queryFn: () => fetchOffers(),
  });

  async function logout() {
    await doSignOut();
    navigate({ to: "/teachers", replace: true });
  }

  async function handleSubscribe(planId: string) {
    setSubscribing(planId);
    try {
      await doSubscribe({ data: { plan_id: planId } });
      toast.success("تم تفعيل اشتراكك بنجاح!");
      qc.invalidateQueries({ queryKey: ["teacher-me"] });
    } catch (e: any) {
      toast.error(e?.message ?? "فشل تفعيل الاشتراك");
    } finally {
      setSubscribing(null);
    }
  }

  async function handleOpenNotifs(open: boolean) {
    setShowNotifs(open);
    if (open && unreadCount > 0) {
      await doMarkRead();
      qc.invalidateQueries({ queryKey: ["teacher-unread-count"] });
    }
  }

  async function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doSubmitOffer({
        data: { project_title: offerTitle, amount: offerAmount, description: offerDesc },
      });
      toast.success("تم إرسال العرض بنجاح");
      setOfferTitle("");
      setOfferAmount("");
      setOfferDesc("");
      setShowOfferForm(false);
      qc.invalidateQueries({ queryKey: ["teacher-offers"] });
    } catch (e: any) {
      toast.error(e?.message ?? "فشل إرسال العرض");
    }
  }

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive = me.subscription_status === "active";
  const expiresAt = me.subscription_expires_at
    ? new Date(me.subscription_expires_at).toLocaleDateString("ar-SA")
    : null;

  return (
    <div className="min-h-screen bg-secondary/20">
      <Toaster position="top-center" dir="rtl" />
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              <HardHat className="h-5 w-5" />
            </span>
            حراج المعلمين
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => handleOpenNotifs(!showNotifs)}
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                  unreadCount > 0
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-background hover:bg-secondary"
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  <div className="border-b border-border px-3 py-2 text-sm font-semibold">إشعاراتي</div>
                  <div className="max-h-96 overflow-auto">
                    {(notifs ?? []).length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">لا توجد إشعارات</div>
                    ) : (
                      (notifs ?? []).map((n) => (
                        <div key={n.id} className={`border-b border-border px-3 py-2 text-xs ${n.read ? "" : "bg-primary/5"}`}>
                          <div className="font-semibold">{n.title}</div>
                          {n.body && <div className="mt-0.5 text-muted-foreground">{n.body}</div>}
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleString("ar")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary">
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">مرحباً، {me.full_name}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {me.email}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {me.city}</span>
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {me.profession}</span>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isActive
                ? "bg-green-500/15 text-green-600"
                : "bg-slate-200 text-slate-500"
            }`}>
              {isActive ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              {isActive ? "مشترك" : "غير مشترك"}
            </span>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-bold">الاشتراك</h2>
          </div>
          {isActive ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/15 text-green-600">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">اشتراكك مفعّل</p>
                  <p className="text-sm text-muted-foreground">
                    {me.subscription_plan === "month" ? "خطة شهرية" : "خطة شهرين"} - ينتهي في {expiresAt}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md hover:border-foreground/20"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-bold">{plan.label}</h3>
                    <p className="text-3xl font-extrabold text-foreground">
                      {plan.price}
                      <span className="ms-1 text-sm font-normal text-muted-foreground">ريال</span>
                    </p>
                  </div>
                  <ul className="mb-4 space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> إرسال عروض أسعار غير محدودة</li>
                    <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> إشعارات المشاريع الجديدة</li>
                    <li className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> صلاحية {plan.days} يوم</li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing !== null}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-bold text-background hover:bg-foreground/90 disabled:opacity-60"
                  >
                    {subscribing === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    اشترك الآن
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offers Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">عروضي</h2>
            {isActive && (
              <button
                onClick={() => setShowOfferForm(!showOfferForm)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background hover:bg-foreground/90"
              >
                <Plus className="h-4 w-4" /> عرض جديد
              </button>
            )}
          </div>

          {showOfferForm && (
            <form onSubmit={handleSubmitOffer} className="mb-4 rounded-xl border border-border bg-card p-5 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold">عنوان المشروع</label>
                <input
                  type="text" required value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">المبلغ (ريال)</label>
                <input
                  type="text" required value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">الوصف</label>
                <textarea
                  required value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-5 py-2.5 text-sm font-bold text-background hover:bg-foreground/90"
              >
                <Send className="h-4 w-4" /> إرسال العرض
              </button>
            </form>
          )}

          {(offers ?? []).length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              لا توجد عروض بعد. {isActive ? "ابدأ بإرسال عرض جديد!" : "اشترك لإرسال العروض."}
            </p>
          ) : (
            <div className="grid gap-3">
              {(offers ?? []).map((o) => (
                <div key={o.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{o.project_title}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      o.status === "pending" ? "bg-yellow-500/15 text-yellow-600" :
                      o.status === "accepted" ? "bg-green-500/15 text-green-600" :
                      "bg-red-500/15 text-red-600"
                    }`}>
                      {o.status === "pending" ? "قيد الانتظار" : o.status === "accepted" ? "مقبول" : "مرفوض"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{o.amount} ريال</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(o.created_at).toLocaleDateString("ar")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
