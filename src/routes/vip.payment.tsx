import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Check } from "lucide-react";

const PLANS = [
  { months: 1, price: 125, label: "شهر واحد" },
  { months: 2, price: 250, label: "شهرين" },
  { months: 3, price: 350, label: "3 شهور" },
];

export const Route = createFileRoute("/vip/")({
  head: () => ({ meta: [{ title: "العملاء المميزون" }] }),
  component: VipIndexPage,
});

function VipIndexPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function goToPay(price: number) {
    if (!name.trim() || !email.trim()) {
      alert("أدخل الاسم والايميل أول");
      return;
    }
    navigate({ to: "/vip/payment", search: { name, email, amount: price } });
  }

  return (
    <div className="min-h-screen flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold">اشتراك العملاء المميزون</h1>
            <p className="text-muted-foreground mt-2">اختر الباقة المناسبة لك</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto mb-12">
            {PLANS.map((p) => (
              <div key={p.months} className="rounded-xl border-border bg-card p-6 flex-col">
                <h3 className="text-xl font-bold mb-2">{p.label}</h3>
                <div className="text-4xl font-extrabold mb-4">{p.price} ريال</div>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6 flex-1">
                  <li className="flex gap-2"><Check className="h-4 w-4 text-primary"/> دعم أولوية</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-primary"/> مميزات حصرية</li>
                </ul>
                <button 
                  onClick={() => goToPay(p.price)}
                  className="w-full rounded-lg bg-foreground text-background py-3 font-bold hover:bg-foreground/90">
                  اشترك الآن
                </button>
              </div>
            ))}
          </div>

          <div className="max-w-xl mx-auto">
            <h2 className="text-lg font-bold mb-3">بياناتك للتواصل</h2>
            <div className="grid gap-3">
              <input
                type="text" value={name} onChange={(e)=>setName(e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full rounded-lg border-border bg-background px-4 py-3 text-sm"/>
              <input
                type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="w-full rounded-lg border-border bg-background px-4 py-3 text-sm"/>
            </div>
            <p className="text-xs text-muted-foreground mt-2">*ادخل بياناتك ثم اختر باقة</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
