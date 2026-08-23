import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requestPasswordReset } from "@/lib/auth.functions";
import { SiteHeader } from "@/components/site-header";
import { Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const doRequest = useServerFn(requestPasswordReset);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await doRequest({ data: { email } });
      setSent(true);
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
              <Mail className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold">نسيت كلمة السر؟</h1>
          </div>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-emerald-600">
                تم إرسال رابط إعادة التعيين لو كان البريد الإلكتروني صحيحاً ومسجلاً لدينا.
              </p>
              <Link to="/auth" className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background hover:bg-foreground/90">
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">البريد الإلكتروني</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <button
                type="submit" disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-bold text-background hover:bg-foreground/90 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                إرسال رابط إعادة التعيين
              </button>
              <Link to="/auth" className="block text-center text-xs text-muted-foreground hover:text-foreground">العودة لتسجيل الدخول</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
