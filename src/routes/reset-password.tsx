import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { changePassword, getMe } from "@/lib/auth.functions";
import { SiteHeader } from "@/components/site-header";
import { Loader2, KeyRound } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const doChange = useServerFn(changePassword);
  const doGetMe = useServerFn(getMe);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    doGetMe().then((me) => {
      if (!me) navigate({ to: "/auth", replace: true });
    });
  }, [doGetMe, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) return setError("كلمتا المرور غير متطابقتين");
    if (password.length < 6) return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    setLoading(true);
    try {
      await doChange({ data: { currentPassword: current, newPassword: password } });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-accent-foreground">
              <KeyRound className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold">تغيير كلمة المرور</h1>
          </div>
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-emerald-600">تم تغيير كلمة المرور بنجاح.</p>
              <Link to="/admin" className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background hover:bg-foreground/90">
                لوحة التحكم
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">كلمة المرور الحالية</label>
                <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">كلمة المرور الجديدة</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" minLength={6} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">تأكيد كلمة المرور</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" minLength={6} />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <button type="submit" disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background hover:bg-foreground/90 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                حفظ كلمة المرور
              </button>
              <Link to="/admin" className="block text-center text-xs text-muted-foreground hover:text-foreground">إلغاء</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
