import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { Star, Check, Wrench, ChevronLeft, ChevronDown, Upload, Copy, Loader2 } from "lucide-react";
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

const VALID_PLAN_AMOUNTS = [100, 200, 300];

function normalizeArabicDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function extractAmountFromOcr(text: string): string {
  const normalized = normalizeArabicDigits(text);
  const patterns = [
    /(?:المبلغ|amount|التحويل|transfer|قيمة|value|مبلغ)\s*[:：]?\s*(\d+(?:[.,]\d{1,2})?)/i,
    /(\d+(?:[.,]\d{1,2})?)\s*(?:ريال|sar|ر\.س|sr)/i,
    /(\d{3,})\s*(?:ريال|sar|ر\.س|sr)/i,
    /\b(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:ريال|sar|ر\.س|sr)/i,
    /\b(\d{2,3}(?:[.,]\d{1,2})?)\b/,
  ];
  for (const p of patterns) {
    const m = normalized.match(p);
    if (m && m[1]) {
      const num = Number(m[1].replace(/[,]/g, ""));
      if (VALID_PLAN_AMOUNTS.includes(num)) return String(num);
    }
  }
  for (const p of patterns) {
    const m = normalized.match(p);
    if (m && m[1]) {
      const num = Number(m[1].replace(/[,]/g, ""));
      if (num > 0) return String(num);
    }
  }
  return "";
}

