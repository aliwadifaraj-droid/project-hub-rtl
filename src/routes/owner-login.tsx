import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Loader2, Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { signInProjectOwner } from "@/lib/project-owner.functions";

export const Route = createFileRoute("/owner-login")({ component: OwnerLoginPage });

function OwnerLoginPage() {
  const navigate = useNavigate();
  const signIn = useServerFn(signInProjectOwner);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn({ data: { email, password } });
      navigate({ to: "/project-owner", replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "بيانات الدخول غير صحيحة");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 sm:py-16">
        <section className="mx-auto max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
          <div className="bg-[image:var(--gradient-hero)] px-6 py-8 text-primary-foreground sm:px-9">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-accent)] text-accent-foreground">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm opacity-80">منصة العمران</p>
                <h1 className="text-2xl font-extrabold">دخول صاحب المشروع</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 opacity-85">أدخل بيانات حسابك لإدارة مشاريعك ومتابعة الطلبات.</p>
          </div>

          <form onSubmit={submit} className="space-y-5 p-6 sm:p-9">
            <div>
              <label htmlFor="owner-email" className="mb-1.5 block text-sm font-semibold">البريد الإلكتروني</label>
              <input id="owner-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="inp" />
            </div>
            <div>
              <label htmlFor="owner-password" className="mb-1.5 block text-sm font-semibold">كلمة المرور</label>
              <input id="owner-password" type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="inp" />
            </div>
            {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
            <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              تسجيل الدخول
            </button>
            <Link to="/project-owner-login" className="block w-full rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition hover:bg-secondary">إنشاء حساب صاحب مشروع</Link>
            <Link to="/" className="block text-center text-xs text-muted-foreground transition hover:text-foreground">العودة للموقع</Link>
          </form>
        </section>
      </main>
    </div>
  );
}
