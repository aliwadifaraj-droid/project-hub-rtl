import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Loader2, Lock, UserPlus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SAUDI_CITIES } from "@/lib/saudi-cities";
import { getProjectOwnerSession, signInProjectOwner, signUpProjectOwner } from "@/lib/project-owner.functions";

export const Route = createFileRoute("/project-owner-login")({ component: ProjectOwnerLoginPage });

type Mode = "login" | "signup";

function ProjectOwnerLoginPage() {
  const navigate = useNavigate();
  const getSession = useServerFn(getProjectOwnerSession);
  const signIn = useServerFn(signInProjectOwner);
  const signUp = useServerFn(signUpProjectOwner);
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ email: "", password: "", company_name: "", phone: "", city: "", cr_number: "", bio: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSession().then((session) => { if (session) navigate({ to: "/project-owner", replace: true }); }).catch(() => undefined);
  }, [getSession, navigate]);

  function updateField(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      if (mode === "login") await signIn({ data: { email: form.email, password: form.password } });
      else await signUp({ data: form });
      navigate({ to: "/project-owner", replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "حدث خطأ"); }
    finally { setBusy(false); }
  }

  const isLogin = mode === "login";
  return <div className="min-h-screen bg-background" dir="rtl">
    <SiteHeader />
    <main className="container mx-auto px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
        <div className="bg-[image:var(--gradient-hero)] px-6 py-8 text-primary-foreground sm:px-10">
          <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-accent)] text-accent-foreground"><Building2 /></span><div><p className="text-sm opacity-80">منصة العمران</p><h1 className="text-2xl font-extrabold sm:text-3xl">لوحة صاحب المشروع</h1></div></div>
          <p className="mt-4 max-w-md text-sm leading-7 opacity-85">أنشئ مشاريعك وتابع الطلبات الواردة من العملاء في مكان واحد.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6 sm:p-10">
          {!isLogin && <>
            <div><label className="mb-1.5 block text-sm font-semibold">اسم الشركة / المنشأة *</label><input className="inp" required value={form.company_name} onChange={(e) => updateField("company_name", e.target.value)} placeholder="مثال: شركة البناء المتقدم" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-semibold">رقم الجوال *</label><input className="inp" required value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="05xxxxxxxx" /></div><div><label className="mb-1.5 block text-sm font-semibold">المدينة *</label><select className="inp" required value={form.city} onChange={(e) => updateField("city", e.target.value)}><option value="">اختر المدينة</option>{SAUDI_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></div></div>
            <div><label className="mb-1.5 block text-sm font-semibold">رقم السجل التجاري</label><input className="inp" value={form.cr_number} onChange={(e) => updateField("cr_number", e.target.value)} /></div>
            <div><label className="mb-1.5 block text-sm font-semibold">نبذة عن الشركة</label><textarea className="inp min-h-24" value={form.bio} onChange={(e) => updateField("bio", e.target.value)} /></div>
          </>}
          <div><label className="mb-1.5 block text-sm font-semibold">البريد الإلكتروني *</label><input className="inp" type="email" required value={form.email} onChange={(e) => updateField("email", e.target.value)} /></div>
          <div><label className="mb-1.5 block text-sm font-semibold">كلمة المرور *</label><input className="inp" type="password" minLength={6} required value={form.password} onChange={(e) => updateField("password", e.target.value)} /></div>
          {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? <Lock className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{isLogin ? "تسجيل الدخول" : "إنشاء حساب صاحب مشروع"}</button>
          <button type="button" onClick={() => { setMode(isLogin ? "signup" : "login"); setError(null); }} className="w-full rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-secondary">{isLogin ? "إنشاء حساب جديد" : "العودة لتسجيل الدخول"}</button>
          <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">العودة للموقع</Link>
        </form>
      </div>
    </main>
  </div>;
}
