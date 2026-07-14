import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { signIn, signUp, getMe } from "@/lib/auth.functions";
import { SiteHeader } from "@/components/site-header";
import { Loader2, Lock, UserPlus } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const doSignIn = useServerFn(signIn);
  const doSignUp = useServerFn(signUp);
  const doGetMe = useServerFn(getMe);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    doGetMe().then((me) => {
      if (me) navigate({ to: "/admin", replace: true });
    });
  }, [doGetMe, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await doSignIn({ data: { email, password } });
      } else {
        await doSignUp({ data: { email, password } });
      }
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              {isLogin ? <Lock className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </span>
            <h1 className="text-2xl font-bold">
              {isLogin ? "دخول لوحة التحكم" : "إنشاء حساب جديد"}
            </h1>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">البريد الإلكتروني</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">كلمة المرور</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                minLength={6}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-600">{info}</p> : null}
            <button
              type="submit" disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background hover:bg-foreground/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLogin ? "تسجيل الدخول" : "إنشاء الحساب"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? "signup" : "login");
                setError(null);
                setInfo(null);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              {isLogin ? "إنشاء حساب جديد" : "العودة لتسجيل الدخول"}
            </button>
            <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">العودة للموقع</Link>
          </form>
        </div>
      </div>
    </div>
  );
}
