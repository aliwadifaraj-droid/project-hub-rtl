import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Building2, Loader2, Save, Upload } from "lucide-react";
import { getProjectOwnerSession, createOwnerProject } from "@/lib/project-owner.functions";
import { uploadFile as uploadStoredFile } from "@/lib/files.functions";
import { SAUDI_CITIES } from "@/lib/saudi-cities";
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

type ProjectForm = {
  name: string;
  description: string;
  location: string;
  duration: string;
  cover_image: string;
  images: string[];
  pdf_file: string;
};

function NewOwnerProjectPage() {
  const navigate = useNavigate();
  const create = useServerFn(createOwnerProject);
  const upload = useServerFn(uploadStoredFile);
  const [form, setForm] = useState<ProjectForm>({ name: "", description: "", location: "", duration: "", cover_image: "", images: [], pdf_file: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File, purpose: "project-image" | "bid-pdf"): Promise<string> {
    const data = await fileToBase64(file);
    const result = await upload({ data: { filename: file.name, mime: file.type, purpose, data } });
    return result.key;
  }

  async function onCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const key = await uploadFile(file, "project-image");
      setForm((current) => ({ ...current, cover_image: key }));
      toast.success("تم رفع صورة الغلاف");
    } catch {
      toast.error("فشل رفع صورة الغلاف");
    } finally {
      setUploading(false);
    }
  }

  async function onGallery(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const keys = await Promise.all(files.map((file) => uploadFile(file, "project-image")));
      setForm((current) => ({ ...current, images: [...current.images, ...keys] }));
      toast.success("تم رفع الصور");
    } catch {
      toast.error("فشل رفع الصور");
    } finally {
      setUploading(false);
    }
  }

  async function onPdf(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("الملف يجب أن يكون PDF");
      return;
    }
    setUploading(true);
    try {
      const key = await uploadFile(file, "bid-pdf");
      setForm((current) => ({ ...current, pdf_file: key }));
      toast.success("تم رفع ملف PDF");
    } catch {
      toast.error("فشل رفع ملف PDF");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await create({ data: form });
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
              <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-accent)] text-accent-foreground"><Building2 className="h-6 w-6" /></span><div><p className="text-sm opacity-80">لوحة صاحب المشروع</p><h1 className="text-2xl font-extrabold">إضافة مشروع جديد</h1></div></div>
              <p className="mt-4 text-sm leading-7 opacity-85">أدخل بيانات المشروع بنفس نموذج إضافة المشاريع في لوحة الإدارة.</p>
            </header>
            <form onSubmit={submit} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-9">
              <Field label="اسم المشروع"><input className="inp" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="الوصف"><textarea rows={4} className="inp" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field></div>
              <Field label="الموقع"><select className="inp" required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}><option value="" disabled>اختر المدينة</option>{SAUDI_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></Field>
              <Field label="المدة المتوقعة"><input className="inp" required value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></Field>
              <UploadField label="صورة الغلاف" value={form.cover_image || "اختر صورة"} accept="image/*" onChange={onCover} required />
              <UploadField label={`معرض الصور (${form.images.length})`} value="إضافة صور" accept="image/*" multiple onChange={onGallery} />
              <UploadField label="ملف PDF (اختياري)" value={form.pdf_file || "اختر ملف PDF"} accept="application/pdf" onChange={onPdf} />
              {error ? <div className="sm:col-span-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
              <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row"><button type="submit" disabled={busy || uploading || !form.name || !form.cover_image} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">{busy || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{busy ? "جارٍ الحفظ..." : uploading ? "جارٍ رفع الملفات..." : "إرسال للمراجعة"}</button><Link to="/project-owner" className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold transition hover:bg-secondary">إلغاء</Link></div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-semibold">{label}</label>{children}</div>;
}

function UploadField({ label, value, accept, multiple, required, onChange }: { label: string; value: string; accept: string; multiple?: boolean; required?: boolean; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return <div className="sm:col-span-2"><Field label={label}><label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-3 py-3 text-sm hover:bg-secondary"><Upload className="h-4 w-4" /><span className="flex-1 truncate text-muted-foreground">{value}</span><input type="file" accept={accept} multiple={multiple} required={required} className="hidden" onChange={onChange} /></label></Field></div>;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
