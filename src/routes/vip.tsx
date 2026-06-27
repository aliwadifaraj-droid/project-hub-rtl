import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Star } from "lucide-react";
import { submitVipSubscription } from "@/lib/vip.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/vip")({
  head: () => ({
    meta: [
      { title: "العملاء المميزون — إنشاء" },
      { name: "description", content: "اشترك لتصلك عروض وفرص حصرية قبل غيرك." },
    ],
  }),
  component: VipPage,
});

function VipPage() {
  const navigate = useNavigate();
  const subscribe = useServerFn(submitVipSubscription);
  const [vipName, setVipName] = useState("");
  const [vipEmail, setVipEmail] = useState("");
  const [vipLoading, setVipLoading] = useState(false);

  async function handleVipSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vipName.trim() || !vipEmail.trim()) return;
    setVipLoading(true);
    try {
      const res = await subscribe({ data: { name: vipName.trim(), email: vipEmail.trim() } });
      navigate({ to: "/vip/payment", search: { id: res.id, email: vipEmail.trim() } as never });
    } catch (err) {
      toast.error("حصل خطأ: " + (err as Error).message);
    } finally {
      setVipLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="flex-1">
        <section id="vip" className="border-b border-border/60 bg-secondary/30">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground">
                <Star className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">العملاء المميزون</h1>
              <p className="mt-2 text-muted-foreground">اشترك لتصلك عروض وفرص حصرية قبل غيرك.</p>
              <form onSubmit={handleVipSubmit} className="mt-6 grid gap-3 text-start">
                <input
                  type="text"
                  required
                  value={vipName}
                  onChange={(e) => setVipName(e.target.value)}
                  placeholder="الاسم"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="email"
                  required
                  value={vipEmail}
                  onChange={(e) => setVipEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={vipLoading}
                  className="w-full rounded-lg bg-foreground px-6 py-3 text-base font-bold text-background transition hover:bg-foreground/90 disabled:opacity-60"
                >
                  {vipLoading ? "جارٍ الإرسال..." : "اشتراك"}
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
