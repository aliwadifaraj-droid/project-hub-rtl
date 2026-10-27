import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Building2, Loader2, Save } from "lucide-react";
import { getProjectOwnerSession, createOwnerProject } from "@/lib/project-owner.functions";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";

export const Route = createFileRoute("/project-owner/new")({
  ssr: false,
  beforeLoad: async () => {
    const session = await getProjectOwnerSession();
    if (!session) throw redirect({ to: "/project-owner-login" });
    return { session };
  },
  component: NewOwnerProjectPage,
});

function NewOwnerProjectPage() {
  const navigate = useNavigate();
  const create = useServerFn(createOwnerProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await create({ data: { name, description, location, duration } });
      toast.success("تم إرسال المشروع للمراجعة");
      navigate({ to: "/project-owner", replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ المشروع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <Link to="/project-owner" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
            <ArrowRight className="h-4 w-4" /> العودة إلى لوحة صاحب المشروع
          </Link>

          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
            <header className="bg-[image:var(--gradient-hero)] px-6 py-8 text-primary-foreground sm:px-9">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-accent)] text-accent-foreground">
                  <Building2 className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm opacity-80">لوحة صاحب المشروع</p>
                  <h1 className="text-2xl font-extrabold">إضافة مشروع جديد</h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 opacity-85">أدخل بيانات المشروع لإرساله إلى فريق المنصة للمراجعة والنشر.</p>
            </header>

            <form onSubmit={submit} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-9">
              <div className="sm:col-span-2">
                <label htmlFor="project-name" className="mb-1.5 block text-sm font-semibold">اسم المشروع</label>
                <input id="project-name" required value={name} onChange={(event) => setName(event.target.value)} className="inp" />
              </div>
              <div>
                <label htmlFor="project-location" className="mb-1.5 block text-sm font-semibold">الموقع</label>
                <input id="project-location" required value={location} onChange={(event) => setLocation(event.target.value)} className="inp" />
              </div>
              <div>
                <label htmlFor="project-duration" className="mb-1.5 block text-sm font-semibold">مدة التنفيذ</label>
                <input id="project-duration" required value={duration} onChange={(event) => setDuration(event.target.value)} className="inp" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="project-description" className="mb-1.5 block text-sm font-semibold">وصف المشروع</label>
                <textarea id="project-description" required rows={6} value={description} onChange={(event) => setDescription(event.target.value)} className="inp resize-y" />
              </div>
              {error ? <div className="sm:col-span-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
              <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                <Link to="/project-owner" className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition hover:bg-secondary">إلغاء</Link>
                <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {busy ? "جارٍ الحفظ..." : "إرسال للمراجعة"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
