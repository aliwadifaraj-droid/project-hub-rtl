import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { signInTeacher } from "@/lib/haraj.functions";
import { saveStoredTeacher } from "@/lib/haraj-teacher-storage";
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

  useEffect(() => {
    setError("");
  }, []);

  if (pathname.startsWith("/haraj/register") || pathname.startsWith("/haraj/dashboard")) return <Outlet />;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ data: { email, password } });
      saveStoredTeacher(result.teacher);
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
      <main className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
          <div className="mb-7 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
              <Hammer className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold">دخول المعلمين</h1>
              <p className="text-sm text-muted-foreground">لوحة المعلم في حراج المعلمين</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">البريد الإلكتروني</label>
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} dir="ltr" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">كلمة السر</label>
              <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} dir="ltr" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background transition hover:bg-foreground/90 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              تسجيل الدخول
            </button>
            <Link to="/haraj/register" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
              <UserPlus className="h-4 w-4" /> إنشاء حساب معلم
            </Link>
          </form>
        </div>
      </main>
    </div>
  );
}
