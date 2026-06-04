import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProject } from "@/lib/admin.functions";
import { resolveImage } from "@/data/projects";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowRight, MapPin, Clock, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const projectQuery = (id: string) =>
  queryOptions({
    queryKey: ["project", id],
    queryFn: async () => {
      const data = await getProject({ data: { id } });
      if (!data) throw notFound();
      return data;
    },
  });

function pickImage(p: { cover_url?: string; cover_image: string }) {
  if (p.cover_url && (p.cover_url.startsWith("http") || p.cover_url.startsWith("/"))) return p.cover_url;
  return resolveImage(p.cover_image);
}

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(projectQuery(params.projectId)),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { data: project } = useSuspenseQuery(projectQuery(projectId));

  const [companyName, setCompanyName] = useState("");
  const [facilityLocation, setFacilityLocation] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !facilityLocation.trim() || !pdfFile) {
      toast.error("جميع الحقول إجبارية");
      return;
    }
    if (pdfFile.type !== "application/pdf") {
      toast.error("الرجاء رفع ملف PDF فقط");
      return;
    }
    if (pdfFile.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 10 ميغابايت");
      return;
    }

    setSubmitting(true);
    try {
      const path = `${project.id}/${Date.now()}-${pdfFile.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("bid-pdfs")
        .upload(path, pdfFile, { contentType: "application/pdf" });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("project_requests").insert({
        project_id: project.id,
        company_name: companyName.trim().slice(0, 200),
        facility_location: facilityLocation.trim().slice(0, 300),
        pdf_url: path,
      });
      if (insErr) throw insErr;

      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Toaster position="top-center" dir="rtl" />

      <article className="container mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-6">
          <ArrowRight className="h-4 w-4" /> العودة للمشاريع
        </Link>

        <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elegant)]">
          <img
            src={pickImage(project)}
            alt={project.name}
            width={1600}
            height={900}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-extrabold">{project.name}</h1>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm">
                <MapPin className="h-4 w-4 text-accent" /> {project.location}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm">
                <Clock className="h-4 w-4 text-accent" /> المدة المتوقعة: {project.duration}
              </span>
            </div>
            <p className="mt-6 text-lg leading-loose text-foreground/85">{project.description}</p>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-bold">معلومات المشروع</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">الموقع</dt>
                  <dd className="font-medium">{project.location}</dd>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">المدة المتوقعة</dt>
                  <dd className="font-medium">{project.duration}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">الحالة</dt>
                  <dd className="font-medium text-accent">مفتوح للعروض</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        <section id="apply" className="mt-16 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)]">
            {done ? (
              <div className="text-center py-8">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h2 className="mt-4 text-2xl font-bold">شكرًا لكم</h2>
                <p className="mt-2 text-muted-foreground">
                  لقد تم إرسال طلبكم بنجاح وسيتم التواصل معكم لاحقًا.
                </p>
                <Link
                  to="/"
                  className="mt-6 inline-flex rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90"
                >
                  استعراض المزيد من المشاريع
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold">تقديم عرض سعر للمشروع</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  املأ النموذج التالي وأرفق ملف PDF لعرض السعر الخاص بك.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <Field label="اسم الشركة / المؤسسة">
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="مثال: شركة البناء الحديث للمقاولات"
                    />
                  </Field>

                  <Field label="موقع المنشأة">
                    <input
                      type="text"
                      required
                      maxLength={300}
                      value={facilityLocation}
                      onChange={(e) => setFacilityLocation(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="مثال: الرياض - حي العليا - شارع الملك فهد"
                    />
                  </Field>

                  <Field label="ملف PDF لعرض السعر">
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-5 text-sm hover:bg-secondary transition">
                      <Upload className="h-5 w-5 text-accent" />
                      <span className="flex-1 text-muted-foreground">
                        {pdfFile ? pdfFile.name : "اضغط لاختيار ملف PDF (الحد الأقصى 10 ميغابايت)"}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        required
                        onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                    </label>
                  </Field>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-accent)] px-6 py-3 text-base font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    تقديم الطلب
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </article>

      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">
        {label} <span className="text-destructive">*</span>
      </label>
      {children}
    </div>
  );
}
