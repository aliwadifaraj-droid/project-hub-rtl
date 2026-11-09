import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { signInTeacher } from "@/lib/haraj.functions";
import { SiteHeader } from "@/components/site-header";
import { Loader2, Hammer, Lock, UserPlus } from "lucide-react";

export const Route = createFileRoute("/haraj")({
  head: () => ({ meta: [{ title: "دخول المعلمين — حراج المعلمين" }] }),
  component: TeacherLoginPage,
});

function TeacherLoginPage() {
  const navigate = useNavigate();
  const login = useServerFn(signInTeacher);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (pathname.startsWith("/haraj/register") || pathname.startsWith("/haraj/dashboard") || pathname.startsWith("/haraj/support") || pathname.startsWith("/haraj/subscription") || pathname.startsWith("/haraj/profile") || pathname.startsWith("/haraj/tasks")) return <Outlet />;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ data: { email, password } });
      localStorage.setItem("teacher_name", result.name);
      navigate({ to: "/haraj/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
          <div className="bg-[image:var(--gradient-hero)] px-6 py-8 text-primary-foreground sm:px-10">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-accent)] text-accent-foreground">
                <Hammer />
              </span>
              <div>
                <p className="text-sm opacity-80">منصة العمران</p>
                <h1 className="text-2xl font-extrabold sm:text-3xl">دخول المعلمين</h1>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 opacity-85">أدخل بيانات حسابك لإدارة ملفك المهني ومتابعة الطلبات في حراج المعلمين.</p>
          </div>
          <form onSubmit={submit} className="space-y-4 p-6 sm:p-10">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">البريد الإلكتروني *</label>
              <input className="inp" type="email" required dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">كلمة المرور *</label>
              <input className="inp" type="password" minLength={6} required dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              تسجيل الدخول
            </button>
            <Link to="/haraj/register" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-secondary">
              <UserPlus className="h-4 w-4" /> إنشاء حساب معلم
            </Link>
            <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">العودة للموقع</Link>
          </form>
        </div>
      </main>
    </div>
  );
}
