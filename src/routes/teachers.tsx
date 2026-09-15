import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  teacherSignUp,
  teacherSignIn,
  getTeacherMe,
  SAUDI_CITIES,
  TEACHER_PROFESSIONS,
} from "@/lib/teachers.functions";
import { SiteHeader } from "@/components/site-header";
import { Loader2, Lock, UserPlus, HardHat, Mail, MapPin, Briefcase, KeyRound, User } from "lucide-react";

export const Route = createFileRoute("/teachers")({
  component: TeachersAuthPage,
});

function TeachersAuthPage() {
  const navigate = useNavigate();
  const doSignUp = useServerFn(teacherSignUp);
  const doSignIn = useServerFn(teacherSignIn);
  const doGetMe = useServerFn(getTeacherMe);
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    doGetMe()
      .then((me) => {
        if (me) navigate({ to: "/teachers/dashboard", replace: true });
      })
      .catch(() => undefined);
  }, [doGetMe, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await doSignIn({ data: { email, password } });
      } else {
        await doSignUp({
          data: { full_name: fullName, email, password, city, profession },
        });
      }
      navigate({ to: "/teachers/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-secondary/20">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-xl bg-[image:var(--gradient-accent)] text-accent-foreground">
              <HardHat className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">حراج المعلمين</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? "سجل دخولك للوصول إلى لوحة المعلم" : "أنشئ حسابك وابدأ بتقديم عروضك"}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
                {isLogin ? <Lock className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              </span>
              <h2 className="text-lg font-bold">
                {isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
              </h2>
            </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {!isLogin && (
              <>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">الاسم الرباعي</label>
              <div className="relative">
                <User className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text" required value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم الرباعي الكامل"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">مدينة الإقامة</label>
              <div className="relative">
                <MapPin className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  required value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>اختر المدينة</option>
                  {SAUDI_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">المهنة</label>
              <div className="relative">
                <Briefcase className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  required value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>اختر المهنة</option>
                  {TEACHER_PROFESSIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
              </>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-semibold">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">كلمة السر</label>
              <div className="relative">
                <KeyRound className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                  minLength={6}
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}
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
    </div>
  );
}
