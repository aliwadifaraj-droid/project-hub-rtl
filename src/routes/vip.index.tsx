import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { Star, Check, Wrench } from "lucide-react";
import { getMe } from "@/lib/auth.functions";
import { uploadPublicFile } from "@/lib/files.functions";
import { submitVipSubscription } from "@/lib/vip.functions";
import { getVipMaintenance, setVipMaintenance } from "@/lib/site-settings.functions";
import { toast } from "sonner";

const BANK_INFO = {
  name: "البنك الأهلي",
  holder: "AHMED SALMI",
  iban: "SA35 1000 0065 5000 4711 0807",
};

const PLANS = [
  { id: "شهر", label: "اشتراك شهر", price: 125, duration: "30 يوم" },
  { id: "شهرين", label: "اشتراك شهرين", price: 250, duration: "60 يوم" },
  { id: "3 شهور", label: "اشتراك 3 شهور", price: 350, duration: "90 يوم" },
];

export const Route = createFileRoute("/vip/")({
  head: () => ({
    meta: [
      { title: "العملاء المميزون — باقات الاشتراك" },
      { name: "description", content: "اختر باقة الاشتراك المناسبة وادفع عبر PayPal." },
    ],
  }),
  component: VipPage,
});

function VipPage() {
  const navigate = useNavigate();
  const subscribe = useServerFn(submitVipSubscription);
  const upload = useServerFn(uploadPublicFile);
  const meFn = useServerFn(getMe);
  const [selectedPlan, setSelectedPlan] = useState<string>(PLANS[0].id);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const getMx = useServerFn(getVipMaintenance);
  const setMx = useServerFn(setVipMaintenance);
  const qc = useQueryClient();
  const { data: mx } = useQuery({ queryKey: ["vip-maintenance"], queryFn: () => getMx(), refetchInterval: 15000 });
  const toggleMx = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!isAdmin) throw new Error("هذه العملية للأدمن فقط");
      await setMx({ data: { enabled } });
      return { enabled };
    },
    onSuccess: (r) => { toast.success(r.enabled ? "تم تفعيل الصيانة" : "تم إلغاء الصيانة"); qc.setQueryData(["vip-maintenance"], { enabled: r.enabled }); qc.invalidateQueries({ queryKey: ["vip-maintenance"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  useEffect(() => {
    (async () => {
      const me = await meFn();
      setIsAdmin(!!me?.roles.includes("admin"));
    })();
  }, [meFn]);

  const maintenance = !!mx?.enabled;




  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("ارفع صورة الإيصال");
    if (!name.trim()) return toast.error("أدخل الاسم");
    if (!email.trim()) return toast.error("أدخل البريد الإلكتروني");
    if (!selectedPlan) return toast.error("اختر الباقة");
    setLoading(true);
    try {
      const data = await fileToBase64(file);
      const res = await upload({ data: { filename: file.name, mime: file.type, purpose: "vip-receipt", data } });
      await subscribe({ data: { name: name.trim(), email: email.trim(), receipt_path: res.key, plan: selectedPlan } });
      navigate({ to: "/subscribe-success" });
    } catch (err) {
      toast.error("حصل خطأ: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
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
              <p className="mt-2 text-muted-foreground">اختر الباقة المناسبة وادفع عبر PayPal، ثم ارفع إيصال الدفع.</p>
            </div>

            {isAdmin && (
              <div className="mx-auto mt-6 flex max-w-4xl items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4" />
                  <span>وضع الصيانة: {maintenance ? "مفعّل" : "متوقف"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMx.mutate(!maintenance)}
                  disabled={toggleMx.isPending}
                  className={`rounded-lg px-4 py-2 text-sm font-bold text-background transition disabled:opacity-60 ${maintenance ? "bg-destructive" : "bg-foreground hover:bg-foreground/90"}`}
                >
                  {maintenance ? "إلغاء الصيانة" : "تفعيل الصيانة"}
                </button>
              </div>
            )}

            {maintenance && !isAdmin ? (
              <div className="mx-auto mt-10 max-w-xl rounded-xl border border-border bg-card p-10 text-center">
                <Wrench className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-bold">الصفحة تحت الصيانة</h2>
                <p className="mt-2 text-sm text-muted-foreground">نعتذر عن الإزعاج، سنعود قريباً.</p>
              </div>
            ) : (<>


            <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
              {PLANS.map((p) => {
                const active = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border bg-card p-6 text-center transition ${active ? "border-primary ring-2 ring-primary" : "border-border"}`}
                  >
                    <h3 className="text-lg font-bold">{p.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{p.duration}</p>
                    <p className="mt-4 text-3xl font-extrabold text-foreground">
                      {p.price} <span className="text-sm font-medium text-muted-foreground">ر.س</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(p.id)}
                      className="mt-4 w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-bold text-background transition hover:bg-foreground/90"
                    >
                      اختر هذه الباقة
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(p.id)}
                      className={`mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border px-4 py-2 text-xs font-medium ${active ? "border-primary text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                      {active ? "محددة" : "اختر هذه الباقة"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mx-auto mt-8 max-w-xl rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold text-center">تفاصيل التحويل البنكي</h2>
              <div className="mt-4 space-y-2 text-sm">
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
                      onClick={() => { navigator.clipboard.writeText(BANK_INFO.iban.replace(/\s/g, "")); toast.success("تم نسخ الآيبان"); }}
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"
                    >
                      نسخ
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground text-center">حوّل قيمة الباقة ثم ارفع صورة الإيصال بالأسفل.</p>
            </div>

            <form onSubmit={handleSubmit} className="mx-auto mt-10 grid max-w-xl gap-3 rounded-xl border border-border bg-card p-6 text-start">
              <h2 className="text-lg font-bold text-center">إرسال طلب الاشتراك</h2>
              <label className="text-sm font-medium">الباقة المختارة</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} — {p.price} ر.س</option>
                ))}
              </select>
              <label className="text-sm font-medium">الاسم</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <label className="text-sm font-medium">رفع صورة الإيصال (صورة أو PDF)</label>
              <input
                type="file"
                required
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-foreground px-6 py-3 text-base font-bold text-background transition hover:bg-foreground/90 disabled:opacity-60"
              >
                {loading ? "جارٍ الإرسال..." : "إرسال للمراجعة"}
              </button>
            </form>
            </>)}
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
