import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { signInClient, signUpClient, getClientSession } from "@/lib/client.functions";
import { SiteHeader } from "@/components/site-header";
import { SAUDI_CITIES } from "@/lib/saudi-cities";
import { Loader2, Lock, UserPlus } from "lucide-react";

export const Route = createFileRoute("/client-login")({
  component: ClientLoginPage,
});

function ClientLoginPage() {
  const navigate = useNavigate();
  const doSignIn = useServerFn(signInClient);
  const doSignUp = useServerFn(signUpClient);
  const fetchSession = useServerFn(getClientSession);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession()
      .then((s) => {
        if (s) navigate({ to: "/client-portal", replace: true });
      })
      .catch(() => undefined);
  }, [fetchSession, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await doSignIn({ data: { email, password } });
      } else {
        if (!companyName.trim()) throw new Error("اسم الشركة مطلوب");
        if (!phone.trim()) throw new Error("رقم الجوال مطلوب");
        if (!city.trim()) throw new Error("المدينة مطلوبة");
        await doSignUp({
          data: { email, password, company_name: companyName, phone, city, cr_number: crNumber, bio },
        });
      }
      navigate({ to: "/client-portal", replace: true });
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
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              {isLogin ? <Lock className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </span>
            <div>
              <h1 className="text-2xl font-bold">
                {isLogin ? "دخول لوحة العملاء" : "تسجيل عميل جديد"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin ? "سجّل دخولك لمتابعة عروضك وتقديم عروض جديدة" : "أنشئ حسابك لتقديم عروض الأسعار ومتابعتها"}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">اسم الشركة / المنشأة *</label>
                  <input
                    type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    className="inp" placeholder="مثال: شركة المقاولات المتقدمة"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">رقم الجوال *</label>
                  <input
                    type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="inp" placeholder="05xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">المدينة *</label>
                  <select
                    required value={city} onChange={(e) => setCity(e.target.value)}
                    className="inp"
                  >
                    <option value="">اختر المدينة</option>
                    {SAUDI_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">رقم السجل التجاري (اختياري)</label>
                  <input
                    type="text" value={crNumber} onChange={(e) => setCrNumber(e.target.value)}
                    className="inp" placeholder="1010xxxxxx"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">نبذة عن الشركة (اختياري)</label>
                  <textarea
                    value={bio} onChange={(e) => setBio(e.target.value)}
                    className="inp min-h-[80px]" placeholder="نبذة مختصرة عن شركتك"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold">البريد الإلكتروني *</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="inp" placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">كلمة المرور *</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="inp" minLength={6}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background transition hover:bg-foreground/90 disabled:opacity-60"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary"
            >
              {isLogin ? "إنشاء حساب جديد" : "العودة لتسجيل الدخول"}
            </button>
            <Link to="/" className="block text-center text-xs text-muted-foreground transition hover:text-foreground">
              العودة للموقع
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
