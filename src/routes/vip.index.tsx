import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { Star, Check, Wrench, ChevronLeft, ChevronDown, Upload, Copy } from "lucide-react";
import { uploadPublicFile } from "@/lib/files.functions";
import { submitVipSubscription } from "@/lib/vip.functions";
import { getVipMaintenance } from "@/lib/site-settings.functions";
import { getMyRoles } from "@/lib/admin.functions";
import { hasAdminRole } from "@/lib/role-label";
import { toast } from "sonner";
import { SAUDI_CITIES } from "@/lib/saudi-cities";
const BANK_INFO = {
  name: "البنك الأهلي",
  holder: "AHMED SALMI",
  iban: "SA35 1000 0065 5000 4711 0807",
};

const PLANS = [
  { id: "شهر", label: "اشتراك شهر", price: 100, duration: "30 يوم" },
  { id: "شهرين", label: "اشتراك شهرين", price: 200, duration: "60 يوم" },
  { id: "3 شهور", label: "اشتراك 3 شهور", price: 300, duration: "90 يوم" },
];

export const Route = createFileRoute("/vip/")({
  head: () => ({
    meta: [
      { title: "العملاء المميزون — باقات الاشتراك" },
      { name: "description", content: "اختر باقة الاشتراك المناسبة وحول المبلغ بنكي، ثم ارفع إيصال الدفع." },
    ],
  }),
  component: VipPage,
});

