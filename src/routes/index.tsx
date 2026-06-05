import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الرئيسية" },
      { name: "description", content: "بوابة المشاريع وطلبات العروض" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6" dir="rtl">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-foreground">بوابة المشاريع</h1>
        <p className="text-muted-foreground">مرحباً بك. اختر وجهتك:</p>
        <div className="flex flex-col gap-3">
          <Link to="/auth" className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90">
            تسجيل الدخول
          </Link>
          <Link to="/my-requests" className="px-4 py-2 rounded-md border border-border hover:bg-muted">
            طلباتي
          </Link>
          <Link to="/contact" className="px-4 py-2 rounded-md border border-border hover:bg-muted">
            تواصل معنا
          </Link>
        </div>
      </div>
    </div>
  );
}
