import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Star } from "lucide-react";
import { toast, Toaster } from "sonner"; // 1. اضفنا هذا

export const Route = createFileRoute("/vip/")({
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
  const [vipName, setVipName] = useState("");
  const [vipEmail, setVipEmail] = useState("");

  const plans = [ // 2. اضفنا الباقات
    { price: 125, months: "شهر واحد" },
    { price: 250, months: "شهرين" },
    { price: 350, months: "3 شهور" },
  ];

  function goToPay(price: number) { // 3. غيرنا الدالة
    if (!vipName.trim() || !vipEmail.trim()) {
      toast.error("أدخل الاسم والايميل أول");
      return;
    }
    navigate({ to: "/vip/payment", search: { name: vipName.trim(), email: vipEmail.trim(), amount: price } });
  }

  return (
    <div className="min-h-screen flex-col bg-background" dir="rtl">
      <SiteHeader />
      <Toaster position="top-center" /> {/* 4. اضفنا التنبيه */}
      <main className="flex-1">
        <section id="vip" className="border-b border-border/60 bg-secondary/30">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-xl text-center mb-8">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[image:var(--gradient-accent)] text-accent-foreground">
                <Star className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">العملاء المميزون</h1>
              <p className="mt-2 text-muted-foreground">اشترك لتصلك عروض وفرص حصرية قبل غيرك.</p>
            </div>

            {/* الباقات */}
            <div className="mx-auto max-w-md space-y-4">
              {plans.map((p) => (
                <div key={p.price} className="rounded-2xl border-border bg-card p-5 shadow-sm">
                  <div className="text-right">
                    <p className="text-muted-foreground">{p.months}</p>
                    <p className="text-3xl font-bold">{p.price} ريال</p>
                    <p className="text-sm text-muted-foreground">✓ دعم أولوية</p>
                    <p className="text-sm text-muted-foreground">✓ مميزات حصرية</p>
                  </div>
                  <button
                    onClick={() => goToPay(p.price)}
                    className="w-full mt-4 rounded-xl bg-foreground px-6 py-3 text-base font-bold text-background"
                  >
                    اشترك الآن
                  </button>
                </div>
              ))}

              {/* بياناتك */}
              <div className="rounded-2xl border-border bg-card p-5 shadow-sm mt-6">
                <h2 className="font-bold mb-3 text-right">بياناتك للتواصل</h2>
                <input
                  type="text"
                  value={vipName}
                  onChange={(e) => setVipName(e.target.value)}
                  placeholder="الاسم"
                  className="w-full rounded-lg border-border bg-background px-4 py-3 text-sm mb-3"
                />
                <input
                  type="email"
                  value={vipEmail}
                  onChange={(e) => setVipEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full rounded-lg border-border bg-background px-4 py-3 text-sm"
                />
              </div>
            </div>

          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
