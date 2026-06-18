import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitVisitorAd } from "@lib/ads.functions";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload, X, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/submit-project")({
  head: () => ({
    meta: [
      { title: "أضف مشروعك — منصة المقاولات" },
      { name: "description", content: "أرسل مشروعك ليتم مراجعته ونشره على المنصة." },
    ],
  }),
  component: SubmitProjectPage,
});

function SubmitProjectPage() {
  const submitAd = useServerFn(submitVisitorAd);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: حجم الصورة أكبر من 5 ميغابايت`);
        continue;
      }
      if (next.length >= 8) break;
      next.push(f);
    }
    setFiles(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !location.trim() || !phone.trim()) {
      toast.error("جميع الحقول الأساسية إجبارية");
      return;
    }
    setSubmitting(true);
    try {
      const uploadedPaths: string[] = [];
      for (const f of files) {
        const safe = f.name.replace(/[^\w.\-]/g, "_").slice(-80);
        const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("project-images")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (upErr) throw new Error(upErr.message);
        uploadedPaths.push(supabase.storage.from("projects").getPublicUrl(path).data.publicUrl);
      }
      const result = await submitAd({
        data: {
          title: name.trim(),
          description: `${description.trim()}\n\n📍 ${location.trim()}\n📞 ${phone.trim()}`,
          image_path: uploadedPaths[0] ?? "",
          domain: "",
        },
      });
      if (!result?.id) {
        throw new Error("لم يتم حفظ الإعلان في قاعدة البيانات");
      }
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "تعذر إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  }



  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <SiteHeader />
      <Toaster position="top-center" dir="rtl" />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-6">
          <ArrowRight className="h-4 w-4" /> العودة للرئيسية
        </Link>

        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]">
          {done ? (
            <div className="text-center py-8">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h1 className="mt-4 text-2xl font-bold">تم استلام طلبكم بنجاح</h1>
              <p className="mt-2 text-muted-foreground">سيتم التواصل معكم لاحقاً.</p>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
              >
                العودة للرئيسية
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-extrabold">أضف مشروعك</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                املأ التفاصيل وسيتم مراجعة طلبكم قبل النشر.
              </p>
              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <Field label="اسم المشروع">
                  <input
                    required maxLength={200}
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <Field label="وصف المشروع">
                  <textarea
                    required maxLength={5000} rows={5}
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <Field label="الموقع">
                  <input
                    required maxLength={300}
                    value={location} onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <Field label="رقم التواصل">
                  <input
                    required maxLength={40}
                    inputMode="tel"
                    placeholder="مثال: 0501234567"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>

                <Field label="صور المشروع (اختياري — حتى 8 صور)">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-5 text-sm hover:bg-secondary transition">
                    <Upload className="h-5 w-5 text-accent" />
                    <span className="flex-1 text-muted-foreground">
                      اضغط لاختيار صور (PNG/JPG/WEBP — حتى 5 ميغابايت لكل صورة)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                      className="hidden"
                    />
                  </label>
                  {files.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {files.map((f, i) => (
                        <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-border">
                          <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                            className="absolute top-1 left-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground hover:bg-background"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  إرسال الطلب
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}