function extractDateFromOcr(text: string): string {
  const normalized = normalizeArabicDigits(text);
  const isoMatch = normalized.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }
  const dmyMatch = normalized.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }
  const dateKeywords = /(?:التاريخ|date|تاريخ|التحويل|transfer)\s*[:：]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
  const kwMatch = normalized.match(dateKeywords);
  if (kwMatch && kwMatch[1]) {
    const parts = kwMatch[1].split(/[-\/]/);
    if (parts.length === 3) {
      let [y, m, d] = parts[2].length === 4 ? [parts[2], parts[1], parts[0]] : [parts[2].length === 2 ? `20${parts[2]}` : parts[2], parts[1], parts[0]];
      if (parts[2].length === 4) { y = parts[2]; m = parts[1]; d = parts[0]; }
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return "";
}

function isWithinLast7Days(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = Date.now();
  const diff = now - d.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

async function runOcrOnImage(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("ara+eng");
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();
  return text;
}

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
  const [ocrScanning, setOcrScanning] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [ocrApproved, setOcrApproved] = useState(false);
  const [ocrAmount, setOcrAmount] = useState("");
  const [ocrDate, setOcrDate] = useState("");
  const [ocrFailed, setOcrFailed] = useState(false);

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

  function validateReceipt(): boolean {
    if (ocrFailed) return false;
    const amount = Number(ocrAmount);
    if (!ocrAmount || !ocrDate) return false;
    if (!VALID_PLAN_AMOUNTS.includes(amount)) return false;
    if (amount !== selectedPlanObj.price) return false;
    if (!isWithinLast7Days(ocrDate)) return false;
    return true;
  }

  async function handleFileChange(file: File | null) {
    setFile(file);
    setOcrAmount("");
    setOcrDate("");
    setOcrFailed(false);
    setReceiptError("");
    setOcrApproved(false);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setReceiptError("يجب رفع صورة الإيصال (PNG أو JPG) — ملفات PDF غير مقبولة");
      return;
    }
    setOcrScanning(true);
    try {
      const text = await runOcrOnImage(file);
      const amount = extractAmountFromOcr(text);
      const date = extractDateFromOcr(text);
      setOcrAmount(amount);
      setOcrDate(date);
      if (!amount || !date) {
        setOcrFailed(true);
        setOcrApproved(false);
        setReceiptError("تعذر قراءة المبلغ أو التاريخ من الإيصال — حاول برفع صورة أوضح");
      } else if (!VALID_PLAN_AMOUNTS.includes(Number(amount))) {
        setOcrFailed(true);
        setOcrApproved(false);
        setReceiptError(`المبلغ المقروء (${amount}) لا يطابق أي باقة متاحة (100، 200، 300 ر.س)`);
      } else if (Number(amount) !== selectedPlanObj.price) {
        setOcrFailed(true);
        setOcrApproved(false);
        setReceiptError(`المبلغ المقروء (${amount} ر.س) لا يطابق قيمة الباقة (${selectedPlanObj.price} ر.س)`);
      } else if (!isWithinLast7Days(date)) {
        setOcrFailed(true);
        setOcrApproved(false);
        setReceiptError("تاريخ الإيصال خارج نطاق 7 أيام المسموح");
      } else {
        setOcrApproved(true);
        setReceiptError("");
      }
    } catch (err) {
      setOcrFailed(true);
      setOcrApproved(false);
      setReceiptError("تعذر قراءة الإيصال: " + (err as Error).message);
    } finally {
      setOcrScanning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("ارفع صورة الإيصال");
    if (!name.trim()) return toast.error("أدخل الاسم");
    if (!email.trim()) return toast.error("أدخل البريد الإلكتروني");
    if (!city) return toast.error("اختر المدينة");
    if (!selectedPlan) return toast.error("اختر الباقة");
    if (ocrScanning) return toast.error("جارٍ فحص الإيصال — انتظر اكتمال الفحص");
    if (!validateReceipt()) {
      setReceiptError("الإيصال غير صالح. تأكد من المبلغ وتاريخ الدفع");
      return;
    }
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
                  <div className="mx-auto mt-8 max-w-md">
                    <form
                      onSubmit={(e) => { e.preventDefault(); goToStep3(); }}
                      className="rounded-xl border border-border bg-card p-6 space-y-4"
                    >
                      <h2 className="text-lg font-bold">بياناتك</h2>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">الاسم</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                          placeholder="الاسم الكامل"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                          placeholder="you@example.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">المدينة</label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                        >
                          <option value="">اختر المدينة</option>
                          {SAUDI_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
                        >
                          <ChevronLeft className="h-4 w-4" /> السابق
                        </button>
                        <button
                          type="submit"
                          className="flex-1 rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:bg-primary/90"
                        >
                          متابعة للدفع
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Step 3: Bank info + receipt upload with OCR validation */}
                {step === 3 && (
                  <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-md">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="text-lg font-bold mb-4">بيانات التحويل البنكي</h2>
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
                      <label className="text-sm font-medium">رفع صورة الإيصال (PNG أو JPG)</label>
                      <div className="mt-1 flex items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-secondary">
                          <Upload className="h-4 w-4" />
                          {file ? file.name : "اختر ملف"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                        </label>
                        {file && (
                          <span className="text-xs text-green-600 inline-flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> تم اختيار الملف
                          </span>
                        )}
                        {ocrScanning && (
                          <span className="text-xs text-primary inline-flex items-center gap-1">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> جارٍ فحص الإيصال...
                          </span>
                        )}
                      </div>
                      {receiptError && (
                        <p className="text-red-600 text-sm mt-2">⚠️ {receiptError}</p>
                      )}
                      {ocrApproved && ocrAmount && ocrDate && (
                        <div className="mt-3 rounded-lg border border-border bg-secondary/20 p-3 text-xs space-y-1">
                          <p className="font-bold text-sm mb-1">بيانات الإيصال المستخرجة:</p>
                          <p><span className="text-muted-foreground">المبلغ:</span> {ocrAmount} ر.س</p>
                          <p><span className="text-muted-foreground">التاريخ:</span> {ocrDate}</p>
                        </div>
                      )}
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
                        disabled={loading || ocrScanning || !ocrApproved}
                        className="flex-1 rounded-lg bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? "جارٍ الإرسال..." : ocrScanning ? "جارٍ الفحص..." : "إرسال للمراجعة"}
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