function VipPage() {
  const navigate = useNavigate();
  const subscribe = useServerFn(submitVipSubscription);
  const upload = useServerFn(uploadPublicFile);
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string>(PLANS[0].id);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOtherPlans, setShowOtherPlans] = useState(false);

  const getMx = useServerFn(getVipMaintenance);
  const getRoles = useServerFn(getMyRoles);
  const { data: mx } = useQuery({ queryKey: ["vip-maintenance"], queryFn: () => getMx(), refetchInterval: 15000 });
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => getRoles() });
  const isAdmin = hasAdminRole(roles);

  const maintenance = !!mx?.enabled;
  const selectedPlanObj = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0];

  function goToStep2() {
    if (!selectedPlan) return toast.error("اختر الباقة");
    setStep(2);
  }

  function goToStep3() {
    if (!name.trim()) return toast.error("أدخل الاسم");
    if (!email.trim()) return toast.error("أدخل البريد الإلكتروني");
    if (!city) return toast.error("اختر المدينة");
    setStep(3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("ارفع صورة الإيصال");
    if (!name.trim()) return toast.error("أدخل الاسم");
    if (!email.trim()) return toast.error("أدخل البريد الإلكتروني");
    if (!city) return toast.error("اختر المدينة");
    if (!selectedPlan) return toast.error("اختر الباقة");
    setLoading(true);
    try {
      const data = await fileToBase64(file);
      const res = await upload({ data: { filename: file.name, mime: file.type, purpose: "vip-receipt", data } });
      await subscribe({ data: { name: name.trim(), email: email.trim(), receipt_path: res.key, plan: selectedPlan, city } });
      setSubmitted(true);
    } catch (err) {
      toast.error("حصل خطأ: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copyIban() {
    navigator.clipboard.writeText(BANK_INFO.iban.replace(/\s/g, ""));
    toast.success("تم نسخ الآيبان");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SiteHeader />
      <Toaster position="top-center" dir="rtl" />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-secondary/30">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground">
                <Star className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">العملاء المميزون</h1>
              <p className="mt-2 text-muted-foreground">اختر الباقة المناسبة وحول المبلغ بنكي، ثم ارفع إيصال الدفع.</p>
            </div>

            {maintenance && !isAdmin ? (
              <div className="mx-auto mt-10 max-w-xl rounded-xl border border-border bg-card p-10 text-center">
                <Wrench className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-bold">الصفحة تحت الصيانة</h2>
                <p className="mt-2 text-sm text-muted-foreground">نعتذر عن الإزعاج، سنعود قريباً.</p>
              </div>
            ) : submitted ? (
              <div className="mx-auto mt-10 max-w-xl rounded-xl border border-border bg-card p-10 text-center">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold text-foreground">طلبكم قيد المراجعة</h2>
                <p className="mt-3 text-sm text-muted-foreground">طلبكم قيد المراجعة سيتم إشعاركم عند التفعيل</p>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/" })}
                  className="mt-6 rounded-lg bg-foreground px-6 py-2.5 text-sm font-bold text-background transition hover:bg-foreground/90"
                >
                  العودة للرئيسية
                </button>
              </div>
            ) : (
              <>
                {/* Stepper indicator */}
                <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition ${
                          step >= s
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {step > s ? <Check className="h-4 w-4" /> : s}
                      </div>
                      {s < 3 && <div className={`h-0.5 w-12 ${step > s ? "bg-primary" : "bg-border"}`} />}
                    </div>
                  ))}
                </div>
                <div className="mx-auto mt-2 flex max-w-md justify-center gap-2 text-[11px] text-muted-foreground">
                  <span className="w-8 text-center">الباقة</span>
                  <span className="w-12" />
                  <span className="w-8 text-center">البيانات</span>
                  <span className="w-12" />
                  <span className="w-8 text-center">الدفع</span>
                </div>

                {/* Step 1: Plan selection with featured card + collapsible other plans */}
                {step === 1 && (
                  <div className="mx-auto mt-8 max-w-xl">
                    <div className="rounded-2xl border-2 border-primary bg-card p-8 text-center shadow-lg">
                      <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                        <Star className="h-3 w-3" /> الأكثر طلباً
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{PLANS[0].label}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{PLANS[0].duration}</p>
                      <p className="mt-5 text-4xl font-extrabold text-foreground">
                        {PLANS[0].price}
                        <span className="text-base font-medium text-muted-foreground"> ر.س</span>
                      </p>
                      <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4 text-green-600" /> أولوية في استلام المشاريع الجديدة
                        </li>
                        <li className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4 text-green-600" /> إشعار فوري بالمشاريع الحصرية
                        </li>
                        <li className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4 text-green-600" /> دعم مخصص
                        </li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => { setSelectedPlan(PLANS[0].id); goToStep2(); }}
                        className="mt-6 w-full rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:bg-primary/90"
                      >
                        اختر هذه الباقة
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowOtherPlans((v) => !v)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white transition hover:opacity-90"
                      style={{ backgroundColor: "#F97316" }}
                    >
                      باقات أخرى متاحة
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${showOtherPlans ? "rotate-180" : ""}`} />
                    </button>

                    {showOtherPlans && (
                      <div className="mt-4 rounded-xl border border-border bg-card p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {PLANS.slice(1).map((p) => {
                            const active = selectedPlan === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPlan(p.id)}
                                className={`rounded-lg border p-4 text-center transition ${active ? "border-primary ring-2 ring-primary" : "border-border hover:bg-secondary"}`}
                              >
                                <h4 className="text-sm font-bold">{p.label}</h4>
                                <p className="mt-1 text-xs text-muted-foreground">{p.duration}</p>
                                <p className="mt-3 text-2xl font-extrabold text-foreground">
                                  {p.price}
                                  <span className="text-xs font-medium text-muted-foreground"> ر.س</span>
                                </p>
                                {active && (
                                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                                    <Check className="h-3 w-3" /> محددة
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={goToStep2}
                          className="mt-4 w-full rounded-lg border border-primary bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10"
                        >
                          متابعة بالباقة المختارة
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: User data (name, email, city) — no receipt */}
                {step === 2 && (
                  <div className="mx-auto mt-8 max-w-xl rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-bold text-center">بيانات المشترك</h2>
                    <p className="mt-1 text-center text-xs text-muted-foreground">
                      الباقة المختارة: <span className="font-bold text-foreground">{selectedPlanObj.label} — {selectedPlanObj.price} ر.س</span>
                    </p>
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="text-sm font-medium">الاسم</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="الاسم الكامل"
                          className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@email.com"
                          className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">المدينة</label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">اختر المدينة</option>
                          {SAUDI_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
                      >
                        <ChevronLeft className="h-4 w-4" /> السابق
                      </button>
                      <button
                        type="button"
                        onClick={goToStep3}
                        className="flex-1 rounded-lg bg-foreground px-6 py-2.5 text-sm font-bold text-background transition hover:bg-foreground/90"
                      >
                        التالي للدفع
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment — bank details + receipt upload */}
                {step === 3 && (
                  <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-xl rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-bold text-center">الدفع ورفع الإيصال</h2>
                    <p className="mt-1 text-center text-xs text-muted-foreground">
                      الباقة: <span className="font-bold text-foreground">{selectedPlanObj.label} — {selectedPlanObj.price} ر.س</span>
                    </p>

                    <div className="mt-5 rounded-lg border border-border bg-secondary/30 p-4">
                      <h3 className="text-sm font-bold text-center mb-3">تفاصيل التحويل البنكي</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-border/60 py-2">
                          <span className="text-muted-foreground">اسم البنك</span>
                          <span className="font-bold">{BANK_INFO.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 py-2">
                          <span className="text-muted-foreground">صاحب الحساب</span>
                          <span className="font-bold">{BANK_INFO.holder}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 py-2">
                          <span className="text-muted-foreground">IBAN</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold" dir="ltr">{BANK_INFO.iban}</span>
                            <button
                              type="button"
                              onClick={copyIban}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"
                            >
                              <Copy className="h-3 w-3" /> نسخ
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground text-center">
                        حوّل مبلغ <span className="font-bold text-foreground">{selectedPlanObj.price} ر.س</span> ثم ارفع صورة الإيصال بالأسفل.
                      </p>
                    </div>

                    <div className="mt-5">
                      <label className="text-sm font-medium">رفع صورة الإيصال (صورة أو PDF)</label>
                      <div className="mt-1 flex items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-secondary">
                          <Upload className="h-4 w-4" />
                          {file ? file.name : "اختر ملف"}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                        </label>
                        {file && (
                          <span className="text-xs text-green-600 inline-flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> تم اختيار الملف
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
                      >
                        <ChevronLeft className="h-4 w-4" /> السابق
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                      >
                        {loading ? "جارٍ الإرسال..." : "إرسال للمراجعة"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
