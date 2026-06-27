import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CreditCard, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { attachVipReceipt } from "@/lib/vip.functions";
import { toast } from "sonner";

const IBAN = "SA0000000000000000000000";
const BANK_NAME = "البنك الأهلي السعودي";
const ACCOUNT_NAME = "إنشاء";

type Search = { id?: string; email?: string };

export const Route = createFileRoute("/vip/payment")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({ meta: [{ title: "إتمام الدفع — العملاء المميزون" }] }),
  component: VipPaymentPage,
});

function VipPaymentPage() {
  const navigate = useNavigate();
  const { id, email: initialEmail } = useSearch({ from: "/vip/payment" });
  const attach = useServerFn(attachVipReceipt);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyIban() {
    await navigator.clipboard.writeText(IBAN);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) {
      toast.error("معرف الاشتراك مفقود، ابدأ من جديد.");
      return;
    }
    if (!file) {
      toast.error("ارفق صورة/PDF الإيصال");
      return;
    }
    if (!email.trim()) {
      toast.error("أدخل البريد الإلكتروني");
      return;
    }
    setLoading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vip-receipts")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      await attach({ data: { id, receipt_path: path } });
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
      <main className="flex-1">
        <section className="border-b border-border/60 bg-secondary/30">
          <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-xl">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-extrabold">إتمام الدفع</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  حوّل قيمة الاشتراك على الحساب التالي ثم ارفع صورة الإيصال.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">البنك</span><span className="font-medium">{BANK_NAME}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">اسم الحساب</span><span className="font-medium">{ACCOUNT_NAME}</span></div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">IBAN</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs">{IBAN}</code>
                    <button onClick={copyIban} type="button" className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-secondary">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
                <label className="text-sm font-medium">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <label className="text-sm font-medium">رفع إيصال التحويل (صورة أو PDF)</label>
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
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
