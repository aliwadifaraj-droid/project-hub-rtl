import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "شكراً لكم — تم استلام طلبكم" },
      { name: "description", content: "تم استلام طلبكم بنجاح وسيتم التواصل بكم لاحقاً." },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-20 flex items-center justify-center">
        <div className="max-w-xl w-full rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-3xl font-extrabold">شكراً لكم</h1>
          <p className="mt-4 text-lg leading-loose text-foreground/85">
            تم استلام طلبكم بنجاح وسيتم التواصل بكم لاحقاً
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
          >
            العودة للرئيسية
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
