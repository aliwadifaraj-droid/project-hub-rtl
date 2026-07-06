import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/subscribe-success")({
  head: () => ({
    meta: [{ title: "تم الاشتراك بنجاح — العمران" }],
  }),
  component: SubscribeSuccessPage,
});

function SubscribeSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              تم الاشتراك بنجاح
            </h1>
            <p className="mt-3 text-muted-foreground">
              شكراً لاشتراكك في قائمة العملاء المميزين. سنتواصل معك قريباً.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-base font-bold text-background hover:bg-foreground/90"
            >
              العودة للرئيسية
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
